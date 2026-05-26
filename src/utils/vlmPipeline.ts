import type { LoRaItem } from '@/types'
import { callVlm, callSaveTemplate } from '@/utils/apiService'

interface VLMPipelineInput {
  imageDataUrl: string
  generationPrompt: string
  generationModel: string
  generationLora: string | LoRaItem[]
  negativePrompt?: string
  styleName: string
  imagePath: string
  userPrompt?: string
  stylePrompt?: string
}

function formatTimestamp(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `img_${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`
}

function stripChineseUnsafe(s: string): string {
  return s.replace(/[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]+/g, '').replace(/[,，]+\s*/g, ',').replace(/\s{2,}/g, ' ').replace(/^[,，\s]+/, '').replace(/[,，\s]+$/, '').trim()
}

async function reversePromptFromImage(opts: {
  imageDataUrl: string
  generationPrompt: string
  stylePrompt?: string
}): Promise<string> {
  const data = await callVlm(opts.imageDataUrl, opts.generationPrompt)
  if (data.reversePrompt && data.reversePrompt !== opts.generationPrompt) return data.reversePrompt

  if (opts.stylePrompt) {
    return opts.stylePrompt
  }
  const cleaned = stripChineseUnsafe(opts.generationPrompt)
  return cleaned.length > 20 ? cleaned : opts.generationPrompt
}

export async function executeKeepPipeline(input: VLMPipelineInput): Promise<void> {
  const { imageDataUrl, generationPrompt, generationModel, generationLora, negativePrompt, styleName, imagePath, stylePrompt } = input

  const { buildStyleMarkdown } = await import('./parseMarkdown')

  try {
    const reversePrompt = await reversePromptFromImage({
      imageDataUrl,
      generationPrompt,
      stylePrompt,
    })

    const sanitizedStyleName = styleName.replace(/[^a-zA-Z0-9\u4e00-\u9fff_-]/g, '_')
    const templateFileName = `${formatTimestamp()}_${sanitizedStyleName}.md`

    const mdContent = buildStyleMarkdown({
      styleName,
      prompt: reversePrompt,
      baseModel: generationModel,
      lora: generationLora,
      imagePath,
      negativePrompt,
    })

    await callSaveTemplate(templateFileName, mdContent)
    console.log('[Pipeline] 模板已保存:', templateFileName)
  } catch (err) {
    console.error('[Pipeline] 执行失败:', err)
  }
}
