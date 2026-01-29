import { useState, useEffect } from 'react'
import type { Template } from '../../types/template'
import type { TemplateCustomizationService } from '../../services/templateCustomization'

interface TemplateCustomizeModalProps {
  templateId: string
  template: Template
  customizationService: TemplateCustomizationService
  onClose: () => void
  onSaved: () => void
}

const COLOR_LABELS: Record<string, string> = {
  active: 'Активная ячейка',
  empty: 'Пустая ячейка',
  text: 'Текст',
  primary: 'Основной цвет',
  secondary: 'Второстепенный',
  background: 'Фон',
}

function getColorLabel(key: string): string {
  return COLOR_LABELS[key] ?? key
}

function getCurrentValue(
  key: string,
  baseConfig: Record<string, unknown>,
  userConfig: Record<string, unknown>
): unknown {
  return userConfig[key] ?? baseConfig[key]
}

function isColorObject(value: unknown): value is Record<string, string> {
  if (value === null || typeof value !== 'object') return false
  return Object.values(value).every((v) => typeof v === 'string')
}

export function TemplateCustomizeModal({
  templateId,
  template,
  customizationService,
  onClose,
  onSaved,
}: TemplateCustomizeModalProps) {
  const props = customizationService.getCustomizableProperties(templateId)
  const baseConfig = template.baseConfig ?? {}
  const savedUserConfig = customizationService.getUserConfig(templateId)

  const [formValues, setFormValues] = useState<Record<string, unknown>>({})

  useEffect(() => {
    const initial: Record<string, unknown> = {}
    for (const key of props) {
      initial[key] = getCurrentValue(key, baseConfig, savedUserConfig)
    }
    setFormValues(initial)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId])

  const handleChange = (key: string, value: unknown) => {
    setFormValues((prev) => ({ ...prev, [key]: value }))
  }

  const handleColorChange = (key: string, colorKey: string, hex: string) => {
    const current = formValues[key]
    const obj = (typeof current === 'object' && current !== null ? { ...(current as Record<string, string>) } : {}) as Record<string, string>
    obj[colorKey] = hex
    handleChange(key, obj)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    customizationService.updateTemplateConfig(templateId, formValues)
    onSaved()
    onClose()
  }

  const handleReset = () => {
    customizationService.resetCustomization(templateId)
    onSaved()
    onClose()
  }

  if (props.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
        <div className="rounded-xl border border-white/10 bg-surface p-6 text-white shadow-xl" onClick={(e) => e.stopPropagation()}>
          <p className="text-slate-400">Нет настраиваемых свойств.</p>
          <button type="button" onClick={onClose} className="mt-4 rounded-lg bg-white/10 px-4 py-2 text-sm hover:bg-white/20">
            Закрыть
          </button>
        </div>
      </div>
    )
  }

  const FONT_SIZE_MIN = 8
  const FONT_SIZE_MAX = 24

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-white/10 bg-surface p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-xl font-semibold text-white">Настроить шаблон</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          {props.map((key) => {
            const value = formValues[key]

            if (key === 'fontSize') {
              const num = typeof value === 'number' ? value : Number(value) || 14
              return (
                <div key={key} className="space-y-2">
                  <label className="block text-sm font-medium text-slate-300">
                    Размер шрифта
                    <span className="ml-2 text-slate-500">{num} px</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={FONT_SIZE_MIN}
                      max={FONT_SIZE_MAX}
                      value={num}
                      onChange={(e) => handleChange(key, e.target.valueAsNumber)}
                      className="h-2 w-full flex-1 cursor-pointer appearance-none rounded-full bg-white/10 accent-primary"
                    />
                    <span className="w-8 text-right text-sm text-slate-400">{num}</span>
                  </div>
                </div>
              )
            }

            if (key === 'colors' && isColorObject(value)) {
              const colorEntries = Object.entries(value)
              if (colorEntries.length === 0) return null
              return (
                <div key={key} className="space-y-3">
                  <span className="block text-sm font-medium text-slate-300">Цвета</span>
                  <div className="space-y-3 rounded-lg border border-white/10 bg-background/50 p-3">
                    {colorEntries.map(([colorKey, hex]) => (
                      <div key={colorKey} className="flex items-center gap-3">
                        <input
                          type="color"
                          value={hex}
                          onChange={(e) => handleColorChange(key, colorKey, e.target.value)}
                          className="h-10 w-14 shrink-0 cursor-pointer rounded border border-white/20 bg-background p-0.5 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded"
                          title={hex}
                        />
                        <div className="flex-1">
                          <label className="block text-xs text-slate-500">{getColorLabel(colorKey)}</label>
                          <input
                            type="text"
                            value={hex}
                            onChange={(e) => handleColorChange(key, colorKey, e.target.value)}
                            className="mt-0.5 w-full rounded border border-white/10 bg-background px-2 py-1.5 font-mono text-sm text-white focus:border-primary focus:outline-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            }

            if (typeof value === 'number') {
              return (
                <div key={key} className="space-y-2">
                  <label className="block text-sm text-slate-400">{key}</label>
                  <input
                    type="range"
                    min={1}
                    max={100}
                    value={value}
                    onChange={(e) => handleChange(key, e.target.valueAsNumber)}
                    className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-primary"
                  />
                </div>
              )
            }

            return (
              <div key={key}>
                <label className="mb-1 block text-sm text-slate-400">{key}</label>
                <input
                  type="text"
                  value={(value as string) ?? ''}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-background px-3 py-2 text-white focus:border-primary focus:outline-none"
                />
              </div>
            )
          })}
          <div className="flex flex-wrap gap-2 border-t border-white/10 pt-4">
            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
            >
              Сохранить
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-lg border border-white/20 px-4 py-2 text-sm text-slate-300 hover:bg-white/10"
            >
              Сбросить
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-slate-400 hover:bg-white/10"
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
