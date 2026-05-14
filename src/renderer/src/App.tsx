import React, { useState, useMemo, useCallback } from 'react'
import Sidebar from './components/Sidebar'
import CardGrid from './components/CardGrid'
import RightPanel from './components/RightPanel'
import { functionCards, categories } from './data'
import { Sun, Moon, Search, Command } from 'lucide-react'

export interface HistoryEntry {
  id: string
  fileName: string
  sourceFormat: string
  targetFormat: string
  outputPath: string
  timestamp: number
  size: number
}

export default function App() {
  const [category, setCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [darkMode, setDarkMode] = useState(true)
  const [files, setFiles] = useState<FileItem[]>([])
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [converting, setConverting] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })

  const filtered = useMemo(() => {
    let cards = category === 'all'
      ? functionCards
      : functionCards.filter(c => c.category === category)
    if (search.trim()) {
      const q = search.toLowerCase()
      cards = cards.filter(c =>
        c.title.includes(q) || c.description.includes(q) || c.category.includes(q)
      )
    }
    return cards
  }, [category, search])

  const currentCat = categories.find(c => c.id === category)?.name || '全部功能'

  // ── 文件管理 ──────────────────────────────
  const addFiles = useCallback((newFiles: FileItem[]) => {
    setFiles(prev => {
      const paths = new Set(prev.map(f => f.path))
      return [...prev, ...newFiles.filter(f => !paths.has(f.path))]
    })
  }, [])

  const removeFile = useCallback((p: string) => {
    setFiles(prev => prev.filter(f => f.path !== p))
  }, [])

  const clearFiles = useCallback(() => setFiles([]), [])

  const [toast, setToast] = useState<string | null>(null)
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  // ── 转换逻辑 ──────────────────────────────
  const runConvert = useCallback(async (cardId: string) => {
    if (files.length === 0 || converting) return null
    if (!window.api) { showToast('API 未就绪，请重启应用'); return null }

    setConverting(true)
    setProgress({ current: 0, total: files.length })

    const results: { ok: number; failed: string[]; outputs: string[] } = {
      ok: 0, failed: [], outputs: []
    }

    const imageExts = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.tiff']
    const htmlExts = ['.html', '.htm']
    const pdfExts = ['.pdf']

    try {
      for (let i = 0; i < files.length; i++) {
        const f = files[i]
        const ext = f.ext.toLowerCase()
        const api = window.api

        try {
          let result: ConvertResult | null = null

          // ── 根据卡片 ID 选择转换 ──
          switch (cardId) {
            // ── PDF 工具 ──
            case 'pdf-merge': {
              const pdfFiles = files.filter(ff => pdfExts.includes(ff.ext.toLowerCase())).map(ff => ff.path)
              if (pdfFiles.length < 2) { results.failed.push('至少需要 2 个 PDF'); break }
              result = await api.pdfMerge(pdfFiles, null)
              i = files.length; break
            }
            case 'pdf-split':
              if (!pdfExts.includes(ext)) { results.failed.push(f.name + ': 不是 PDF'); break }
              result = await api.pdfSplit(f.path, null)
              break
            case 'pdf-extract':
              if (!pdfExts.includes(ext)) { results.failed.push(f.name + ': 不是 PDF'); break }
              result = await api.pdfExtract(f.path, [1], null)  // 默认提取第1页，后续可交互选择
              break
            // ── 文档 ──
            case 'html-to-pdf':
            case 'doc-to-html':
              if (!htmlExts.includes(ext)) { results.failed.push(f.name + ': 不是 HTML'); break }
              result = await api.htmlToPdf(f.path, null)
              break
            // ── 图片工具 ──
            case 'image-to-pdf': {
              const imgFiles = files.filter(ff => imageExts.includes(ff.ext.toLowerCase())).map(ff => ff.path)
              if (imgFiles.length === 0) { results.failed.push('没有图片文件'); break }
              result = await api.imageToPdf(imgFiles, null)
              i = files.length; break
            }
            case 'image-convert':
              if (!imageExts.includes(ext)) { results.failed.push(f.name + ': 不是图片'); break }
              result = await api.imageConvert(f.path, 'png', null)
              break
            case 'image-compress':
              if (!imageExts.includes(ext)) { results.failed.push(f.name + ': 不是图片'); break }
              result = await api.imageCompress(f.path, 0.7, null)
              break
            case 'image-resize':
              if (!imageExts.includes(ext)) { results.failed.push(f.name + ': 不是图片'); break }
              result = await api.imageResize(f.path, 800, 600, null)
              break
            case 'html-to-image':
              if (!htmlExts.includes(ext)) { results.failed.push(f.name + ': 不是 HTML'); break }
              result = await api.htmlToImage(f.path, 'png', null)
              break
            // ── 批量 ──
            case 'batch-rename': {
              const allFiles = files.map(ff => ff.path)
              result = await api.batchRename(allFiles, 'filepro', 1, null)
              i = files.length; break
            }
            default:
              results.failed.push('未知功能: ' + cardId)
              continue
          }

          if (result?.success) {
            if (result.outputs) {
              // 有多个输出（如 PDF 拆分、批量重命名）
              result.outputs.forEach(o => results.outputs.push(o))
              results.ok += (files.length > 1 ? 1 : result.outputs.length)
            } else if (result.output) {
              results.ok++
              results.outputs.push(result.output)
            }
            if (result.output) {
              const outExt = result.output.split('.').pop() || 'out'
              setHistory(prev => [{
                id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
                fileName: f.name,
                sourceFormat: f.ext.replace('.', ''),
                targetFormat: outExt,
                outputPath: result.output,
                timestamp: Date.now(),
                size: f.size
              }, ...prev].slice(0, 50))
            }
          } else {
            results.failed.push(f.name + (result?.fallback ? ` (${result.fallback})` : ''))
          }
        } catch (e: any) {
          results.failed.push(f.name + ': ' + (e.message || '未知错误'))
        }

        setProgress({ current: i + 1, total: files.length })
      }
    } finally {
      setConverting(false)
    }

    const msg = results.ok > 0
      ? `完成！成功 ${results.ok} 个` + (results.failed.length ? `，失败 ${results.failed.length} 个` : '')
      : `失败: ${results.failed.join(', ') || '未知错误'}`
    showToast(msg)

    return results
  }, [files, converting])

  // ── 卡片点击 ──────────────────────────────
  const handleCardClick = useCallback(async (cardId: string) => {
    if (files.length === 0) {
      showToast('请先在右侧面板添加文件')
      return
    }
    const results = await runConvert(cardId)
    if (!results || results.outputs.length === 0) return
    try {
      const d = results.outputs[0].substring(0, results.outputs[0].lastIndexOf('\\'))
      window.api.openPath(d)
    } catch (_) {}
  }, [runConvert])

  return (
    <div className={`h-screen flex flex-col ${darkMode ? 'dark' : ''}`}>
      {/* 顶部栏 */}
      <header className="flex items-center h-14 px-4 gap-4 bg-white dark:bg-[#252536]
                        border-b border-gray-200 dark:border-gray-700 shrink-0">
        <div className="flex items-center gap-2 min-w-[160px]">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Command size={18} className="text-white" />
          </div>
          <span className="font-bold text-lg text-gray-800 dark:text-white">FilePro</span>
        </div>

        <div className="flex-1 max-w-2xl relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text" placeholder="搜索功能...（如：PDF 转 Word、图片压缩）"
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-4 rounded-lg bg-gray-100 dark:bg-[#363648]
                       text-sm text-gray-800 dark:text-gray-200
                       placeholder-gray-400 border-0 outline-none
                       focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </div>

        <div className="flex items-center gap-1">
          <button onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#363648]
                       text-gray-500 dark:text-gray-400 transition-colors"
            title={darkMode ? '浅色模式' : '暗黑模式'}>
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      {/* 主体 */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar category={category} onSelect={setCategory} darkMode={darkMode} />
        <CardGrid
          cards={filtered}
          currentCat={currentCat}
          darkMode={darkMode}
          onCardClick={handleCardClick}
          converting={converting}
          hasFiles={files.length > 0}
        />
        <RightPanel
          files={files} onAddFiles={addFiles} onRemoveFile={removeFile}
          onClearFiles={clearFiles} history={history}
          darkMode={darkMode}
          progress={progress} converting={converting}
        />
      </div>

      {/* 底部状态栏 */}
      <footer className="flex items-center h-8 px-4 gap-4 bg-gray-50 dark:bg-[#1a1a2a]
                        border-t border-gray-200 dark:border-gray-700
                        text-xs text-gray-500 dark:text-gray-400 shrink-0">
        <span>共 {functionCards.length} 个功能模块</span>
        <span>|</span>
        <span>{currentCat}（{filtered.length} 项）</span>
        <span className="flex-1" />
        <span>历史 {history.length} 条</span>
        <span>|</span>
        <span>队列 {files.length} 个</span>
      </footer>

      {/* Toast 提示 */}
      {toast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50
                      px-5 py-2.5 rounded-xl bg-gray-900 dark:bg-gray-100
                      text-white dark:text-gray-900 text-sm shadow-2xl
                      animate-bounce pointer-events-none">
          {toast}
        </div>
      )}
    </div>
  )
}
