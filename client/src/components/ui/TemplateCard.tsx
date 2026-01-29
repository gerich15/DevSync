import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Template } from '../../types/template'
import type { TemplateCustomizationService } from '../../services/templateCustomization'
import { TemplateCustomizeModal } from './TemplateCustomizeModal'

interface TemplateCardProps {
  template: Template
  customizationService: TemplateCustomizationService
  onConfigUpdated: () => void
}

export function TemplateCard({ template, customizationService, onConfigUpdated }: TemplateCardProps) {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-xl border border-white/10 bg-surface/80 p-6 shadow-xl backdrop-blur"
      >
        <div className="flex flex-col gap-3">
          <div>
            <h3 className="text-lg font-semibold text-white">{template.name}</h3>
            {template.description && (
              <p className="mt-1 text-sm text-slate-400">{template.description}</p>
            )}
          </div>
          {template.isCustomizable && (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="w-fit rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Настроить
            </button>
          )}
        </div>
      </motion.div>

      {modalOpen && (
        <TemplateCustomizeModal
          templateId={template.id}
          template={template}
          customizationService={customizationService}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            onConfigUpdated()
            setModalOpen(false)
          }}
        />
      )}
    </>
  )
}
