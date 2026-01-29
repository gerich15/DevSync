import { TemplateRenderer } from './renderer'
import { TemplateCustomizationService } from '../services/templateCustomization'
import { defaultTemplates } from '../data/defaultTemplates'

export const templateRenderer = new TemplateRenderer()
export const templateCustomizationService = new TemplateCustomizationService((id) =>
  templateRenderer.getTemplate(id)
)

defaultTemplates.forEach((t) => {
  templateRenderer.registerTemplate({
    ...t,
    userConfig: templateCustomizationService.getUserConfig(t.id),
  })
})
