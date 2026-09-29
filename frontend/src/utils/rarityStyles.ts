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

export type MaterialRarity = 'Comum' | 'Raro' | 'Épico' | 'Lendário'

export const MATERIAL_RARITY_STYLES: Record<
  MaterialRarity,
  {
    badge: string
    text: string
    border: string
    bg: string
    glow: string
    dot: string
  }
> = {
  Comum: {
    badge: 'bg-stone-900/90 text-slate-400 border border-stone-700 font-mono text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider',
    text: 'text-slate-300',
    border: 'border-stone-700',
    bg: 'bg-stone-900/60',
    glow: '',
    dot: 'bg-slate-400',
  },
  Raro: {
    badge: 'bg-sky-950/70 text-sky-400 border border-sky-700/50 font-mono text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider shadow-[0_0_8px_rgba(56,189,248,0.15)]',
    text: 'text-sky-300',
    border: 'border-sky-700/50',
    bg: 'bg-sky-950/20',
    glow: 'shadow-[0_0_8px_rgba(56,189,248,0.15)]',
    dot: 'bg-sky-400 shadow-[0_0_4px_rgba(56,189,248,0.8)]',
  },
  Épico: {
    badge: 'bg-purple-950/70 text-purple-300 border border-purple-700/50 font-mono text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(192,132,252,0.2)]',
    text: 'text-purple-300',
    border: 'border-purple-700/50',
    bg: 'bg-purple-950/20',
    glow: 'shadow-[0_0_10px_rgba(192,132,252,0.2)]',
    dot: 'bg-purple-400 shadow-[0_0_6px_rgba(192,132,252,0.8)]',
  },
  Lendário: {
    badge: 'bg-gradient-to-r from-amber-500/25 via-yellow-500/20 to-amber-600/25 text-amber-300 border border-amber-500/60 font-mono text-[10px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider shadow-[0_0_14px_rgba(245,158,11,0.25)] ring-1 ring-amber-400/30',
    text: 'text-amber-300 font-bold',
    border: 'border-amber-500/60',
    bg: 'bg-gradient-to-br from-amber-950/30 via-stone-900 to-amber-900/20',
    glow: 'shadow-[0_0_14px_rgba(245,158,11,0.25)] ring-1 ring-amber-500/40',
    dot: 'bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.9)] animate-pulse',
  },
}

export const MATERIAL_RARITY_MAP: Record<string, MaterialRarity> = {
  // Comum
  mat_iron_ore: 'Comum',
  mat_soapstone: 'Comum',
  mat_ember_coal: 'Comum',
  mat_granite_dust: 'Comum',
  mat_common_ash: 'Comum',
  mat_glowing_moss: 'Comum',
  mat_eucalyptus_herb: 'Comum',
  mat_tanned_leather: 'Comum',
  mat_scaly_leather: 'Comum',
  mat_lapis_powder: 'Comum',
  mat_flour: 'Comum',
  mat_wild_honey: 'Comum',

  // Raro
  mat_mithril_ingot: 'Raro',
  mat_black_steel: 'Raro',
  mat_ancient_wood: 'Raro',
  mat_mandrake_root: 'Raro',
  mat_basilisk_scale: 'Raro',
  mat_griffin_claw: 'Raro',
  mat_mana_crystal: 'Raro',
  mat_pure_ectoplasm: 'Raro',

  // Épico
  mat_adamantite_ore: 'Épico',
  mat_moonlight_herb: 'Épico',
  mat_chimera_horn: 'Épico',
  mat_liquid_mana_crystal: 'Épico',
  mat_fire_golem_core: 'Épico',

  // Lendário
  mat_runic_gold: 'Lendário',
  mat_ancient_dragon_scale: 'Lendário',
  mat_soul_stone: 'Lendário',
}

export function getMaterialRarity(materialIdOrName?: string, explicitRarity?: string): MaterialRarity {
  if (
    explicitRarity === 'Comum' ||
    explicitRarity === 'Raro' ||
    explicitRarity === 'Épico' ||
    explicitRarity === 'Lendário'
  ) {
    return explicitRarity
  }
  if (!materialIdOrName) return 'Comum'
  if (MATERIAL_RARITY_MAP[materialIdOrName]) {
    return MATERIAL_RARITY_MAP[materialIdOrName]
  }

  const lower = materialIdOrName.toLowerCase()
  for (const [id, r] of Object.entries(MATERIAL_RARITY_MAP)) {
    if (lower.includes(id) || id.includes(lower)) return r
  }

  if (lower.includes('dragão') || lower.includes('alma') || lower.includes('runic') || lower.includes('ouro rúnico')) {
    return 'Lendário'
  }
  if (
    lower.includes('adamante') ||
    lower.includes('luar') ||
    lower.includes('quimera') ||
    lower.includes('líquida') ||
    lower.includes('golem')
  ) {
    return 'Épico'
  }
  if (
    lower.includes('mithril') ||
    lower.includes('aço negro') ||
    lower.includes('mandrágora') ||
    lower.includes('basilisco') ||
    lower.includes('grifo') ||
    lower.includes('cristal') ||
    lower.includes('ectoplasma')
  ) {
    return 'Raro'
  }
  return 'Comum'
}
