import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import fs from 'fs/promises'
import path from 'path'
import yaml from 'js-yaml'

const app = express()
const PORT = 3001

const API_KEY = process.env.GRS_API_KEY
const BASE_URL = process.env.GRS_BASE_URL || 'https://grsai.dakka.com.cn'

const OBSIDIAN_BASE = '/Users/sevik/Desktop/obsindian/AI-Studio'
const TEMPLATES_DIR = path.join(OBSIDIAN_BASE, '10_Style_Templates')
const IMAGES_DIR = path.join(OBSIDIAN_BASE, '20_Generated_Images')

if (!API_KEY) {
  console.warn('⚠️  未设置 GRS_API_KEY，请复制 .env.example 为 .env 并填入你的 API Key')
}

app.use(cors())
app.use(express.json({ limit: '50mb' }))

async function ensureDir(dirPath) {
  try {
    await fs.access(dirPath)
  } catch {
    await fs.mkdir(dirPath, { recursive: true })
    console.log(`[FS] 创建目录: ${dirPath}`)
  }
}

app.post('/api/generate', async (req, res) => {
  try {
    const { model, prompt, aspectRatio, replyType, images } = req.body

    if (!prompt) {
      return res.status(400).json({ error: 'prompt 不能为空' })
    }

    const body = {
      model: model || 'gpt-image-2',
      prompt,
      aspectRatio: aspectRatio || '1:1',
      replyType: replyType || 'json',
      ...(images && images.length > 0 ? { images } : {}),
    }

    console.log(`[Proxy] → ${model || 'gpt-image-2'} | ${aspectRatio} | "${prompt.slice(0, 50)}..."`)

    const response = await fetch(`${BASE_URL}/v1/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error(`[Proxy] ← API 错误: ${data.error || response.status}`)
      return res.status(response.status).json(data)
    }

    if (data.status === 'succeeded' && data.results) {
      console.log(`[Proxy] ← 成功! ${data.results.length} 张图片`)
    } else if (data.status === 'running') {
      console.log(`[Proxy] ← 排队中, ID: ${data.id}`)
    } else {
      console.log(`[Proxy] ← 状态: ${data.status}`)
    }

    res.json(data)
  } catch (err) {
    console.error('[Proxy] 请求异常:', err)
    res.status(500).json({ error: '代理服务器内部错误' })
  }
})

app.get('/api/templates', async (req, res) => {
  try {
    await ensureDir(TEMPLATES_DIR)
    const files = await fs.readdir(TEMPLATES_DIR)
    const mdFiles = files.filter(f => f.endsWith('.md'))

    const templates = []
    for (const fileName of mdFiles) {
      try {
        const raw = await fs.readFile(path.join(TEMPLATES_DIR, fileName), 'utf-8')
        const match = raw.match(/^---\s*\n([\s\S]*?)\n---/)
        if (!match) continue

        const fm = yaml.load(match[1])
        if (typeof fm !== 'object' || fm === null) continue

        const styleName = fm.style_name
        const prompt = fm.prompt
        if (!styleName || !prompt) continue

        let lora = ''
        if (Array.isArray(fm.lora)) {
          lora = fm.lora.map(item => {
            if (typeof item === 'object' && item !== null) {
              return { name: item.name || '', weight: item.weight || 0.5 }
            }
            return { name: String(item), weight: 0.5 }
          })
        } else {
          lora = fm.lora || ''
        }

        templates.push({
          fileName,
          styleName,
          prompt,
          baseModel: fm.base_model || 'SDXL',
          lora,
          negativePrompt: fm.negative_prompt || '',
        })
      } catch (e) {
        console.warn(`[Templates] 解析 ${fileName} 失败:`, e.message)
      }
    }

    console.log(`[Templates] 返回 ${templates.length} 个模板`)
    res.json(templates)
  } catch (err) {
    console.error('[Templates] 读取失败:', err)
    res.status(500).json({ error: '读取模板失败' })
  }
})

app.post('/api/save-image', async (req, res) => {
  try {
    const { fileName, dataUrl } = req.body

    if (!fileName || !dataUrl) {
      return res.status(400).json({ error: 'fileName 和 dataUrl 不能为空' })
    }

    await ensureDir(IMAGES_DIR)

    const base64Match = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/)
    if (!base64Match) {
      return res.status(400).json({ error: '无效的 dataUrl 格式' })
    }

    const buffer = Buffer.from(base64Match[2], 'base64')
    const filePath = path.join(IMAGES_DIR, fileName)

    await fs.writeFile(filePath, buffer)
    console.log(`[FS] 图片已保存: ${filePath} (${(buffer.length / 1024).toFixed(1)}KB)`)

    res.json({ success: true, path: filePath })
  } catch (err) {
    console.error('[FS] 保存图片失败:', err)
    res.status(500).json({ error: '保存图片失败: ' + err.message })
  }
})

app.post('/api/save-template', async (req, res) => {
  try {
    const { fileName, content } = req.body

    if (!fileName || !content) {
      return res.status(400).json({ error: 'fileName 和 content 不能为空' })
    }

    await ensureDir(TEMPLATES_DIR)

    const filePath = path.join(TEMPLATES_DIR, fileName)
    await fs.writeFile(filePath, content, 'utf-8')
    console.log(`[FS] 模板已保存: ${filePath}`)

    res.json({ success: true, path: filePath })
  } catch (err) {
    console.error('[FS] 保存模板失败:', err)
    res.status(500).json({ error: '保存模板失败: ' + err.message })
  }
})

app.post('/api/vlm/reverse-prompt', async (req, res) => {
  try {
    const { image } = req.body

    if (!image) {
      return res.status(400).json({ error: 'image 不能为空' })
    }

    const vlmApiKey = process.env.VLM_API_KEY
    const vlmBaseUrl = process.env.VLM_BASE_URL

    if (!vlmApiKey || !vlmBaseUrl) {
      console.log('[VLM] 未配置 VLM API，使用原始提示词作为回退')
      const fallbackPrompt = req.body.originalPrompt || 'AI generated artwork'
      return res.json({ reversePrompt: fallbackPrompt })
    }

    const response = await fetch(`${vlmBaseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${vlmApiKey}`,
      },
      body: JSON.stringify({
        model: process.env.VLM_MODEL || 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: '请详细描述这张图片的艺术风格、色调、构图、光影和视觉元素，生成一段适合用于 AI 绘图的英文提示词（prompt），要求极具艺术细节。' },
              { type: 'image_url', image_url: { url: image } },
            ],
          },
        ],
        max_tokens: 500,
      }),
    })

    const data = await response.json()
    const reversePrompt = data.choices?.[0]?.message?.content || req.body.originalPrompt || 'AI generated artwork'

    console.log(`[VLM] 反推提示词: ${reversePrompt.slice(0, 60)}...`)
    res.json({ reversePrompt })
  } catch (err) {
    console.error('[VLM] 反推失败:', err)
    const fallbackPrompt = req.body.originalPrompt || 'AI generated artwork'
    res.json({ reversePrompt: fallbackPrompt })
  }
})

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', keyConfigured: !!API_KEY })
})

app.listen(PORT, () => {
  console.log(`\n🚀 AI Studio 代理服务器已启动`)
  console.log(`   地址: http://localhost:${PORT}`)
  console.log(`   API Key: ${API_KEY ? API_KEY.slice(0, 8) + '...' + API_KEY.slice(-4) : '未配置'}`)
  console.log(`   上游: ${BASE_URL}`)
  console.log(`   模板目录: ${TEMPLATES_DIR}`)
  console.log(`   图片目录: ${IMAGES_DIR}\n`)
})
