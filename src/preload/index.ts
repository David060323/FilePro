import { contextBridge, ipcRenderer, webUtils } from 'electron'

const api = {
  openFiles: (options?: { filters?: { name: string; extensions: string[] }[] }) =>
    ipcRenderer.invoke('dialog:openFiles', options),
  openFolder: () => ipcRenderer.invoke('dialog:openFolder'),
  openPath: (p: string) => ipcRenderer.invoke('shell:openPath', p),

  // 安全获取拖拽文件的绝对路径
  getFilePath: (file: File): string => {
    try { return webUtils.getPathForFile(file) }
    catch { return (file as any).path || '' }
  },

  htmlToPdf: (src: string, outDir: string | null) =>
    ipcRenderer.invoke('convert:html-to-pdf', src, outDir),
  htmlToImage: (src: string, format: string, outDir: string | null) =>
    ipcRenderer.invoke('convert:html-to-image', src, format, outDir),
  imageConvert: (src: string, format: string, outDir: string | null) =>
    ipcRenderer.invoke('convert:image', src, format, outDir),
  imageToPdf: (files: string[], outDir: string | null) =>
    ipcRenderer.invoke('convert:image-to-pdf', files, outDir),
  imageCompress: (src: string, quality: number, outDir: string | null) =>
    ipcRenderer.invoke('convert:image-compress', src, quality, outDir),
  imageResize: (src: string, w: number, h: number, outDir: string | null) =>
    ipcRenderer.invoke('convert:image-resize', src, w, h, outDir),

  pdfMerge: (files: string[], outDir: string | null) =>
    ipcRenderer.invoke('convert:pdf-merge', files, outDir),
  pdfSplit: (src: string, outDir: string | null) =>
    ipcRenderer.invoke('convert:pdf-split', src, outDir),
  pdfExtract: (src: string, pages: number[], outDir: string | null) =>
    ipcRenderer.invoke('convert:pdf-extract', src, pages, outDir),

  batchRename: (files: string[], prefix: string, start: number, outDir: string | null) =>
    ipcRenderer.invoke('convert:batch-rename', files, prefix, start, outDir)
}

contextBridge.exposeInMainWorld('api', api)
