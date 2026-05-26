import type { LoRaItem } from '@/types'
import { PROXY_API } from '@/types'

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
  const response = await fetch(`${PROXY_API}/api/vlm/reverse-prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: imageDataUrl, originalPrompt }),
  })

  if (!response.ok) {
    console.warn('[VLM] 反推失败，使用原始提示词')
    return originalPrompt
  }

  const data = await response.json()
  return data.reversePrompt || originalPrompt
}

export async function executeKeepPipeline(input: VLMPipelineInput): Promise<void> {
  const { imageDataUrl, generationPrompt, generationModel, generationLora, negativePrompt, styleName, imagePath } = input

  const { saveStyleTemplateFile } = await import('./fileService')
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

    await saveStyleTemplateFile(templateFileName, mdContent)
    console.log('[Pipeline] 模板已保存:', templateFileName)
  } catch (err) {
    console.error('[Pipeline] 执行失败:', err)
  }
}
