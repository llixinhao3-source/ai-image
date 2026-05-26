import { useState, useEffect, useCallback } from 'react'
import type { StyleTemplate } from '@/types'
import { loadStyleTemplates, getDemoTemplates } from '@/utils/fileService'

export function useStyleTemplates() {
  const [templates, setTemplates] = useState<StyleTemplate[]>(getDemoTemplates())
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    const data = await loadStyleTemplates()
    setTemplates(data)
    setIsLoading(false)
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const selectedTemplate = selectedId !== null
    ? templates.find(t => t.fileName === selectedId) ?? null
    : null

  const selectTemplate = useCallback((fileName: string | null) => { setSelectedId(fileName) }, [])

  const getInjectedParams = useCallback(() => {
    if (!selectedTemplate) return null
    return {
      prompt: selectedTemplate.prompt,
      baseModel: selectedTemplate.baseModel,
      lora: selectedTemplate.lora,
      negativePrompt: selectedTemplate.negativePrompt,
    }
  }, [selectedTemplate])

  return { templates, selectedTemplate, selectedId, isLoading, selectTemplate, refresh, getInjectedParams }
}
