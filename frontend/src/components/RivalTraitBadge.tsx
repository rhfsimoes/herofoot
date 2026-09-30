import type { RivalTrait } from '../mockData'

interface RivalTraitBadgeProps {
  trait: RivalTrait
}

/**
 * Badge pill para exibição de traços permanentes de guildas rivais.
 * Traços de mitigação de terreno recebem coloração azul-ardósia distinta.
 */
export default function RivalTraitBadge({ trait }: RivalTraitBadgeProps) {
  const isTerrain = Boolean(trait.terrain_mitigation)

  const baseStyle = isTerrain
    ? 'bg-sky-950/70 border border-sky-700/50 text-sky-300'
    : 'bg-stone-700/80 border border-stone-500/70 text-amber-200'

  return (
    <span
      className={`inline-flex items-center gap-1 ${baseStyle} text-xs px-2 py-0.5 rounded-full cursor-default`}
      title={trait.description}
    >
      <span className="text-[10px]">{isTerrain ? '🛡️' : '⚔️'}</span>
      <span className="font-medium">{trait.name}</span>
    </span>
  )
}
