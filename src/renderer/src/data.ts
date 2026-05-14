export interface FunctionCard {
  id: string; title: string; description: string
  icon: string; category: string; formats: string[]
}

export const categories = [
  { id: 'all', name: '全部功能', icon: 'LayoutGrid' },
  { id: 'pdf', name: 'PDF 工具', icon: 'FileText' },
  { id: 'image', name: '图片处理', icon: 'Image' },
  { id: 'batch', name: '批量处理', icon: 'Layers' }
]

export const functionCards: FunctionCard[] = [
  // ── PDF 工具 ──
  { id: 'html-to-pdf', title: 'HTML 转 PDF', description: '网页文件完美转 PDF，保留原始排版', icon: 'Globe', category: 'pdf', formats: ['html→pdf'] },
  { id: 'pdf-merge', title: 'PDF 合并', description: '多个 PDF 文件合并为一个', icon: 'Combine', category: 'pdf', formats: ['pdf+pdf→pdf'] },
  { id: 'pdf-split', title: 'PDF 拆分', description: '将 PDF 按页拆分为多个文件', icon: 'SplitSquareHorizontal', category: 'pdf', formats: ['pdf→pdf×N'] },
  { id: 'pdf-extract', title: 'PDF 页面提取', description: '从 PDF 中提取指定页面', icon: 'Copy', category: 'pdf', formats: ['pdf→pdf'] },

  // ── 图片处理 ──
  { id: 'image-to-pdf', title: '图片转 PDF', description: '单张或多张图片合成为 PDF', icon: 'FileImage', category: 'image', formats: ['图片→pdf'] },
  { id: 'image-convert', title: '图片格式互转', description: 'PNG / JPG / WebP / GIF / TIFF / BMP 互转', icon: 'Repeat', category: 'image', formats: ['任意图片格式'] },
  { id: 'image-compress', title: '图片压缩', description: '减小图片体积，可调压缩比', icon: 'Zap', category: 'image', formats: ['png/jpg/webp'] },
  { id: 'image-resize', title: '图片裁剪缩放', description: '调整尺寸、裁剪区域', icon: 'Crop', category: 'image', formats: ['图片'] },
  { id: 'html-to-image', title: 'HTML 转图片', description: '网页截图导出为 PNG/JPG', icon: 'Image', category: 'image', formats: ['html→png/jpg'] },

  // ── 批量处理 ──
  { id: 'batch-rename', title: '批量重命名', description: '按序号规则批量修改文件名', icon: 'Hash', category: 'batch', formats: ['任意文件'] }
]
