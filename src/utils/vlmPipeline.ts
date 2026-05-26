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
}

function formatTimestamp(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `img_${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`
}

async function reversePromptFromImage(imageDataUrl: string, originalPrompt: string): Promise<string> {
  const data = await callVlm(imageDataUrl, originalPrompt)
  return data.reversePrompt || originalPrompt
}

export async function executeKeepPipeline(input: VLMPipelineInput): Promise<void> {
  const { imageDataUrl, generationPrompt, generationModel, generationLora, negativePrompt, styleName, imagePath } = input

  const { buildStyleMarkdown } = await import('./parseMarkdown')

  try {
    const reversePrompt = await reversePromptFromImage(imageDataUrl, generationPrompt)

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
