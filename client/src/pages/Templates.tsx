import { useState } from 'react'
import { templateRenderer, templateCustomizationService } from '../core/templateInstance'
import { TemplateCard } from '../components/ui/TemplateCard'
import { defaultTemplates } from '../data/defaultTemplates'
import BeamsBackground from '../components/ui/BeamsBackground'

export default function Templates() {
  const [, setVersion] = useState(0)

  const onConfigUpdated = () => {
    defaultTemplates.forEach((t) => {
      const tmpl = templateRenderer.getTemplate(t.id)
      if (tmpl) tmpl.userConfig = templateCustomizationService.getUserConfig(t.id)
    })
    setVersion((v) => v + 1)
  }

  const templates = defaultTemplates.map((t) => ({
    ...t,
    userConfig: templateCustomizationService.getUserConfig(t.id),
  }))

  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 -z-10">
        <BeamsBackground intensity="medium" />
      </div>
      <div className="relative z-10 container mx-auto px-4 py-8 md:px-6">
        <h1 className="mb-2 text-3xl font-bold text-white">Шаблоны визуализации</h1>
        <p className="mb-8 text-slate-400">
          Настройте внешний вид графиков и отчётов. Изменения сохраняются локально.
        </p>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={{ ...template, userConfig: templateCustomizationService.getUserConfig(template.id) }}
              customizationService={templateCustomizationService}
              onConfigUpdated={onConfigUpdated}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
