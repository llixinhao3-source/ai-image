export interface LoRaItem {
  name: string
  weight: number
}

export type ImageModel =
  | 'gpt-image-2' | 'gpt-image-2-vip'
  | 'nano-banana' | 'nano-banana-fast' | 'nano-banana-2' | 'nano-banana-2-cl'
  | 'nano-banana-2-4k-cl' | 'nano-banana-pro' | 'nano-banana-pro-cl'
  | 'nano-banana-pro-vip' | 'nano-banana-pro-4k-vip' | 'nano-banana-pro-vt'

export type AspectRatioOption = '1:1' | '2:3' | '3:2' | '16:9'

export type ImageSize = '1K' | '2K' | '4K'

export interface StyleTemplate {
  fileName: string
  styleName: string
  prompt: string
  baseModel: string
  lora: string | LoRaItem[]
  negativePrompt?: string
}

export interface GenerationParams {
  prompt: string
  negativePrompt?: string
  baseModel: string
  lora: string | LoRaItem[]
  aspectRatio?: AspectRatioOption
  model: ImageModel
  imageSize?: ImageSize
}

export interface GeneratedImage {
  id: string
  dataUrl: string
  prompt: string
  params: GenerationParams
  timestamp: number
  isKept: boolean
  aspectRatio?: AspectRatioOption
}

export const OBSIDIAN_PATHS = {
  styleTemplates: '/Users/sevik/Desktop/obsindian/AI-Studio/10_Style_Templates',
  generatedImages: '/Users/sevik/Desktop/obsindian/AI-Studio/20_Generated_Images',
} as const

export const PROXY_API = 'http://localhost:3001'
