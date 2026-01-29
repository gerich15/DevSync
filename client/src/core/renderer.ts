import type { Template, TemplateConfig } from '../types/template'

/**
 * Применяет шаблон: сначала базовый конфиг, затем переопределения из userConfig.
 */
export class TemplateRenderer {
  private templates = new Map<string, Template>()

  registerTemplate(template: Template): void {
    this.templates.set(template.id, template)
  }

  getTemplate(templateId: string): Template | undefined {
    return this.templates.get(templateId)
  }

  /**
   * Возвращает итоговый конфиг: baseConfig + userConfig (переопределения поверх базы).
   */
  applyTemplate(templateId: string): TemplateConfig {
    const template = this.templates.get(templateId)
    if (!template) {
      throw new Error(`Template not found: ${templateId}`)
    }
    const base = { ...template.baseConfig } as TemplateConfig
    const overrides = template.userConfig ?? {}
    return { ...base, ...overrides } as TemplateConfig
  }
}
