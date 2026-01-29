import type { Template } from '../types/template'

const STORAGE_KEY_PREFIX = 'devsync-template-config'

/**
 * Сервис кастомизации шаблонов визуализации.
 * Хранит переопределения пользователя в LocalStorage (при необходимости можно заменить на API).
 */
export class TemplateCustomizationService {
  constructor(private getTemplate: (templateId: string) => Template | undefined) {}

  /**
   * Возвращает список свойств, которые можно менять для данного шаблона
   * (например: 'colors', 'fontSize').
   */
  getCustomizableProperties(templateId: string): string[] {
    const template = this.getTemplate(templateId)
    if (!template?.isCustomizable) return []
    return template.customizableProperties ?? []
  }

  /**
   * Сохраняет переопределения пользователя (LocalStorage).
   * При необходимости можно добавить отправку на бэкенд.
   */
  updateTemplateConfig(templateId: string, overrides: Record<string, unknown>): void {
    const key = `${STORAGE_KEY_PREFIX}-${templateId}`
    localStorage.setItem(key, JSON.stringify(overrides))
  }

  /**
   * Сбрасывает кастомизацию шаблона.
   */
  resetCustomization(templateId: string): void {
    const key = `${STORAGE_KEY_PREFIX}-${templateId}`
    localStorage.removeItem(key)
  }

  /**
   * Возвращает сохранённые переопределения пользователя для шаблона.
   * Используется при загрузке шаблона, чтобы подставить userConfig.
   */
  getUserConfig(templateId: string): Record<string, unknown> {
    const key = `${STORAGE_KEY_PREFIX}-${templateId}`
    const raw = localStorage.getItem(key)
    if (!raw) return {}
    try {
      return (JSON.parse(raw) as Record<string, unknown>) ?? {}
    } catch {
      return {}
    }
  }
}
