import { Package, AlertTriangle, Clock } from 'lucide-react'

// ─── Tipos de Estado Vazio ───────────────────────────────────────────────────
type EmptyVariant = 'inventory' | 'no-heroes-assigned' | 'no-dungeon-result'

interface EmptyStateProps {
  variant: EmptyVariant
  className?: string
}

const VARIANTS: Record<
  EmptyVariant,
  { icon: React.ElementType; color: string; title: string; body: string }
> = {
  inventory: {
    icon: Package,
    color: 'text-amber-500',
    title: 'Armazém Vazio',
    body: 'Nenhum artefato em estoque. Forje itens na aba Oficina de Produção ou adquira-os no Balcão de Mercadorias.',
  },
  'no-heroes-assigned': {
    icon: AlertTriangle,
    color: 'text-rose-400',
    title: 'Alerta Tático',
    body: 'Nenhum colaborador designado para a expedição. A ordem de marcha não pode ser emitida sem ao menos um herói escalado.',
  },
  'no-dungeon-result': {
    icon: Clock,
    color: 'text-stone-400',
    title: 'Aguardando Ordem de Marcha',
    body: 'Nenhuma expedição registrada nesta rodada. Conclua a escalação na Fase III para liberar o despacho da força-tarefa.',
  },
}

/**
 * Componente de estado vazio com orientação contextual ao jogador.
 * Garante que nenhuma tela fique em branco sem explicar o que fazer a seguir.
 */
export default function EmptyState({ variant, className = '' }: EmptyStateProps) {
  const { icon: Icon, color, title, body } = VARIANTS[variant]

  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 py-10 px-6 text-center rounded-xl border border-stone-800/60 bg-stone-900/30 ${className}`}
      role="status"
    >
      <div
        className={`w-12 h-12 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center ${color}`}
      >
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className={`font-black text-sm uppercase tracking-wider font-mono ${color} mb-1`}>
          {title}
        </p>
        <p className="text-stone-400 text-xs leading-relaxed max-w-xs">{body}</p>
      </div>
    </div>
  )
}
