import { useState, useCallback } from 'react'
import type { GeneratedImage, GenerationParams, ImageModel, AspectRatioOption, ImageSize } from '@/types'
import { saveGeneratedImage } from '@/utils/fileService'
import { executeKeepPipeline } from '@/utils/vlmPipeline'
import { PROXY_API } from '@/types'

const IMAGE_GEN_API = `${PROXY_API}/api/generate`

const RATIO_TO_PIXEL: Record<string, string> = {
  '1:1': '1024x1024',
  '2:3': '1024x1536',
  '3:2': '1536x1024',
  '16:9': '1672x941',
}

const RATIO_TO_PIXEL_VIP: Record<string, string> = {
  '1:1': '1024x1024',
  '2:3': '1024x1536',
  '3:2': '1536x1024',
  '16:9': '1280x720',
}

const GPT_IMAGE_MODELS = new Set<ImageModel>(['gpt-image-2', 'gpt-image-2-vip'])

function formatTimestamp(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `img_${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`
}

function getAspectRatioParam(model: ImageModel, ratio: AspectRatioOption): string {
  if (GPT_IMAGE_MODELS.has(model)) {
    return model === 'gpt-image-2-vip' ? (RATIO_TO_PIXEL_VIP[ratio] || ratio) : (RATIO_TO_PIXEL[ratio] || ratio)
  }
  return ratio
}

function getAspectRatioSize(aspectRatio: string): { w: number; h: number } {
  switch (aspectRatio) {
    case '2:3': return { w: 512, h: 768 }
    case '3:2': return { w: 768, h: 512 }
    case '16:9': return { w: 854, h: 480 }
    default: return { w: 512, h: 512 }
  }
}

function generateDemoImage(id: number, prompt: string, aspectRatio: string): GeneratedImage {
  const { w, h } = getAspectRatioSize(aspectRatio)
  const hue = (id * 137.5) % 360
  const sat = 55 + (id % 20)
  const lit = 60 + (id % 15)

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!

  const g = ctx.createLinearGradient(0, 0, w, h)
  g.addColorStop(0, `hsl(${hue}, ${sat}%, ${lit}%)`)
  g.addColorStop(0.5, `hsl(${(hue + 40) % 360}, ${sat + 10}%, ${lit + 10}%)`)
  g.addColorStop(1, `hsl(${(hue + 80) % 360}, ${sat}%, ${lit - 5}%)`)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)

  ctx.fillStyle = 'rgba(255,255,255,0.15)'
  ctx.beginPath(); ctx.arc(w * 0.7, h * 0.3, w * 0.25, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(w * 0.25, h * 0.65, w * 0.2, 0, Math.PI * 2); ctx.fill()

  ctx.font = `400 ${Math.min(14, w / 35)}px "Inter", system-ui`
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.textAlign = 'center'
  const words = prompt.split(' ')
  for (let i = 0; i < Math.min(words.length, 6); i++) {
    ctx.fillText(words[i], w / 2, h / 2 - 30 + i * 22)
  }

  return {
    id: `gen_${Date.now()}_${id}`,
    dataUrl: canvas.toDataURL('image/png'),
    prompt,
    params: { prompt, baseModel: 'SDXL', lora: 'demo', model: 'gpt-image-2', aspectRatio: aspectRatio as AspectRatioOption },
    timestamp: Date.now(),
    isKept: false,
    aspectRatio: aspectRatio as AspectRatioOption,
  }
}

async function urlToDataUrl(url: string): Promise<string> {
  const response = await fetch(url)
  const blob = await response.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

interface ApiResponse {
  id: string
  status: string
  results?: { url: string }[]
  error?: string
}

export function useImageGeneration() {
  const [images, setImages] = useState<GeneratedImage[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)

  const generate = useCallback(async (params: GenerationParams) => {
    setIsGenerating(true)
    setImages([])
    setLastError(null)

    try {
      const aspectRatioValue = getAspectRatioParam(params.model, params.aspectRatio || '1:1')

      const body: Record<string, unknown> = {
        model: params.model,
        prompt: params.prompt,
        aspectRatio: aspectRatioValue,
        replyType: 'json',
      }
      if (!GPT_IMAGE_MODELS.has(params.model) && params.imageSize) {
        body.imageSize = params.imageSize
      }
      if (params.negativePrompt) body.negativePrompt = params.negativePrompt

      const response = await fetch(IMAGE_GEN_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data: ApiResponse = await response.json()

      if (!response.ok || data.status === 'failed' || data.status === 'violation') {
        setLastError(data.error || `请求失败 (${response.status})`)
        return
      }

      if (data.status === 'running') {
        setLastError('任务正在排队，请稍后在 API 平台查看结果')
        return
      }

      if (data.status === 'succeeded' && data.results && data.results.length > 0) {
        const dataUrls = await Promise.all(data.results.map(r => urlToDataUrl(r.url)))
        const newImages: GeneratedImage[] = dataUrls.map((dataUrl, i) => ({
          id: `gen_${Date.now()}_${i}`,
          dataUrl,
          prompt: params.prompt,
          params,
          timestamp: Date.now(),
          isKept: false,
          aspectRatio: params.aspectRatio,
        }))
        setImages(newImages)
      } else {
        setLastError('生成成功但未收到图片')
      }
    } catch (err) {
      setLastError(err instanceof Error ? err.message : '网络错误')
    } finally {
      setIsGenerating(false)
    }
  }, [])

  const keepImage = useCallback(async (image: GeneratedImage, styleName: string) => {
    const timestamp = formatTimestamp()
    const fileName = `${timestamp}.png`
    const relativePath = `20_Generated_Images/${fileName}`

    try {
      await saveGeneratedImage(fileName, image.dataUrl)
      setImages(prev => prev.map(img => img.id === image.id ? { ...img, isKept: true } : img))
    } catch (err) {
      console.error('[keepImage] 保存图片失败:', err)
    }

    executeKeepPipeline({
      imageDataUrl: image.dataUrl,
      generationPrompt: image.params.prompt,
      generationModel: image.params.baseModel,
      generationLora: image.params.lora,
      negativePrompt: image.params.negativePrompt,
      styleName,
      imagePath: relativePath,
    }).catch(err => console.error('[keepImage] VLM Pipeline 失败:', err))
  }, [])

  const clearImages = useCallback(() => { setImages([]) }, [])

  return { images, isGenerating, lastError, generate, keepImage, clearImages }
}
