/**
 * Базовый конфиг визуализации (цвета, шрифты, размеры и т.д.)
 */
export interface TemplateConfig {
  colors?: Record<string, string>
  fontSize?: number
  [key: string]: unknown
}

/**
 * Шаблон визуализации с поддержкой кастомизации
 */
export interface Template {
  id: string
  name: string
  description?: string
  /** Базовые настройки шаблона */
  baseConfig: TemplateConfig
  /** Список ключей, которые пользователь может переопределять (например: 'colors', 'fontSize') */
  customizableProperties?: string[]
  /** Разрешена ли кастомизация этого шаблона */
  isCustomizable: boolean
  /** Переопределения пользователя (сливаются поверх baseConfig при применении) */
  userConfig: Record<string, unknown>
}
