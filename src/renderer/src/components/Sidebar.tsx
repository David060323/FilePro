import { LayoutGrid, FileText, Image, Layers } from 'lucide-react'
import { categories } from '../data'

interface Props {
  category: string
  onSelect: (id: string) => void
  darkMode: boolean
}

const iconMap: Record<string, React.ElementType> = { LayoutGrid, FileText, Image, Layers }

export default function Sidebar({ category, onSelect, darkMode }: Props) {
  return (
    <aside className="w-44 shrink-0 bg-gray-50 dark:bg-[#1a1a2a] border-r
                      border-gray-200 dark:border-gray-700 overflow-y-auto">
      <nav className="p-3 space-y-1">
        {categories.map(cat => {
          const Icon = iconMap[cat.icon] || LayoutGrid
          const active = category === cat.id
          return (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                transition-all duration-150 group
                ${active
                  ? 'bg-primary text-white shadow-md shadow-primary/25 font-medium'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#2d2d3f]'
                }`}
            >
              <Icon size={18} className={active ? '' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200'} />
              <span>{cat.name}</span>
              {active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />
              )}
            </button>
          )
        })}
      </nav>

      <div className="mx-3 my-3 border-t border-gray-200 dark:border-gray-700" />

      <div className="px-4 pb-4">
        <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
          FilePro 全能转换器<br />
          支持 3 大类 11 项功能<br />
          拖拽文件快速处理
        </p>
      </div>
    </aside>
  )
}
