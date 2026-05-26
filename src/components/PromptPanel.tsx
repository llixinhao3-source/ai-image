import { useState, useRef, useEffect } from 'react'
import type { ImageModel, AspectRatioOption, ImageSize } from '@/types'

interface PromptPanelProps {
  prompt: string
  negativePrompt: string
  model: ImageModel
  aspectRatio: AspectRatioOption
  imageSize: ImageSize
  onPromptChange: (value: string) => void
  onNegativePromptChange: (value: string) => void
  onModelChange: (model: ImageModel) => void
  onAspectRatioChange: (ratio: AspectRatioOption) => void
  onImageSizeChange: (size: ImageSize) => void
  onGenerate: () => void
  isGenerating: boolean
  canGenerate: boolean
  injectedPrompt?: string | null
}

interface ModelOption {
  value: ImageModel
  label: string
  desc: string
  group: string
  sizes: ImageSize[]
}

const isNanoBanana2Series = (m: ImageModel) =>
  m === 'nano-banana-2' || m === 'nano-banana-2-cl' || m === 'nano-banana-2-4k-cl'

const ALL_MODELS: ModelOption[] = [
  { value: 'gpt-image-2', label: 'GPT-Image-2', desc: '标准版 · 600积分', group: 'GPT-Image', sizes: ['1K'] },
  { value: 'gpt-image-2-vip', label: 'GPT-Image-2 VIP', desc: '支持1K-4K · 1300积分', group: 'GPT-Image', sizes: ['1K', '2K', '4K'] },
  { value: 'nano-banana-fast', label: 'Nano-Banana Fast', desc: '特价版 · 440积分', group: 'Nano-Banana', sizes: ['1K'] },
  { value: 'nano-banana', label: 'Nano-Banana', desc: '官方直连 · 1400积分', group: 'Nano-Banana', sizes: ['1K'] },
  { value: 'nano-banana-2', label: 'Nano-Banana 2', desc: '1K/2K/4K · 1200积分', group: 'Nano-Banana', sizes: ['1K', '2K', '4K'] },
  { value: 'nano-banana-2-cl', label: 'Nano-Banana 2 CL', desc: '1K/2K 稳定 · 1600积分', group: 'Nano-Banana', sizes: ['1K', '2K'] },
  { value: 'nano-banana-2-4k-cl', label: 'Nano-Banana 2 4K-CL', desc: '4K 稳定 · 3000积分', group: 'Nano-Banana', sizes: ['4K'] },
  { value: 'nano-banana-pro', label: 'Nano-Banana Pro', desc: '1K/2K/4K · 1800积分', group: 'Nano-Banana Pro', sizes: ['1K', '2K', '4K'] },
  { value: 'nano-banana-pro-vt', label: 'Nano-Banana Pro VT', desc: '4K质量好 · 1800积分', group: 'Nano-Banana Pro', sizes: ['1K', '2K', '4K'] },
  { value: 'nano-banana-pro-cl', label: 'Nano-Banana Pro CL', desc: '备用稳定 · 6000积分', group: 'Nano-Banana Pro', sizes: ['1K', '2K', '4K'] },
  { value: 'nano-banana-pro-vip', label: 'Nano-Banana Pro VIP', desc: '1K/2K 稳定 · 10000积分', group: 'Nano-Banana Pro', sizes: ['1K', '2K'] },
  { value: 'nano-banana-pro-4k-vip', label: 'Nano-Banana Pro 4K-VIP', desc: '4K 高成本 · 16000积分', group: 'Nano-Banana Pro', sizes: ['4K'] },
]

const RATIOS: { value: AspectRatioOption; label: string }[] = [
  { value: '1:1', label: '1:1 方图' },
  { value: '2:3', label: '2:3 竖图' },
  { value: '3:2', label: '3:2 横图' },
  { value: '16:9', label: '16:9 宽屏' },
]

const NANO_2_EXTRA_RATIOS: { value: string; label: string }[] = [
  { value: '1:4', label: '1:4' },
  { value: '4:1', label: '4:1' },
  { value: '1:8', label: '1:8' },
  { value: '8:1', label: '8:1' },
]

const SIZE_LABELS: Record<string, string> = { '1K': '1K (标准)', '2K': '2K (高清)', '4K': '4K (超清)' }

export function PromptPanel({ prompt, negativePrompt, model, aspectRatio, imageSize, onPromptChange, onNegativePromptChange, onModelChange, onAspectRatioChange, onImageSizeChange, onGenerate, isGenerating, canGenerate, injectedPrompt }: PromptPanelProps) {
  const [modelOpen, setModelOpen] = useState(false)
  const [aspectOpen, setAspectOpen] = useState(false)
  const modelRef = useRef<HTMLDivElement>(null)
  const aspectRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (modelRef.current && !modelRef.current.contains(e.target as Node)) setModelOpen(false)
      if (aspectRef.current && !aspectRef.current.contains(e.target as Node)) setAspectOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const currentModel = ALL_MODELS.find(m => m.value === model) || ALL_MODELS[0]
  const showImageSize = currentModel.sizes.length > 1
  const showExtraRatios = isNanoBanana2Series(model)

  const effectiveSize: ImageSize = imageSize || currentModel.sizes[0]
  if (!currentModel.sizes.includes(effectiveSize as ImageSize) && showImageSize && currentModel.sizes.length > 0) {
    onImageSizeChange(currentModel.sizes[0])
  }

  const allRatios = showExtraRatios
    ? [...RATIOS, ...NANO_2_EXTRA_RATIOS.map(r => ({ value: r.value as AspectRatioOption, label: r.label }))]
    : RATIOS
  const currentAspect: AspectRatioOption = allRatios.some(r => r.value === aspectRatio) ? aspectRatio : '1:1'

  return (
    <div className="flex flex-col gap-6 p-10">
      <div className="space-y-5">
        <div className="space-y-1.5" ref={modelRef}>
          <label className="block text-xs font-semibold uppercase tracking-widest text-gray-400">模型</label>
          <button onClick={() => setModelOpen(!modelOpen)}
            className="flex w-full items-center justify-between rounded-apple-lg border border-gray-200/60 bg-white/60 px-4 py-3 text-left text-sm backdrop-blur-glass transition-all hover:border-gray-300/80 dark:border-white/8 dark:bg-white/5 dark:hover:border-white/15">
            <div>
              <span className="font-semibold text-gray-800 dark:text-gray-100">{currentModel.label}</span>
              <span className="ml-2 text-xs text-gray-400">{currentModel.desc}</span>
            </div>
            <svg className={`h-4 w-4 text-gray-400 transition-transform ${modelOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
          </button>
          {modelOpen && (
            <div className="absolute z-50 mt-1 w-[340px] rounded-apple-lg border border-gray-200/60 bg-white/95 shadow-apple-lg backdrop-blur-xl dark:border-white/10 dark:bg-gray-900/95">
              <div className="max-h-[320px] overflow-y-auto p-2">
                {(['GPT-Image', 'Nano-Banana', 'Nano-Banana Pro'] as const).map(group => {
                  const groupModels = ALL_MODELS.filter(m => m.group === group)
                  if (groupModels.length === 0) return null
                  return (
                    <div key={group}>
                      <div className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-gray-400">{group}</div>
                      {groupModels.map(m => (
                        <button key={m.value} onClick={() => { onModelChange(m.value); setModelOpen(false) }}
                          className={`flex w-full items-center justify-between rounded-apple px-3 py-2 text-left transition-colors ${
                            model === m.value ? 'bg-blue-50/80 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5'
                          }`}>
                          <div>
                            <div className="text-sm font-medium">{m.label}</div>
                            <div className="text-[11px] opacity-60">{m.desc}</div>
                          </div>
                          {model === m.value && <svg className="h-4 w-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>}
                        </button>
                      ))}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {showImageSize && (
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-widest text-gray-400">分辨率</label>
            <div className="grid grid-cols-3 gap-2">
              {currentModel.sizes.map(s => (
                <button key={s} onClick={() => onImageSizeChange(s)}
                  className={`rounded-apple-lg border px-4 py-2.5 text-center transition-all duration-300 ${
                    effectiveSize === s
                      ? 'border-blue-500 bg-blue-50/60 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/40'
                      : 'border-gray-200/60 bg-white/40 text-gray-600 hover:border-gray-300/80 dark:border-white/8 dark:bg-white/5 dark:text-gray-400 dark:hover:border-white/15'
                  }`}>
                  <span className="text-sm font-semibold">{SIZE_LABELS[s] || s}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-1.5" ref={aspectRef}>
          <label className="block text-xs font-semibold uppercase tracking-widest text-gray-400">图片比例</label>
          <button onClick={() => setAspectOpen(!aspectOpen)}
            className="flex w-full items-center justify-between rounded-apple-lg border border-gray-200/60 bg-white/60 px-4 py-3 backdrop-blur-glass transition-all hover:border-gray-300/80 dark:border-white/8 dark:bg-white/5 dark:hover:border-white/15">
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{currentAspect}</span>
            <svg className={`h-4 w-4 text-gray-400 transition-transform ${aspectOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
          </button>
          {aspectOpen && (
            <div className="absolute z-50 mt-1 w-[340px] rounded-apple-lg border border-gray-200/60 bg-white/95 shadow-apple-lg backdrop-blur-xl dark:border-white/10 dark:bg-gray-900/95">
              <div className="max-h-[260px] overflow-y-auto p-2">
                {allRatios.map(r => (
                  <button key={r.value} onClick={() => { onAspectRatioChange(r.value); setAspectOpen(false) }}
                    className={`flex w-full items-center justify-between rounded-apple px-3 py-2 text-left transition-colors ${
                      aspectRatio === r.value ? 'bg-blue-50/80 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5'
                    }`}>
                    <span className="text-sm">{r.label}</span>
                    {aspectRatio === r.value && <svg className="h-4 w-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>}
                  </button>
                ))}
              </div>
            </div>
          )}
          {showExtraRatios && <p className="text-[11px] text-gray-400">Nano-Banana 2 系列支持额外超宽/超高比例</p>}
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-widest text-gray-400">正向提示词</label>
          <textarea value={prompt} onChange={e => onPromptChange(e.target.value)} placeholder="描述你想要的画面..." rows={6}
            className="w-full resize-none rounded-apple-lg border border-gray-200/60 bg-white/60 px-4 py-3.5 text-[15px] leading-relaxed text-gray-800 placeholder-gray-300 backdrop-blur-glass transition-all duration-300 hover:border-gray-300/80 focus:border-blue-400/60 focus:bg-white/90 focus:outline-none focus:ring-4 focus:ring-blue-500/5 dark:border-white/8 dark:bg-white/5 dark:text-gray-100 dark:placeholder-gray-600 dark:hover:border-white/15 dark:focus:border-blue-400/40 dark:focus:bg-white/8" />
          {injectedPrompt && (
            <div className="flex items-start gap-2 rounded-apple bg-blue-50/50 px-3 py-2 dark:bg-blue-500/5">
              <span className="mt-0.5 text-xs text-blue-400">◆</span>
              <span className="text-xs text-blue-500/80 dark:text-blue-400/70">已注入风格提示词: {injectedPrompt.slice(0, 80)}...</span>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-widest text-gray-400">反向提示词</label>
          <textarea value={negativePrompt} onChange={e => onNegativePromptChange(e.target.value)} placeholder="不想出现的元素..." rows={2}
            className="w-full resize-none rounded-apple-lg border border-gray-200/60 bg-white/60 px-4 py-3 text-sm leading-relaxed text-gray-600 placeholder-gray-300 backdrop-blur-glass transition-all duration-300 hover:border-gray-300/80 focus:border-red-400/40 focus:bg-white/90 focus:outline-none focus:ring-4 focus:ring-red-500/5 dark:border-white/8 dark:bg-white/5 dark:text-gray-400 dark:placeholder-gray-600 dark:hover:border-white/15 dark:focus:border-red-400/30 dark:focus:bg-white/8" />
        </div>
      </div>

      <button onClick={onGenerate} disabled={!canGenerate || isGenerating}
        className={`group relative flex items-center justify-center gap-2.5 rounded-apple-xl px-8 py-3.5 text-sm font-semibold transition-all duration-300 ${
          canGenerate && !isGenerating
            ? 'bg-gray-900 text-white shadow-apple-lg hover:bg-gray-800 hover:shadow-xl active:scale-[0.98] dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100'
            : 'cursor-not-allowed bg-gray-200 text-gray-400 dark:bg-white/5 dark:text-gray-600'
        }`}>
        {isGenerating ? (
          <><svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeDasharray="31.4 31.4" strokeLinecap="round" /></svg>生成中...</>
        ) : (
          <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polygon points="5 3 19 12 5 21 5 3" /></svg>生成图片</>
        )}
      </button>
    </div>
  )
}
