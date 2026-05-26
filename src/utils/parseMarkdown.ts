import yaml from 'js-yaml'
import type { StyleTemplate, LoRaItem } from '@/types'

const FRONTMATTER_REGEX = /^---\s*\n([\s\S]*?)\n---/

export function parseFrontmatter(rawMd: string): Record<string, unknown> | null {
  const match = rawMd.match(FRONTMATTER_REGEX)
  if (!match) return null

  try {
    const parsed = yaml.load(match[1])
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed as Record<string, unknown>
    }
    return null
  } catch {
    console.warn('[parseMarkdown] YAML 解析失败')
    return null
  }
}

export function extractBody(rawMd: string): string {
  const match = rawMd.match(FRONTMATTER_REGEX)
  if (!match) return rawMd.trim()
  return rawMd.slice(match[0].length).trim()
}

export function parseStyleTemplate(fileName: string, rawMd: string): StyleTemplate | null {
  const fm = parseFrontmatter(rawMd)
  if (!fm) return null

  const styleName = fm.style_name as string | undefined
  const prompt = fm.prompt as string | undefined
  if (!styleName || !prompt) return null

  let lora: string | LoRaItem[] = ''
  if (Array.isArray(fm.lora)) {
    lora = fm.lora.map(item => {
      if (typeof item === 'object' && item !== null) {
        return {
          name: (item as { name?: string }).name || '',
          weight: (item as { weight?: number }).weight || 0.5
        }
      }
      return { name: String(item), weight: 0.5 }
    })
  } else {
    lora = (fm.lora as string) || ''
  }

  return {
    fileName,
    styleName,
    prompt,
    baseModel: (fm.base_model as string) || 'SDXL',
    lora,
    negativePrompt: fm.negative_prompt as string | undefined,
  }
}

export function buildStyleMarkdown(record: {
  styleName: string
  prompt: string
  baseModel: string
  lora: string | LoRaItem[]
  imagePath: string
  negativePrompt?: string
}): string {
  const frontmatter: Record<string, unknown> = {
    style_name: record.styleName,
    prompt: record.prompt,
    base_model: record.baseModel,
    lora: record.lora,
    negative_prompt: record.negativePrompt || '',
    source_image: record.imagePath,
  }

  const yamlBlock = yaml.dump(frontmatter, {
    lineWidth: 120,
    quotingType: '"',
    forceQuotes: false,
  })

  return `---\n${yamlBlock}---\n\n# ${record.styleName}\n\n![预览](${record.imagePath})\n`
}
