import { useState, useCallback } from 'react'
import type { GeneratedImage, GenerationParams, ImageModel, AspectRatioOption } from '@/types'
import { callGenerateImage, callSaveImage } from '@/utils/apiService'
import { executeKeepPipeline } from '@/utils/vlmPipeline'

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

      const data = await callGenerateImage({
        model: params.model,
        prompt: params.prompt,
        aspectRatio: aspectRatioValue,
        imageSize: GPT_IMAGE_MODELS.has(params.model) ? undefined : params.imageSize,
      })

      if (data.status === 'failed' || data.status === 'violation') {
        setLastError(data.error || '生成失败')
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
      await callSaveImage(fileName, image.dataUrl)
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
