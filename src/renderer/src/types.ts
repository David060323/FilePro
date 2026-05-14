export interface FileItem {
  path: string
  name: string
  ext: string
  size: number
}

export interface ConversionTask {
  id: string
  file: FileItem
  targetFormat: string
  status: 'pending' | 'running' | 'done' | 'error'
  outputPath?: string
  error?: string
  progress: number
}

export interface FunctionCard {
  id: string
  title: string
  description: string
  icon: string
  category: string
  formats: string[]
}

export interface HistoryItem {
  id: string
  fileName: string
  sourceFormat: string
  targetFormat: string
  outputPath: string
  timestamp: number
  size: number
}
