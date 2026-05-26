import type { StyleTemplate } from '@/types'
import { PROXY_API } from '@/types'

export async function loadStyleTemplates(): Promise<StyleTemplate[]> {
  try {
    const response = await fetch(`${PROXY_API}/api/templates`)
    if (!response.ok) throw new Error('请求失败')
    const templates: StyleTemplate[] = await response.json()
    if (templates.length > 0) return templates
    return getDemoTemplates()
  } catch (err) {
    console.error('[fileService] 读取风格模板失败:', err)
    return getDemoTemplates()
  }
}

export async function saveGeneratedImage(fileName: string, dataUrl: string): Promise<string> {
  const response = await fetch(`${PROXY_API}/api/save-image`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileName, dataUrl }),
  })
  if (!response.ok) throw new Error('保存图片失败')
  return fileName
}

export async function saveStyleTemplateFile(fileName: string, mdContent: string): Promise<void> {
  const response = await fetch(`${PROXY_API}/api/save-template`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileName, content: mdContent }),
  })
  if (!response.ok) throw new Error('保存模板失败')
}

export function getDemoTemplates(): StyleTemplate[] {
  return [
    {
      fileName: 'muji.md',
      styleName: '无印良品原木风',
      prompt: 'Muji style aesthetic, minimalist interior design, light oak wood texture, warm cinematic lighting, soft shadows, clean white walls, linen fabrics, organized and peaceful atmosphere, photorealistic, 8k resolution, architectural digest photography',
      baseModel: 'SDXL_Muji_Minimalist_v1',
      lora: [
        { name: 'Muji_Aesthetic_v2', weight: 0.75 },
        { name: 'Natural_Light_Soft', weight: 0.5 },
      ],
      negativePrompt: 'cluttered, messy, neon, dark, high contrast, oversaturated, deformed, low quality',
    },
    {
      fileName: 'cinematic-light.md',
      styleName: '电影级光影',
      prompt: 'cinematic lighting, volumetric rays, rim light, shallow depth of field, 8k resolution',
      baseModel: 'SDXL',
      lora: 'cinematic_v2:0.8',
      negativePrompt: 'blurry, low quality, overexposed',
    },
  ]
}
