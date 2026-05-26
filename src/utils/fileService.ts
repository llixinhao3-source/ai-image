import type { StyleTemplate } from '@/types'
import { callTemplates } from '@/utils/apiService'

export async function loadStyleTemplates(): Promise<StyleTemplate[]> {
  try {
    const templates: StyleTemplate[] = await callTemplates()
    if (templates.length > 0) return templates
    return getDemoTemplates()
  } catch (err) {
    console.error('[fileService] 读取风格模板失败，使用内置模板')
    return getDemoTemplates()
  }
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
      fileName: 'ebay.md',
      styleName: 'eBay电商纯白商品图',
      prompt: 'Professional commercial product photography, [replace with your product], centered composition, clean crisp white background (#FFFFFF), studio softbox lighting, sharp focus, high-end catalog quality, realistic textures, detailed materials, 1:1 aspect ratio',
      baseModel: 'SDXL_Studio_Product_v2',
      lora: [
        { name: 'Commercial_Product_Studio_v1', weight: 0.8 },
        { name: 'Perfect_White_Background', weight: 0.6 },
      ],
      negativePrompt: 'human, hands, shadows on background, gradient background, reflection, clutter, text, watermark, low quality, distorted, bad geometry',
    },
    {
      fileName: 'cinematic-light.md',
      styleName: '电影级光影',
      prompt: 'cinematic lighting, volumetric rays, rim light, shallow depth of field, 8k resolution, hyperrealistic',
      baseModel: 'SDXL',
      lora: 'cinematic_v2:0.8',
      negativePrompt: 'blurry, low quality, overexposed',
    },
    {
      fileName: 'anime-portrait.md',
      styleName: '二次元动漫风',
      prompt: 'masterpiece, best quality, 1girl, detailed eyes, soft lighting, vibrant colors, anime style, trending on pixiv',
      baseModel: 'SDXL_Anime_v3',
      lora: 'anime_style_v2:0.7',
      negativePrompt: 'lowres, bad anatomy, bad hands, missing fingers, extra digit',
    },
  ]
}
