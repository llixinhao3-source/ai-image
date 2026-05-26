import { useState, useMemo } from 'react'
import type { StyleTemplate } from '@/types'

interface StyleDropdownProps {
  templates: StyleTemplate[]
  selectedId: string | null
  isLoading: boolean
  onSelect: (fileName: string | null) => void
  onRefresh: () => void
}

function inferCategory(t: StyleTemplate): string {
  const name = (t.styleName + t.prompt + t.baseModel).toLowerCase()
  if (name.includes('电商') || name.includes('product') || name.includes('commercial') || name.includes('white background') || name.includes('ecommerce') || name.includes('ebay') || name.includes('商品')) return '电商 / 产品'
  if (name.includes('室内') || name.includes('interior') || name.includes('room') || name.includes('muji') || name.includes('architecture') || name.includes('furniture')) return '室内 / 空间'
  if (name.includes('人像') || name.includes('portrait') || name.includes('fashion') || name.includes('face')) return '人像 / 时尚'
  if (name.includes('风景') || name.includes('landscape') || name.includes('nature') || name.includes('cinematic')) return '风景 / 氛围'
  if (name.includes('二次元') || name.includes('anime') || name.includes('插画') || name.includes('illustration')) return '二次元 / 插画'
  return '通用风格'
}

function renderLoRa(lora: string | { name: string; weight: number }[]): string {
  if (typeof lora === 'string') return lora
  if (Array.isArray(lora) && lora.length > 0) return lora.map(l => `${l.name}:${l.weight}`).join(', ')
  return ''
}

export function StyleDropdown({ templates, selectedId, isLoading, onSelect, onRefresh }: StyleDropdownProps) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return templates
    const q = search.toLowerCase()
    return templates.filter(t =>
      t.styleName.toLowerCase().includes(q) ||
      t.prompt.toLowerCase().includes(q) ||
      t.baseModel.toLowerCase().includes(q) ||
      renderLoRa(t.lora).toLowerCase().includes(q)
    )
  }, [templates, search])

  const grouped = useMemo(() => {
    const map = new Map<string, StyleTemplate[]>()
    for (const t of filtered) {
      const cat = inferCategory(t)
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat)!.push(t)
    }
    return [...map.entries()]
  }, [filtered])

  const selected = selectedId ? templates.find(t => t.fileName === selectedId) : null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">风格模板</span>
          <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-400 dark:bg-white/10 dark:text-gray-500">
            {templates.length}
          </span>
        </div>
        <button onClick={onRefresh} disabled={isLoading}
          className="group flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold text-gray-400 transition-all hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50 dark:hover:bg-white/5 dark:hover:text-gray-300">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className={`transition-transform duration-300 ${isLoading ? 'animate-spin' : 'group-hover:rotate-45'}`}>
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path d="M16 21h5v-5" />
          </svg>
          刷新
        </button>
      </div>

      <div className="relative">
        <svg className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索风格..."
          className="w-full rounded-apple border border-gray-200/60 bg-white/50 py-2 pl-8 pr-3 text-xs text-gray-700 placeholder-gray-300 outline-none backdrop-blur-glass transition-all hover:border-gray-300/80 focus:border-blue-400/60 focus:bg-white/80 focus:ring-4 focus:ring-blue-500/5 dark:border-white/8 dark:bg-white/5 dark:text-gray-300 dark:placeholder-gray-600 dark:hover:border-white/15 dark:focus:border-blue-400/40 dark:focus:bg-white/8" />
      </div>

      <div className="space-y-1">
        <button onClick={() => onSelect(null)}
          className={`flex w-full items-center gap-3 rounded-apple px-3 py-2.5 text-left transition-all duration-200 ${
            selectedId === null
              ? 'bg-blue-500 text-white shadow-apple-md'
              : 'text-gray-600 hover:bg-black/5 dark:text-gray-400 dark:hover:bg-white/5'
          }`}>
          <span className="flex h-7 w-7 items-center justify-center rounded-apple bg-white/20 text-xs">✦</span>
          <div>
            <div className="text-sm font-medium">自由创作</div>
            <div className="text-[10px] opacity-60">不应用风格模板</div>
          </div>
        </button>

        {isLoading ? (
          <div className="space-y-2 px-3 py-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-1.5">
                <div className="h-4 w-3/4 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" style={{ animationDelay: `${i * 100}ms` }} />
                <div className="h-3 w-1/2 animate-pulse rounded-md bg-gray-100 dark:bg-gray-800" style={{ animationDelay: `${i * 150}ms` }} />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-3 py-6 text-center">
            <p className="text-xs text-gray-400">{search ? '没有匹配的风格' : '暂无风格模板'}</p>
            {!search && <p className="mt-1 text-[10px] text-gray-300 dark:text-gray-600">在 Obsidian 模板目录中添加 .md 文件</p>}
          </div>
        ) : (
          grouped.map(([category, items]) => (
            <div key={category}>
              <p className="mt-3 mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-gray-300 dark:text-gray-600">
                {category}
              </p>
              {items.map(t => {
                const loraStr = renderLoRa(t.lora)
                const isActive = selectedId === t.fileName
                return (
                  <button key={t.fileName} onClick={() => onSelect(t.fileName)}
                    className={`w-full rounded-apple px-3 py-2.5 text-left transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-500 text-white shadow-apple-md'
                        : 'text-gray-600 hover:bg-black/5 dark:text-gray-400 dark:hover:bg-white/5'
                    }`}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{t.styleName}</span>
                      {t.negativePrompt && (
                        <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${isActive ? 'bg-white/20' : 'bg-gray-100 text-gray-400 dark:bg-white/10 dark:text-gray-500'}`}>
                          neg
                        </span>
                      )}
                    </div>
                    <div className={`mt-1 flex items-center gap-1.5 overflow-hidden ${isActive ? 'text-white/70' : ''}`}>
                      <span className="shrink-0 rounded px-1 py-0.5 text-[9px] font-mono"
                        style={isActive ? { background: 'rgb(255 255 255 / 0.15)' } : { background: 'rgb(0 0 0 / 0.04)' }}>
                        {t.baseModel.replace(/^SDXL_/, '').replace(/_/g, ' ')}
                      </span>
                      {loraStr && (
                        <span className="truncate text-[9px] opacity-50" title={loraStr}>
                          {loraStr.split(',')[0]}
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          ))
        )}
      </div>

      {selected && (
        <div className="rounded-apple-lg border border-blue-100 bg-blue-50/60 p-3.5 dark:border-blue-500/10 dark:bg-blue-500/5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-400 dark:text-blue-500">已选择</p>
          <p className="mt-1 text-xs font-medium text-blue-700 dark:text-blue-300">{selected.styleName}</p>
          <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-blue-500/80 dark:text-blue-400/60">{selected.prompt}</p>
        </div>
      )}
    </div>
  )
}
