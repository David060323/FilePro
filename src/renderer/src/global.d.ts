interface FileItem {
  path: string; name: string; ext: string; size: number
}

interface ConvertResult {
  success: boolean; output?: string; outputs?: string[]; fallback?: string; error?: string
}

interface Api {
  openFiles: (options?: { filters?: { name: string; extensions: string[] }[] }) => Promise<FileItem[]>
  openFolder: () => Promise<string | null>
  openPath: (p: string) => Promise<void>
  getFilePath: (file: File) => string
  htmlToPdf: (src: string, outDir: string | null) => Promise<ConvertResult>
  htmlToImage: (src: string, format: string, outDir: string | null) => Promise<ConvertResult>
  imageConvert: (src: string, format: string, outDir: string | null) => Promise<ConvertResult>
  imageToPdf: (files: string[], outDir: string | null) => Promise<ConvertResult>
  imageCompress: (src: string, quality: number, outDir: string | null) => Promise<ConvertResult>
  imageResize: (src: string, w: number, h: number, outDir: string | null) => Promise<ConvertResult>
  pdfMerge: (files: string[], outDir: string | null) => Promise<ConvertResult>
  pdfSplit: (src: string, outDir: string | null) => Promise<ConvertResult>
  pdfExtract: (src: string, pages: number[], outDir: string | null) => Promise<ConvertResult>
  batchRename: (files: string[], prefix: string, start: number, outDir: string | null) => Promise<ConvertResult>
}

declare global { interface Window { api: Api } }
export {}
