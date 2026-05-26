import { useState } from 'react'
import type { GeneratedImage } from '@/types'

interface ImagePanelProps {
  images: GeneratedImage[]
  isGenerating: boolean
  onKeep: (image: GeneratedImage, styleName: string) => void
}

function getAspectRatioClass(aspectRatio?: string): string {
  switch (aspectRatio) {
    case '2:3': return 'aspect-[2/3]'
    case '3:2': return 'aspect-[3/2]'
    case '16:9': return 'aspect-video'
    default: return 'aspect-square'
  }
}

export function ImagePanel({ images, isGenerating, onKeep }: ImagePanelProps) {
  const [styleNameInput, setStyleNameInput] = useState('')
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  if (!isGenerating && images.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-12 text-center">
        <div className="rounded-apple-xl bg-gray-100/60 p-6 dark:bg-white/5">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-gray-300 dark:text-gray-600">
            <rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-gray-400">输入提示词，开始创作</p>
        <p className="text-xs text-gray-300 dark:text-gray-600">每次生成将产出图片供你选择</p>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto p-8">
      <div className={`grid gap-6 ${images.length > 1 ? 'grid-cols-2' : 'grid-cols-1 max-w-lg mx-auto'}`}>
        {images.map(image => (
          <div key={image.id}
            className={`group relative overflow-hidden rounded-apple-xl border transition-all duration-500 ${
              image.isKept
                ? 'border-green-300/40 shadow-apple-md dark:border-green-500/20'
                : 'border-gray-200/30 bg-white/40 shadow-apple dark:border-white/5 dark:bg-white/[0.02]'
            }`}>
            <img src={image.dataUrl} alt={image.prompt} className={`w-full object-cover ${getAspectRatioClass(image.aspectRatio)}`} loading="lazy" />

            <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
              image.isKept ? 'bg-green-500/10' : 'bg-black/0 group-hover:bg-black/5 dark:group-hover:bg-white/5'
            }`}>
              {image.isKept ? (
                <div className="flex items-center gap-2 rounded-apple-xl bg-green-500/90 px-5 py-2.5 text-sm font-semibold text-white shadow-apple-lg backdrop-blur-glass">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  已保存
                </div>
              ) : (
                <button onClick={() => setConfirmingId(image.id)}
                  className="rounded-apple-xl bg-white/90 px-5 py-2.5 text-sm font-semibold text-gray-800 opacity-0 shadow-apple-lg backdrop-blur-glass transition-all duration-200 group-hover:opacity-100 hover:bg-white hover:shadow-xl active:scale-[0.96] dark:bg-gray-900/90 dark:text-gray-200 dark:hover:bg-gray-900">
                  保留此图
                </button>
              )}
            </div>

            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent p-4 pt-8 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <p className="text-xs leading-relaxed text-white/90 line-clamp-3">{image.prompt}</p>
            </div>
          </div>
        ))}
      </div>

      {confirmingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-apple-xl bg-white p-6 shadow-apple-lg dark:bg-gray-900 dark:border dark:border-white/10">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">保存为风格模板</h3>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">为该风格命名，系统将自动反推出提示词并保存为 .md 模板</p>
            <input type="text" value={styleNameInput} onChange={e => setStyleNameInput(e.target.value)} placeholder="输入风格名称..." autoFocus
              className="mt-4 w-full rounded-apple border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder-gray-600" />
            <div className="mt-4 flex gap-2.5">
              <button onClick={() => setConfirmingId(null)}
                className="flex-1 rounded-apple bg-gray-100 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-200 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10">取消</button>
              <button onClick={() => {
                const img = images.find(i => i.id === confirmingId)
                if (img && styleNameInput.trim()) { onKeep(img, styleNameInput.trim()); setStyleNameInput(''); setConfirmingId(null) }
              }} disabled={!styleNameInput.trim()}
                className={`flex-1 rounded-apple py-2.5 text-sm font-semibold transition-all ${
                  styleNameInput.trim()
                    ? 'bg-gray-900 text-white hover:bg-gray-800 active:scale-[0.98] dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100'
                    : 'cursor-not-allowed bg-gray-200 text-gray-400 dark:bg-white/5 dark:text-gray-600'
                }`}>确认保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
