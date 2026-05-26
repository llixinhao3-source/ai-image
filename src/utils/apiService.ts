const GRS_BASE = 'https://grsai.dakka.com.cn'

let proxyChecked = false
let proxyAvailable = false

export function getStoredKey(): string { return localStorage.getItem('grs_api_key') ?? '' }
export function setStoredKey(key: string) { localStorage.setItem('grs_api_key', key) }

export async function checkProxy(): Promise<boolean> {
  if (proxyChecked) return proxyAvailable
  try {
    const res = await fetch('http://localhost:3001/api/health')
    proxyAvailable = res.ok
  } catch {
    proxyAvailable = false
  }
  proxyChecked = true
  return proxyAvailable
}

interface GenParams {
  model: string
  prompt: string
  aspectRatio: string
  imageSize?: string
  negativePrompt?: string
}

interface GenResult {
  id: string
  status: string
  results?: { url: string }[]
  error?: string
}

export async function callGenerateImage(params: GenParams): Promise<GenResult> {
  const body: Record<string, unknown> = {
    model: params.model,
    prompt: params.prompt,
    aspectRatio: params.aspectRatio,
    replyType: 'json',
  }
  if (params.imageSize) body.imageSize = params.imageSize

  if (await checkProxy()) {
    const res = await fetch('http://localhost:3001/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    return res.json()
  }

  const key = getStoredKey()
  if (!key) return { id: '0', status: 'failed', error: '请先在左下角填入 API Key' }

  const res = await fetch(`${GRS_BASE}/v1/api/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  })
  return res.json()
}

export async function callTemplates() {
  if (await checkProxy()) {
    const res = await fetch('http://localhost:3001/api/templates')
    if (res.ok) return res.json()
    throw new Error('proxy templates failed')
  }
  throw new Error('proxy unavailable')
}

export async function callSaveImage(fileName: string, dataUrl: string) {
  if (await checkProxy()) {
    const res = await fetch('http://localhost:3001/api/save-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName, dataUrl }),
    })
    if (res.ok) return res.json()
    throw new Error('proxy save-image failed')
  }

  const a = document.createElement('a')
  a.href = dataUrl
  a.download = fileName
  a.click()
  return { success: true, path: fileName }
}

export async function callSaveTemplate(fileName: string, content: string) {
  if (await checkProxy()) {
    const res = await fetch('http://localhost:3001/api/save-template', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName, content }),
    })
    if (res.ok) return res.json()
    throw new Error('proxy save-template failed')
  }

  const blob = new Blob([content], { type: 'text/markdown' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = fileName
  a.click()
  URL.revokeObjectURL(a.href)
  return { success: true, path: fileName }
}

export async function callVlm(image: string, originalPrompt: string) {
  if (await checkProxy()) {
    const res = await fetch('http://localhost:3001/api/vlm/reverse-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image, originalPrompt }),
    })
    if (res.ok) return res.json()
  }
  return { reversePrompt: originalPrompt }
}
