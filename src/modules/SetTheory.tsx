import { useState } from 'react'
import { Label, LogicBox, ModuleLayout } from '../shared/atoms'
import { T } from '../shared/tokens'

const SIZE = 560
const R = 130
const CX_A = SIZE / 2 - 70
const CX_B = SIZE / 2 + 70
const CY_AB = SIZE / 2 - 40
const CX_C = SIZE / 2
const CY_C = SIZE / 2 + 60

/**
 * The 7 disjoint regions of three overlapping circles + the outside.
 * Each region is identified by which circles it's INSIDE.
 *   "100" = inside A only (outside B, outside C)
 *   "111" = inside all three
 *   "000" = outside all (the universe minus A∪B∪C)
 */
type RegionKey =
  | '100'
  | '010'
  | '001'
  | '110'
  | '101'
  | '011'
  | '111'
  | '000'

type Op = {
  id: string
  label: string
  setExpr: string
  // Returns the set of region keys to highlight.
  regions: Set<RegionKey>
}

const ALL_REGIONS: RegionKey[] = [
  '100',
  '010',
  '001',
  '110',
  '101',
  '011',
  '111',
  '000',
]

const OPS: Op[] = [
  { id: 'A', label: 'A', setExpr: 'A', regions: new Set(['100', '110', '101', '111']) },
  { id: 'B', label: 'B', setExpr: 'B', regions: new Set(['010', '110', '011', '111']) },
  { id: 'C', label: 'C', setExpr: 'C', regions: new Set(['001', '101', '011', '111']) },
  {
    id: 'AuB',
    label: 'A ∪ B',
    setExpr: 'A ∪ B',
    regions: new Set(['100', '010', '110', '101', '011', '111']),
  },
  {
    id: 'AnB',
    label: 'A ∩ B',
    setExpr: 'A ∩ B',
    regions: new Set(['110', '111']),
  },
  { id: 'A-B', label: 'A − B', setExpr: 'A \\ B', regions: new Set(['100', '101']) },
  {
    id: 'AxorB',
    label: 'A △ B',
    setExpr: 'A △ B = (A ∪ B) − (A ∩ B)',
    regions: new Set(['100', '010', '101', '011']),
  },
  {
    id: 'AuBuC',
    label: 'A ∪ B ∪ C',
    setExpr: 'A ∪ B ∪ C',
    regions: new Set(['100', '010', '001', '110', '101', '011', '111']),
  },
  {
    id: 'AnBnC',
    label: 'A ∩ B ∩ C',
    setExpr: 'A ∩ B ∩ C',
    regions: new Set(['111']),
  },
  {
    id: 'Ac',
    label: 'Aᶜ',
    setExpr: "complement of A",
    regions: new Set(['010', '001', '011', '000']),
  },
]

export function SetTheoryModule() {
  const [opId, setOpId] = useState<string>('AnB')
  const op = OPS.find((o) => o.id === opId) ?? OPS[0]
  const highlight = op.regions

  // Build SVG fragment for each region. We use nested clip-paths and masks
  // so each disjoint region only fills where it should.
  // - clip-path applied to a group restricts the children to the *inside*
  //   of the masking shape (intersection).
  // - mask elements with white-on-black let us subtract regions ("outside of B")
  //   by stacking them inside <g mask="...">.
  const regionFill = (key: RegionKey) => {
    const fill = T.ink
    const opacity = highlight.has(key) ? 0.45 : 0
    if (opacity === 0) return null

    // For each circle, decide whether we need to clip "inside" or mask "outside".
    const insideA = key[0] === '1'
    const insideB = key[1] === '1'
    const insideC = key[2] === '1'

    // Construct the nested element: start with an outer rect, then wrap with
    // either clip-path (intersect with circle) or mask (subtract circle).
    let node = (
      <rect x={0} y={0} width={SIZE} height={SIZE} fill={fill} fillOpacity={opacity} />
    )
    // Order doesn't matter; chain three wrappers.
    node = wrap(node, 'A', insideA)
    node = wrap(node, 'B', insideB)
    node = wrap(node, 'C', insideC)
    return <g key={key}>{node}</g>
  }

  return (
    <ModuleLayoutWrapper>
      <div className="flex flex-col items-center justify-center w-full h-full p-6">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full max-w-[560px] aspect-square">
          <defs>
            <clipPath id="clip-A">
              <circle cx={CX_A} cy={CY_AB} r={R} />
            </clipPath>
            <clipPath id="clip-B">
              <circle cx={CX_B} cy={CY_AB} r={R} />
            </clipPath>
            <clipPath id="clip-C">
              <circle cx={CX_C} cy={CY_C} r={R} />
            </clipPath>
            <mask id="not-A">
              <rect width="100%" height="100%" fill="white" />
              <circle cx={CX_A} cy={CY_AB} r={R} fill="black" />
            </mask>
            <mask id="not-B">
              <rect width="100%" height="100%" fill="white" />
              <circle cx={CX_B} cy={CY_AB} r={R} fill="black" />
            </mask>
            <mask id="not-C">
              <rect width="100%" height="100%" fill="white" />
              <circle cx={CX_C} cy={CY_C} r={R} fill="black" />
            </mask>
          </defs>

          {/* Highlighted regions */}
          {ALL_REGIONS.map(regionFill)}

          {/* Outline circles */}
          <circle cx={CX_A} cy={CY_AB} r={R} fill="none" stroke={T.ink} strokeWidth={1.6} />
          <circle cx={CX_B} cy={CY_AB} r={R} fill="none" stroke={T.ink} strokeWidth={1.6} />
          <circle cx={CX_C} cy={CY_C} r={R} fill="none" stroke={T.ink} strokeWidth={1.6} />

          {/* Labels */}
          <text x={CX_A - R + 18} y={CY_AB - R + 24} fontSize={16} fontWeight={500} fill={T.ink}>
            A
          </text>
          <text x={CX_B + R - 26} y={CY_AB - R + 24} fontSize={16} fontWeight={500} fill={T.ink}>
            B
          </text>
          <text x={CX_C + R - 24} y={CY_C + R - 14} fontSize={16} fontWeight={500} fill={T.ink}>
            C
          </text>
        </svg>
      </div>
    </ModuleLayoutWrapper>
  )

  function ModuleLayoutWrapper({ children }: { children: React.ReactNode }) {
    const controls = (
      <div className="px-5 py-5 border-b border-[#E5E5E5] flex flex-col gap-3">
        <Label>Operation</Label>
        <div className="grid grid-cols-2 gap-1.5">
          {OPS.map((o) => (
            <button
              key={o.id}
              onClick={() => setOpId(o.id)}
              className={[
                'h-8 text-[11.5px] tracking-tight rounded-md border transition-all',
                opId === o.id
                  ? 'bg-[#222] text-white border-[#222]'
                  : 'border-[#E5E5E5] hover:bg-[#222]/[0.04]',
              ].join(' ')}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
    )

    const logic = (
      <LogicBox
        title="Set Theory"
        formula={
          <div className="flex flex-col gap-2 text-[12.5px] text-[#666] leading-relaxed">
            <div className="font-mono text-[13px] text-[#222]">{op.setExpr}</div>
            <div className="text-[11.5px] text-[#999] mt-1 leading-relaxed">
              Three overlapping circles partition the plane into 8 disjoint regions (7 inside +
              outside). Every set expression is some union of those atoms.
            </div>
            <div className="mt-2 pt-2 border-t border-[#E5E5E5] text-[11.5px] text-[#666] leading-relaxed">
              <span className="font-mono">A △ B = (A − B) ∪ (B − A)</span> — the symmetric
              difference is what's in exactly one of the two sets.
            </div>
          </div>
        }
      />
    )

    return <ModuleLayout stage={children} controls={controls} logic={logic} />
  }
}

// Wrap an SVG element either with clipPath (inside circle) or mask (outside circle).
function wrap(node: React.ReactElement, circle: 'A' | 'B' | 'C', inside: boolean) {
  if (inside) {
    return <g clipPath={`url(#clip-${circle})`}>{node}</g>
  }
  return <g mask={`url(#not-${circle})`}>{node}</g>
}
