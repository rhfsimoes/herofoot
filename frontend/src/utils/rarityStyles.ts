import type { ItemQuality } from '../mockData'

export const RARITY_CARD_STYLES: Record<ItemQuality, string> = {
  Fraco: 'bg-stone-900/60 border border-stone-700/50 text-stone-400',
  Normal: 'bg-stone-900 border border-stone-600 text-stone-100',
  Ótimo: 'bg-blue-950/30 border border-blue-500/50 text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.15)]',
  Lendário: 'bg-gradient-to-b from-amber-950/40 to-stone-900 border-2 border-amber-500 text-amber-300 ring-1 ring-amber-400/30 shadow-[0_0_20px_rgba(245,158,11,0.25)]',
}

export const RARITY_BADGE_STYLES: Record<ItemQuality, string> = {
  Fraco: 'bg-stone-800 text-stone-400 border border-stone-600',
  Normal: 'bg-stone-800 text-stone-200 border border-stone-500',
  Ótimo: 'bg-blue-900/60 text-blue-300 border border-blue-400/50',
  Lendário: 'bg-gradient-to-r from-amber-500 to-yellow-500 text-stone-950 font-black tracking-wider uppercase border border-amber-300 shadow-sm shadow-amber-500/50',
}

export const GOLD_GRADIENT_TEXT = 'bg-clip-text text-transparent bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500 font-extrabold'
