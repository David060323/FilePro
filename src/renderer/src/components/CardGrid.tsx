import { FunctionCard as FunctionCardType } from '../data'
import {
  Globe, Combine, SplitSquareHorizontal, Copy,
  FileImage, Repeat, Zap, Crop, Image, Hash, Search
} from 'lucide-react'

interface Props {
  cards: FunctionCardType[]
  currentCat: string
  darkMode: boolean
  onCardClick: (cardId: string) => void
  converting: boolean
  hasFiles: boolean
}

const iconMap: Record<string, React.ElementType> = {
  Globe, Combine, SplitSquareHorizontal, Copy, Lock,
  FileImage, Repeat, Zap, Crop, Image, Hash
}

const catColors: Record<string, string> = {
  pdf: 'text-red-500 bg-red-50 dark:bg-red-500/10',
  image: 'text-green-500 bg-green-50 dark:bg-green-500/10',
  batch: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-500/10'
}

export default function CardGrid({ cards, currentCat, darkMode, onCardClick, converting, hasFiles }: Props) {
  return (
    <main className="flex-1 overflow-y-auto p-5 bg-white dark:bg-[#1E1E2E]">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{currentCat}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {cards.length} 个功能模块 {hasFiles ? ' · 点击卡片开始转换' : ''}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {cards.map(card => {
          const Icon = iconMap[card.icon] || FileImage
          const colorClass = catColors[card.category] || ''
          const disabled = !hasFiles || converting
          return (
            <button
              key={card.id}
              onClick={() => !disabled && onCardClick(card.id)}
              disabled={disabled}
              className={`group relative p-4 rounded-xl border text-left transition-all duration-200
                ${disabled ? 'cursor-default opacity-50' : 'cursor-pointer'}
                ${darkMode
                  ? 'border-gray-700 bg-[#252536] hover:bg-[#2d2d3f] hover:border-primary/40'
                  : 'border-gray-200 bg-white hover:bg-gray-50 hover:border-primary/30 hover:shadow-md'
                }`}
            >
              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg mb-3
                            ${!disabled ? 'group-hover:scale-110' : ''} transition-transform ${colorClass}`}>
                <Icon size={20} />
              </div>
              <h3 className="text-sm font-medium text-gray-800 dark:text-white mb-1">{card.title}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{card.description}</p>
              <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full
                             bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                {card.formats[0]}
              </span>
            </button>
          )
        })}

        {cards.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
            <Search size={40} className="mb-3 opacity-40" />
            <p className="text-sm">没有找到匹配的功能</p>
            <p className="text-xs mt-1">试试其他关键词</p>
          </div>
        )}
      </div>
    </main>
  )
}
