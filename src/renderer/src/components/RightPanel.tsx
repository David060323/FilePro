import { useCallback, useState } from 'react'
import { Upload, FileText, X, Clock, Loader2 } from 'lucide-react'
import { HistoryEntry } from '../App'

interface Props {
  files: FileItem[]
  onAddFiles: (files: FileItem[]) => void
  onRemoveFile: (path: string) => void
  onClearFiles: () => void
  history: HistoryEntry[]
  darkMode: boolean
  progress: { current: number; total: number }
  converting: boolean
}

export default function RightPanel({
  files, onAddFiles, onRemoveFile, onClearFiles,
  history, darkMode, progress, converting
}: Props) {
  const [dragover, setDragover] = useState(false)

  const getPath = (file: File): string => {
    try {
      if (window.api?.getFilePath) return window.api.getFilePath(file)
    } catch {}
    return (file as any).path || file.name
  }

  const filesFromDataTransfer = (dt: DataTransfer): FileItem[] => {
    const items: FileItem[] = []
    const fileList = dt.files
    for (let i = 0; i < fileList.length; i++) {
      const f = fileList.item(i)
      if (!f) continue
      const fp = getPath(f)
      const name = f.name
      const parts = name.split('.')
      const ext = parts.length > 1 ? '.' + parts.pop()!.toLowerCase() : ''
      // 过滤掉非文件路径（如仅有文件名无路径）
      if (fp && (fp.includes('\\') || fp.includes('/') || fp.includes(':'))) {
        items.push({ path: fp, name, ext, size: f.size })
      }
    }
    return items
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragover(false)
    const dropped = filesFromDataTransfer(e.dataTransfer)
    if (dropped.length > 0) onAddFiles(dropped)
  }, [onAddFiles])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragover(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragover(false)
  }, [])

  const handleBrowse = useCallback(async () => {
    try {
      if (window.api?.openFiles) {
        const result = await window.api.openFiles({
          filters: [
            { name: '支持的文件', extensions: ['html', 'htm', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'tiff', 'tif'] },
            { name: '所有文件', extensions: ['*'] }
          ]
        })
        if (result?.length) onAddFiles(result)
      }
    } catch {
      // 非 Electron 环境回退
      const input = document.createElement('input')
      input.type = 'file'
      input.multiple = true
      input.onchange = () => {
        const list: FileItem[] = []
        if (input.files) {
          for (let i = 0; i < input.files.length; i++) {
            const f = input.files.item(i)
            if (!f) continue
            const fp = getPath(f)
          list.push({
            path: fp, name: f.name,
            ext: f.name.includes('.') ? '.' + f.name.split('.').pop()!.toLowerCase() : '',
            size: f.size
          })
          }
        }
        if (list.length) onAddFiles(list)
      }
      input.click()
    }
  }, [onAddFiles])

  return (
    <aside className="w-72 shrink-0 bg-gray-50 dark:bg-[#1a1a2a] border-l
                      border-gray-200 dark:border-gray-700 flex flex-col">
      {/* 上传区 */}
      <div className="p-3">
        <div
          onDragOver={handleDragOver}
          onDragEnter={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleBrowse}
          className={`relative flex flex-col items-center justify-center p-5
            border-2 border-dashed rounded-xl cursor-pointer transition-all select-none
            ${dragover
              ? 'border-primary bg-primary/10 scale-[1.02]'
              : 'border-gray-300 dark:border-gray-600 hover:border-primary/50'
            }`}
        >
          <Upload size={26} className={`mb-2 transition-colors ${dragover ? 'text-primary' : 'text-gray-400'}`} />
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">拖拽文件到此处</p>
          <p className="text-xs text-gray-400 mt-1">或点击浏览文件</p>
          <p className="text-[10px] text-gray-400 mt-1">支持 HTML / PDF / 图片</p>
        </div>
      </div>

      {/* 转换进度 */}
      {converting && (
        <div className="px-3 pb-2">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10 text-primary text-xs">
            <Loader2 size={14} className="animate-spin" />
            <span>转换中 {progress.current}/{progress.total}</span>
          </div>
        </div>
      )}

      {/* 文件队列 */}
      {files.length > 0 && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              队列 ({files.length})
            </span>
            <button onClick={onClearFiles}
              className="text-xs text-red-400 hover:text-red-500 transition-colors">
              清空
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 space-y-1.5">
            {files.map(f => (
              <div key={f.path}
                className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-[#252536]
                           border border-gray-100 dark:border-gray-700 group">
                <FileText size={14} className="text-gray-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-700 dark:text-gray-200 truncate">{f.name}</p>
                  <p className="text-[10px] text-gray-400">{f.ext.replace('.', '').toUpperCase() || '文件'}</p>
                </div>
                <button onClick={() => onRemoveFile(f.path)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity
                           p-0.5 text-gray-400 hover:text-red-500">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 历史记录 */}
      <div className="border-t border-gray-200 dark:border-gray-700 flex-1 flex flex-col min-h-0">
        <div className="flex items-center gap-1.5 px-3 py-2">
          <Clock size={13} className="text-gray-400" />
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">历史记录</span>
        </div>
        {history.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-xs text-gray-400">暂无转换记录</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-3 space-y-1">
            {history.slice(0, 20).map(h => (
              <div key={h.id}
                className="flex items-center gap-2 p-2 rounded-lg
                         bg-white/50 dark:bg-[#252536]/50 text-xs
                         cursor-pointer hover:bg-white dark:hover:bg-[#2d2d3f]"
                onClick={() => window.api.openPath(h.outputPath)}>
                <FileText size={13} className="text-gray-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-gray-700 dark:text-gray-200 truncate">{h.fileName}</p>
                  <p className="text-[10px] text-gray-400">
                    {h.sourceFormat} &rarr; {h.targetFormat}
                  </p>
                </div>
                <span className="text-[10px] text-gray-400 shrink-0">
                  {new Date(h.timestamp).toLocaleTimeString('zh-CN', {
                    hour: '2-digit', minute: '2-digit'
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  )
}
