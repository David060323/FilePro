import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import path, { join, basename, extname } from 'path'
import fs from 'fs'
import { pathToFileURL } from 'url'
import { PDFDocument } from 'pdf-lib'
import sharp from 'sharp'

let mainWindow: BrowserWindow | null = null

function outPath2(src: string, outDir: string | null, ext: string): string {
  const base = basename(src, extname(src))
  return join(outDir || path.dirname(src), base + ext)
}

function fmtExt(format: string): string {
  const m: Record<string, string> = {
    pdf: '.pdf', png: '.png', jpg: '.jpg', jpeg: '.jpg',
    webp: '.webp', gif: '.gif', bmp: '.bmp', tiff: '.tiff'
  }
  return m[format.toLowerCase()] || '.' + format.toLowerCase()
}

async function htmlTo(src: string, outPath: string, type: 'pdf' | 'png' | 'jpg') {
  if (!fs.existsSync(src)) throw new Error('文件不存在: ' + src)
  return new Promise<void>((resolve, reject) => {
    const win = new BrowserWindow({
      show: false, width: 1200, height: 900,
      webPreferences: { nodeIntegration: false, contextIsolation: true }
    })
    const timer = setTimeout(() => { win.close(); reject(new Error('页面加载超时')) }, 30000)
    let resolved = false
    const done = (err?: any) => {
      if (resolved) return; resolved = true
      clearTimeout(timer)
      if (win && !win.isDestroyed()) win.close()
      err ? reject(err) : resolve()
    }
    win.webContents.on('did-finish-load', async () => {
      try {
        if (type === 'pdf') {
          const data = await win.webContents.printToPDF({ printBackground: true, preferCSSPageSize: true })
          fs.writeFileSync(outPath, data)
        } else {
          const img = await win.webContents.capturePage()
          const buf = type === 'jpg'
            ? await sharp(img.toPNG()).jpeg({ quality: 92 }).toBuffer()
            : img.toPNG()
          fs.writeFileSync(outPath, buf)
        }
        done()
      } catch (e) { done(e) }
    })
    win.webContents.on('did-fail-load', (_, code, desc) => {
      done(new Error('页面加载失败: ' + desc + ' (code ' + code + ')'))
    })
    // 使用 pathToFileURL 正确处理中文路径
    const fileUrl = pathToFileURL(path.resolve(src)).href
    win.loadURL(fileUrl)
  })
}

async function imageConvert(src: string, outPath: string, format: string) {
  let s = sharp(src)
  switch (format) {
    case 'jpg': case 'jpeg': s = s.jpeg({ quality: 92 }); break
    case 'webp': s = s.webp({ quality: 92 }); break
    case 'png': s = s.png(); break
    case 'gif': s = s.gif(); break
    case 'tiff': s = s.tiff(); break
    case 'bmp': await sharp(src).png().toFile(outPath); return
    default: throw new Error('不支持的格式: ' + format)
  }
  await s.toFile(outPath)
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280, height: 820, minWidth: 960, minHeight: 640,
    show: false, title: 'FilePro 全能格式转换器',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true, nodeIntegration: false, sandbox: false
    }
  })
  mainWindow.on('ready-to-show', () => mainWindow?.show())
  mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
})
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })

// ── IPC: 对话框 ──────────────────────────────────────────
ipcMain.handle('dialog:openFiles', async (_, options) => {
  const r = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile', 'multiSelections'],
    filters: options?.filters || [{ name: '所有文件', extensions: ['*'] }]
  })
  if (r.canceled) return []
  return r.filePaths.map(fp => ({
    path: fp, name: basename(fp), ext: extname(fp).toLowerCase(), size: fs.statSync(fp).size
  }))
})
ipcMain.handle('dialog:openFolder', async () => {
  const r = await dialog.showOpenDialog(mainWindow!, { properties: ['openDirectory', 'createDirectory'] })
  return r.canceled ? null : r.filePaths[0]
})
ipcMain.handle('shell:openPath', async (_, p) => shell.openPath(p))

// ── IPC: HTML 转换 ──────────────────────────────────────
ipcMain.handle('convert:html-to-pdf', async (_, src: string, outDir: string | null) => {
  const out = outPath2(src, outDir, '.pdf')
  await htmlTo(src, out, 'pdf')
  return { success: true, output: out }
})
ipcMain.handle('convert:html-to-image', async (_, src: string, format: string, outDir: string | null) => {
  const out = outPath2(src, outDir, fmtExt(format))
  await htmlTo(src, out, format as 'png' | 'jpg')
  return { success: true, output: out }
})

// ── IPC: 图片转换 ──────────────────────────────────────
ipcMain.handle('convert:image', async (_, src: string, format: string, outDir: string | null) => {
  if (!fs.existsSync(src)) throw new Error('文件不存在: ' + src)
  const out = outPath2(src, outDir, fmtExt(format))
  await imageConvert(src, out, format)
  return { success: true, output: out }
})
ipcMain.handle('convert:image-compress', async (_, src: string, quality: number, outDir: string | null) => {
  if (!fs.existsSync(src)) throw new Error('文件不存在: ' + src)
  const q = Math.floor(quality * 100)
  const ext = extname(src).toLowerCase()
  const out = join(outDir || path.dirname(src), basename(src, ext) + '_compressed' + ext)
  if (ext === '.png') await sharp(src).png({ quality: q, compressionLevel: 9 }).toFile(out)
  else if (ext === '.webp') await sharp(src).webp({ quality: q }).toFile(out)
  else await sharp(src).jpeg({ quality: q, mozjpeg: true }).toFile(out)
  return { success: true, output: out }
})
ipcMain.handle('convert:image-to-pdf', async (_, files: string[], outDir: string | null) => {
  const missing = files.filter(f => !fs.existsSync(f))
  if (missing.length) throw new Error('以下文件不存在:\n' + missing.join('\n'))
  const first = files[0]
  const out = outDir
    ? join(outDir, basename(first, extname(first)) + '.pdf')
    : path.join(path.dirname(first), basename(first, extname(first)) + '.pdf')
  const doc = await PDFDocument.create()
  for (const fp of files) {
    const img = sharp(fp)
    const meta = await img.metadata()
    const w = meta.width || 595; const h = meta.height || 842
    let buf: Buffer; let ef: 'embedPng' | 'embedJpg'
    if (meta.format === 'png') { buf = await img.png().toBuffer(); ef = 'embedPng' }
    else { buf = await img.jpeg({ quality: 92 }).toBuffer(); ef = 'embedJpg' }
    const page = doc.addPage([w, h])
    const e = ef === 'embedPng' ? await doc.embedPng(buf) : await doc.embedJpg(buf)
    const s = Math.min((w - 40) / e.width, (h - 40) / e.height)
    page.drawImage(e, {
      x: (w - e.width * s) / 2, y: (h - e.height * s) / 2,
      width: e.width * s, height: e.height * s
    })
  }
  fs.writeFileSync(out, await doc.save())
  return { success: true, output: out }
})
ipcMain.handle('convert:image-resize', async (_, src: string, w: number, h: number, outDir: string | null) => {
  if (!fs.existsSync(src)) throw new Error('文件不存在: ' + src)
  const dir = outDir || path.dirname(src)
  const ext = extname(src)
  const out = join(dir, basename(src, ext) + '_裁剪' + ext)
  await sharp(src).resize(w || undefined, h || undefined, { fit: 'inside', withoutEnlargement: true }).toFile(out)
  return { success: true, output: out }
})

// ── IPC: PDF 操作 ──────────────────────────────────────
ipcMain.handle('convert:pdf-merge', async (_, files: string[], outDir: string | null) => {
  const missing: string[] = []
  for (const fp of files) { if (!fs.existsSync(fp)) missing.push(fp) }
  if (missing.length > 0) throw new Error('以下文件不存在:\n' + missing.join('\n'))

  const doc = await PDFDocument.create()
  for (const fp of files) {
    const buf = fs.readFileSync(fp)
    let src: PDFDocument
    try { src = await PDFDocument.load(buf, { ignoreEncryption: true }) }
    catch { throw new Error('无法读取: ' + fp) }
    const pages = await doc.copyPages(src, src.getPageIndices())
    pages.forEach(p => doc.addPage(p))
  }
  const first = files[0]
  const out = outDir
    ? join(outDir, '合并_' + basename(first))
    : join(path.dirname(first), '合并_' + basename(first))
  fs.writeFileSync(out, await doc.save())
  return { success: true, output: out }
})

ipcMain.handle('convert:pdf-split', async (_, src: string, outDir: string | null) => {
  if (!fs.existsSync(src)) throw new Error('文件不存在: ' + src)
  const srcDoc = await PDFDocument.load(fs.readFileSync(src), { ignoreEncryption: true })
  const count = srcDoc.getPageCount()
  const dir = outDir || path.dirname(src)
  const base = basename(src, extname(src))
  const outputs: string[] = []
  for (let i = 0; i < count; i++) {
    const doc = await PDFDocument.create()
    const [page] = await doc.copyPages(srcDoc, [i])
    doc.addPage(page)
    const out = join(dir, `${base}_第${i + 1}页.pdf`)
    fs.writeFileSync(out, await doc.save())
    outputs.push(out)
  }
  return { success: true, output: outputs[0], outputs }
})

ipcMain.handle('convert:pdf-extract', async (_, src: string, pages: number[], outDir: string | null) => {
  if (!fs.existsSync(src)) throw new Error('文件不存在: ' + src)
  const srcDoc = await PDFDocument.load(fs.readFileSync(src), { ignoreEncryption: true })
  const total = srcDoc.getPageCount()
  const valid = pages.filter(p => p >= 1 && p <= total)
  if (valid.length === 0) throw new Error('没有有效的页码范围 (1-' + total + ')')
  const newDoc = await PDFDocument.create()
  const copied = await newDoc.copyPages(srcDoc, valid.map(p => p - 1))
  copied.forEach(p => newDoc.addPage(p))
  const dir = outDir || path.dirname(src)
  const out = join(dir, basename(src, extname(src)) + '_提取.pdf')
  fs.writeFileSync(out, await newDoc.save())
  return { success: true, output: out }
})

// ── IPC: 批量 ──────────────────────────────────────────
ipcMain.handle('convert:batch-rename', async (_, files: string[], prefix: string, start: number, outDir: string | null) => {
  const outputs: string[] = []
  for (let i = 0; i < files.length; i++) {
    const ext = extname(files[i])
    const num = String(start + i).padStart(3, '0')
    const newName = (prefix || 'file') + '_' + num + ext
    const dir2 = outDir || path.dirname(files[i])
    const newPath = join(dir2, newName)
    fs.renameSync(files[i], newPath)
    outputs.push(newPath)
  }
  return { success: true, outputs }
})
