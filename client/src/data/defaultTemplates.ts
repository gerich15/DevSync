import type { Template } from '../types/template'

export const defaultTemplates: Template[] = [
  {
    id: 'heatmap-default',
    name: 'Heatmap (по умолчанию)',
    description: 'Граф контрибуций в стиле GitHub.',
    baseConfig: {
      colors: { active: '#0f766e', empty: '#1e293b', text: '#94a3b8' },
      fontSize: 12,
    },
    customizableProperties: ['colors', 'fontSize'],
    isCustomizable: true,
    userConfig: {},
  },
  {
    id: 'reports-pdf',
    name: 'Отчёт PDF',
    description: 'Стиль экспорта в PDF.',
    baseConfig: {
      colors: { primary: '#3b82f6', secondary: '#64748b' },
      fontSize: 11,
    },
    customizableProperties: ['colors', 'fontSize'],
    isCustomizable: true,
    userConfig: {},
  },
  {
    id: 'dashboard-minimal',
    name: 'Дашборд (минимальный)',
    description: 'Минималистичный вид дашборда.',
    baseConfig: { fontSize: 14 },
    customizableProperties: ['fontSize'],
    isCustomizable: true,
    userConfig: {},
  },
]
