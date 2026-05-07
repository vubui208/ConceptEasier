import { useState } from 'react'
import { Label, LogicBox, ModuleLayout } from '../shared/atoms'
import { T } from '../shared/tokens'

type GateId = 'AND' | 'OR' | 'XOR' | 'NAND' | 'NOR' | 'XNOR' | 'NOT'

type Gate = {
  id: GateId
  arity: 1 | 2
  expr: string
  blurb: string
  fn: (a: 0 | 1, b: 0 | 1) => 0 | 1
}

const GATES: Record<GateId, Gate> = {
  AND: {
    id: 'AND',
    arity: 2,
    expr: 'A ∧ B',
    blurb: 'Output is 1 only when both inputs are 1.',
    fn: (a, b) => ((a & b) as 0 | 1),
  },
  OR: {
    id: 'OR',
    arity: 2,
    expr: 'A ∨ B',
    blurb: 'Output is 1 if at least one input is 1.',
    fn: (a, b) => ((a | b) as 0 | 1),
  },
  XOR: {
    id: 'XOR',
    arity: 2,
    expr: 'A ⊕ B',
    blurb: 'Output is 1 when exactly one input is 1 (different inputs).',
    fn: (a, b) => ((a ^ b) as 0 | 1),
  },
  NAND: {
    id: 'NAND',
    arity: 2,
    expr: '¬(A ∧ B)',
    blurb: 'Universal gate — every other gate can be built from NANDs alone.',
    fn: (a, b) => ((1 - (a & b)) as 0 | 1),
  },
  NOR: {
    id: 'NOR',
    arity: 2,
    expr: '¬(A ∨ B)',
    blurb: 'Also functionally complete — any boolean function from NORs.',
    fn: (a, b) => ((1 - (a | b)) as 0 | 1),
  },
  XNOR: {
    id: 'XNOR',
    arity: 2,
    expr: '¬(A ⊕ B)',
    blurb: 'Equality — output is 1 when both inputs are equal.',
    fn: (a, b) => ((1 - (a ^ b)) as 0 | 1),
  },
  NOT: {
    id: 'NOT',
    arity: 1,
    expr: '¬A',
    blurb: 'Inverter — flips a single input.',
    fn: (a) => ((1 - a) as 0 | 1),
  },
}

export function TruthTablesModule() {
  const [gateId, setGateId] = useState<GateId>('AND')
  const [a, setA] = useState<0 | 1>(1)
  const [b, setB] = useState<0 | 1>(0)
  const g = GATES[gateId]
  const out = g.arity === 1 ? g.fn(a, 0) : g.fn(a, b)

  // Truth table rows
  const rows: { a: 0 | 1; b: 0 | 1; out: 0 | 1 }[] =
    g.arity === 1
      ? ([
          { a: 0, b: 0, out: g.fn(0, 0) },
          { a: 1, b: 0, out: g.fn(1, 0) },
        ] as { a: 0 | 1; b: 0 | 1; out: 0 | 1 }[])
      : ([
          { a: 0, b: 0, out: g.fn(0, 0) },
          { a: 0, b: 1, out: g.fn(0, 1) },
          { a: 1, b: 0, out: g.fn(1, 0) },
          { a: 1, b: 1, out: g.fn(1, 1) },
        ] as { a: 0 | 1; b: 0 | 1; out: 0 | 1 }[])

  const SIZE = 560

  // Gate body shape
  const GATE_X = SIZE / 2 - 60
  const GATE_Y = SIZE / 2 - 50
  const GATE_W = 140
  const GATE_H = 100
  const A_Y = GATE_Y + 25
  const B_Y = GATE_Y + GATE_H - 25
  const OUT_X = GATE_X + GATE_W + 110

  // Pin positions
  const aPin = { x: GATE_X - 80, y: A_Y }
  const bPin = { x: GATE_X - 80, y: B_Y }
  const aJunc = { x: GATE_X, y: A_Y }
  const bJunc = { x: GATE_X, y: B_Y }
  const outJunc = { x: GATE_X + GATE_W, y: GATE_Y + GATE_H / 2 }
  const outEnd = { x: OUT_X, y: outJunc.y }

  const wireColor = (v: 0 | 1) => (v === 1 ? T.green : T.line)

  const stage = (
    <div className="flex flex-col items-center justify-center w-full h-full p-6">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full max-w-[560px] aspect-square">
        {/* Gate body — generic shape, label says which gate */}
        <rect
          x={GATE_X}
          y={GATE_Y}
          width={GATE_W}
          height={GATE_H}
          rx={14}
          fill="white"
          stroke={T.ink}
          strokeWidth={1.6}
        />
        <text
          x={GATE_X + GATE_W / 2}
          y={GATE_Y + GATE_H / 2 - 4}
          textAnchor="middle"
          fontSize={20}
          fontWeight={500}
          fill={T.ink}
        >
          {g.id}
        </text>
        <text
          x={GATE_X + GATE_W / 2}
          y={GATE_Y + GATE_H / 2 + 18}
          textAnchor="middle"
          fontSize={11}
          fill="#999"
        >
          {g.expr}
        </text>

        {/* A wire */}
        {g.arity === 2 || g.arity === 1 ? (
          <>
            <line
              x1={aPin.x}
              y1={aPin.y}
              x2={aJunc.x}
              y2={aJunc.y}
              stroke={wireColor(a)}
              strokeWidth={2.6}
            />
            <circle cx={aPin.x} cy={aPin.y} r={6} fill={a ? T.green : 'white'} stroke={T.ink} strokeWidth={1.4} />
            <text x={aPin.x - 16} y={aPin.y + 4} fontSize={14} textAnchor="end" fill={T.ink} fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace">
              A = {a}
            </text>
          </>
        ) : null}

        {/* B wire — only if 2-input */}
        {g.arity === 2 && (
          <>
            <line
              x1={bPin.x}
              y1={bPin.y}
              x2={bJunc.x}
              y2={bJunc.y}
              stroke={wireColor(b)}
              strokeWidth={2.6}
            />
            <circle cx={bPin.x} cy={bPin.y} r={6} fill={b ? T.green : 'white'} stroke={T.ink} strokeWidth={1.4} />
            <text x={bPin.x - 16} y={bPin.y + 4} fontSize={14} textAnchor="end" fill={T.ink} fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace">
              B = {b}
            </text>
          </>
        )}

        {/* Output wire */}
        <line
          x1={outJunc.x}
          y1={outJunc.y}
          x2={outEnd.x}
          y2={outEnd.y}
          stroke={wireColor(out)}
          strokeWidth={2.6}
        />
        <circle cx={outEnd.x} cy={outEnd.y} r={9} fill={out ? T.green : 'white'} stroke={T.ink} strokeWidth={1.6} />
        <text x={outEnd.x + 18} y={outEnd.y + 4} fontSize={14} fill={T.ink} fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace">
          OUT = {out}
        </text>

        {/* Truth table — drawn at bottom of canvas */}
        <g>
          <text x={GATE_X - 80} y={SIZE - 130} fontSize={11} fill="#999">
            Truth Table
          </text>
          {rows.map((r, idx) => {
            const rowY = SIZE - 110 + idx * 22
            return (
              <g key={idx}>
                <text x={GATE_X - 80} y={rowY} fontSize={13} fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fill="#666">
                  A = {r.a}
                  {g.arity === 2 ? `, B = ${r.b}` : ''}
                </text>
                <text x={GATE_X - 80 + 180} y={rowY} fontSize={13} fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fill={r.out === 1 ? T.green : T.inkSofter}>
                  → {r.out}
                </text>
              </g>
            )
          })}
        </g>
      </svg>
    </div>
  )

  const controls = (
    <div className="px-5 py-5 border-b border-[#E5E5E5] flex flex-col gap-5">
      <div>
        <Label>Gate</Label>
        <div className="grid grid-cols-3 gap-1.5 mt-2">
          {(Object.keys(GATES) as GateId[]).map((id) => (
            <button
              key={id}
              onClick={() => setGateId(id)}
              className={[
                'h-8 text-[11px] tracking-tight rounded-md border transition-all',
                gateId === id
                  ? 'bg-[#222] text-white border-[#222]'
                  : 'border-[#E5E5E5] hover:bg-[#222]/[0.04]',
              ].join(' ')}
            >
              {id}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label>Inputs</Label>
        <div className="grid grid-cols-2 gap-1.5 mt-2">
          <button
            onClick={() => setA(a === 1 ? 0 : 1)}
            className={[
              'h-9 text-[12px] tracking-tight rounded-md border transition-all font-mono',
              a === 1 ? 'bg-[#5CB85C] text-white border-[#5CB85C]' : 'border-[#E5E5E5]',
            ].join(' ')}
          >
            A = {a}
          </button>
          <button
            onClick={() => setB(b === 1 ? 0 : 1)}
            disabled={g.arity !== 2}
            className={[
              'h-9 text-[12px] tracking-tight rounded-md border transition-all font-mono',
              b === 1 && g.arity === 2 ? 'bg-[#5CB85C] text-white border-[#5CB85C]' : 'border-[#E5E5E5]',
              g.arity !== 2 ? 'opacity-30 cursor-not-allowed' : '',
            ].join(' ')}
          >
            B = {b}
          </button>
        </div>
      </div>

      <div className="font-mono text-[13px] tabular-nums pt-2 border-t border-[#E5E5E5] flex items-center justify-between">
        <span className="text-[#999]">OUT</span>
        <span className={out === 1 ? 'text-[#5CB85C]' : 'text-[#999]'}>{out}</span>
      </div>
    </div>
  )

  const logic = (
    <LogicBox
      title="Logic Gates · Truth Tables"
      formula={
        <div className="flex flex-col gap-2 text-[12.5px] text-[#666] leading-relaxed">
          <div className="font-mono text-[13px] text-[#222]">{g.expr}</div>
          <div className="text-[11.5px] text-[#999] mt-1 leading-relaxed">{g.blurb}</div>
          <div className="mt-2 pt-2 border-t border-[#E5E5E5] text-[11.5px] text-[#666] leading-relaxed">
            NAND and NOR are <span className="font-medium">functionally complete</span> — every
            boolean function (and therefore every digital circuit) can be built from just one of
            them.
          </div>
        </div>
      }
    />
  )

  return <ModuleLayout stage={stage} controls={controls} logic={logic} />
}
