import { useState, useRef } from 'react'

// ─── Glossário Corporativo Medieval ────────────────────────────────────────
export const GLOSSARY: Record<string, string> = {
  'Fadiga':
    'Índice de Desgaste Operacional — Colaboradores acima de 70% ficam inaptos para expedição e requerem intervenção clínica obrigatória.',
  'Confiança da Contratante':
    'Métrica de reputação junto à Coroa Contratante. Auditorias aprovadas a incrementam; sanções e derrotas a deterioram. Abaixo de 30%, contratos são rescindidos compulsoriamente.',
  'Boletim de Mercado':
    'Relatório semanal emitido pela Câmara de Comércio da Liga. Indica o item com multiplicador de demanda elevado — vender esse tipo rende bônus de receita.',
  'Suprimentos':
    'Reservas de Pontos de Energia (PE) usadas por sala na expedição. Cada sala consome PE base + custo extra do terreno. Ao esgotar, a incursão é abortada.',
  'Pontos de Expedição':
    'Unidade de medida de desempenho na expedição (PE). Determinados pela força do elenco e itens equipados. Confrontados com os PE da guilda rival para definir o resultado da rodada.',
}

interface TooltipProps {
  /** Termo exato a ser destacado */
  term: string
  /** Conteúdo a envolver (children será renderizado com o termo sublinhado) */
  children?: React.ReactNode
  /** Se true, renderiza apenas o termo sem children externos */
  inline?: boolean
}

/**
 * Tooltip contextual corporativo-medieval.
 * Uso: <Tooltip term="Fadiga">texto que contém o termo</Tooltip>
 * Ou:  <Tooltip term="Fadiga" inline />
 */
export default function Tooltip({ term, children, inline = false }: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const ref = useRef<HTMLSpanElement>(null)

  const definition = GLOSSARY[term]
  if (!definition) return <>{children ?? term}</>

  function handleMouseEnter(e: React.MouseEvent) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setPos({ x: rect.left, y: rect.bottom + window.scrollY + 6 })
    setVisible(true)
  }

  function handleMouseLeave() {
    setVisible(false)
  }

  return (
    <>
      <span
        ref={ref}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative cursor-help border-b border-dashed border-amber-600/60 text-amber-200 hover:text-amber-100 transition-colors"
        aria-label={`Definição: ${term}`}
      >
        {inline ? term : (children ?? term)}
      </span>

      {visible && (
        <div
          className="fixed z-[9999] max-w-xs bg-stone-800 border border-amber-700/40 text-stone-300 text-xs rounded-lg shadow-2xl p-3 leading-relaxed pointer-events-none"
          style={{ left: pos.x, top: pos.y }}
          role="tooltip"
        >
          <span className="block text-amber-400 font-bold font-mono uppercase tracking-wider text-[10px] mb-1">
            {term}
          </span>
          {definition}
        </div>
      )}
    </>
  )
}

// ─── Helper: injeta tooltips automaticamente num texto ──────────────────────
/**
 * Divide `text` nos termos do glossário e envolve cada ocorrência com <Tooltip>.
 * Útil para textos dinâmicos vindos do backend.
 */
export function TooltipText({ text }: { text: string }) {
  const terms = Object.keys(GLOSSARY)
  // Escapa caracteres especiais do regex
  const pattern = terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')
  const regex = new RegExp(`(${pattern})`, 'g')
  const parts = text.split(regex)

  return (
    <>
      {parts.map((part, i) =>
        GLOSSARY[part] ? (
          <Tooltip key={i} term={part} inline />
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  )
}
