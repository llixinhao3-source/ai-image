import { useState, useCallback, useEffect } from 'react'
import { Layout } from '@/components/Layout'
import { StyleDropdown } from '@/components/StyleDropdown'
import { PromptPanel } from '@/components/PromptPanel'
import { ImagePanel } from '@/components/ImagePanel'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { useStyleTemplates } from '@/hooks/useStyleTemplates'
import { useImageGeneration } from '@/hooks/useImageGeneration'
import type { ImageModel, AspectRatioOption, ImageSize } from '@/types'

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [prompt, setPrompt] = useState('')
  const [negativePrompt, setNegativePrompt] = useState('')
  const [model, setModel] = useState<ImageModel>('gpt-image-2')
  const [aspectRatio, setAspectRatio] = useState<AspectRatioOption>('1:1')
  const [imageSize, setImageSize] = useState<ImageSize>('1K')

  const { templates, selectedId, isLoading: templatesLoading, selectTemplate, getInjectedParams, refresh } = useStyleTemplates()
  const { images, isGenerating, lastError, generate, keepImage } = useImageGeneration()

  const injected = getInjectedParams()

  useEffect(() => { refresh() }, [refresh])

  const handleGenerate = useCallback(() => {
    const basePrompt = prompt.trim()
    if (!basePrompt) return

    const combinedPrompt = injected ? `${basePrompt}, ${injected.prompt}` : basePrompt
    const combinedNegative = injected?.negativePrompt
      ? [negativePrompt, injected.negativePrompt].filter(Boolean).join(', ')
      : negativePrompt

    generate({
      prompt: combinedPrompt,
      negativePrompt: combinedNegative || undefined,
      baseModel: injected?.baseModel || 'SDXL',
      lora: injected?.lora || '',
      model,
      aspectRatio,
      imageSize,
      userPrompt: basePrompt,
      stylePrompt: injected?.prompt,
    })
  }, [prompt, negativePrompt, model, aspectRatio, imageSize, injected, generate])

  const toggleTheme = useCallback(() => { setTheme(prev => prev === 'light' ? 'dark' : 'light') }, [])

  const selectedTemplate = selectedId ? templates.find(t => t.fileName === selectedId) : null

  const sidebar = (
    <div className="space-y-8">
      <StyleDropdown templates={templates} selectedId={selectedId} isLoading={templatesLoading} onSelect={selectTemplate} onRefresh={refresh} />
      {injected && (
        <div className="space-y-2.5 rounded-apple-lg border border-gray-200/60 bg-white/50 p-4 backdrop-blur-glass dark:border-white/8 dark:bg-white/5">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">注入配方</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <span className="rounded px-2 py-0.5 text-[10px] font-semibold bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400">
              {injected.baseModel.replace(/_/g, ' ')}
            </span>
            {typeof injected.lora === 'string' && injected.lora ? (
              <span className="rounded px-2 py-0.5 text-[10px] font-mono text-purple-600 bg-purple-50 dark:bg-purple-500/10 dark:text-purple-400">
                {injected.lora}
              </span>
            ) : Array.isArray(injected.lora) && injected.lora.map((l: { name: string; weight: number }, i: number) => (
              <span key={i} className="rounded px-2 py-0.5 text-[10px] font-mono text-purple-600 bg-purple-50 dark:bg-purple-500/10 dark:text-purple-400">
                {l.name}:{l.weight}
              </span>
            ))}
          </div>

          {injected.negativePrompt && (
            <div className="rounded-apple bg-red-50/50 px-2.5 py-1.5 dark:bg-red-500/5">
              <p className="text-[9px] font-semibold uppercase tracking-widest text-red-400/80">反向</p>
              <p className="mt-0.5 text-[10px] leading-relaxed text-red-500/70 dark:text-red-400/50 line-clamp-2">{injected.negativePrompt}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )

  return (
    <Layout sidebar={sidebar} theme={theme} onToggleTheme={toggleTheme}>
      <div className="flex h-full">
        <div className={`w-[400px] flex-shrink-0 border-r ${theme === 'dark' ? 'border-border-dark' : 'border-border-light'}`}>
          <PromptPanel prompt={prompt} negativePrompt={negativePrompt} model={model} aspectRatio={aspectRatio} imageSize={imageSize}
            onPromptChange={setPrompt} onNegativePromptChange={setNegativePrompt} onModelChange={setModel}
            onAspectRatioChange={ratio => setAspectRatio(ratio)} onImageSizeChange={setImageSize} onGenerate={handleGenerate}
            isGenerating={isGenerating} canGenerate={prompt.trim().length > 0} injectedPrompt={injected?.prompt ?? null} />
        </div>
        <div className="flex-1">
          {lastError && (
            <div className="mx-8 mt-6 rounded-apple-lg border border-red-200 bg-red-50/80 px-4 py-3 backdrop-blur-glass dark:border-red-500/20 dark:bg-red-500/5">
              <p className="text-xs font-medium text-red-600 dark:text-red-400">{lastError}</p>
            </div>
          )}
          {isGenerating ? <div className="p-8"><LoadingSkeleton /></div> : <ImagePanel images={images} isGenerating={isGenerating} onKeep={keepImage} defaultStyleName={selectedTemplate?.styleName ?? ''} />}
        </div>
      </div>
    </Layout>
  )
}
