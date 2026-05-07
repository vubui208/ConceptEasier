import { motion } from 'framer-motion'
import { Label } from './atoms'
import { CATEGORY_ORDER, MODULES, type ModuleId } from './modules-data'
import { SOFT_SPRING } from './tokens'

export function Sidebar({
  active,
  onSelect,
}: {
  active: ModuleId
  onSelect: (m: ModuleId) => void
}) {
  return (
    <aside className="w-64 shrink-0 border-r border-[#E5E5E5] flex flex-col">
      <div className="px-6 pt-7 pb-8">
        <div className="text-[18px] font-semibold tracking-tight text-[#222]">
          ConceptEasier<span className="text-[#999]">.</span>
        </div>
        <div className="text-[11px] text-[#999] tracking-tight mt-1.5">
          Visualize the math. See the code.
        </div>
      </div>

      <nav className="px-3 flex flex-col gap-0.5 overflow-y-auto">
        {CATEGORY_ORDER.map((category) => {
          const items = MODULES.filter((m) => m.category === category)
          if (items.length === 0) return null
          return (
            <div key={category} className="flex flex-col gap-0.5 mb-3">
              <div className="px-3 mb-1.5 mt-1">
                <Label>{category}</Label>
              </div>
              {items.map((m) => {
                const Icon = m.icon
                const isActive = m.id === active
                return (
                  <button
                    key={m.id}
                    onClick={() => onSelect(m.id)}
                    className={[
                      'group relative flex items-center gap-3 px-3 py-2 rounded-md text-left',
                      'transition-colors duration-150',
                      isActive ? 'bg-[#222]/[0.05]' : 'hover:bg-[#222]/[0.025]',
                    ].join(' ')}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active"
                        className="absolute left-0 top-1.5 bottom-1.5 w-[2px] bg-[#222] rounded-full"
                        transition={SOFT_SPRING}
                      />
                    )}
                    <Icon
                      size={14}
                      strokeWidth={1.5}
                      className="text-[#222] shrink-0"
                    />
                    <div className="flex-1 min-w-0 text-[12.5px] font-medium leading-tight tracking-tight">
                      {m.label}
                    </div>
                  </button>
                )
              })}
            </div>
          )
        })}
      </nav>

      <div className="mt-auto px-6 pb-6 pt-8">
        <div className="border-t border-[#E5E5E5] pt-5">
          <div className="text-[10px] uppercase tracking-[0.14em] text-[#999] font-medium">
            About
          </div>
          <p className="text-[11.5px] text-[#666] leading-relaxed mt-2">
            A teaching prototype. Each module captures execution into a
            timeline of frames you can scrub through.
          </p>
        </div>
      </div>
    </aside>
  )
}

export type { ModuleId } from './modules-data'
