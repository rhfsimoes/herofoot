/**
 * HeroFoot API Client.
 * Comunica-se com o backend Python local (http.server nativo da biblioteca padrão).
 */

import type {
  GameState,
  InventoryItem,
  SaveSlotInfo,
  CraftOptions,
  CraftPreview,
  MaterialSheet,
  MedicalFacilityInfo,
  Hero
} from './mockData'

const API_BASE = 'http://localhost:8000/api'

export interface ApiResponse<T = any> {
  result?: T
  state?: GameState
  success?: boolean
  message?: string
  error?: string
  saves?: SaveSlotInfo[]
  slot?: string
  gold?: number
  facilities?: MedicalFacilityInfo
  hero?: Hero
  new_level?: number
}

export async function checkBackendLive(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/state`, { method: 'GET', signal: AbortSignal.timeout(1200) })
    return res.ok
  } catch {
    return false
  }
}

export async function fetchStateFromBackend(): Promise<GameState | null> {
  try {
    const res = await fetch(`${API_BASE}/state`, { signal: AbortSignal.timeout(2000) })
    if (res.ok) {
      return (await res.json()) as GameState
    }
  } catch (err) {
    console.warn('[HeroFoot API] Backend offline, usando modo local.', err)
  }
  return null
}

export async function advancePhaseBackend(): Promise<ApiResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/advance_phase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    if (res.ok) {
      return (await res.json()) as ApiResponse
    }
  } catch (err) {
    console.error('[HeroFoot API] Erro ao avançar fase:', err)
  }
  return null
}

export async function saveTacticsBackend(
  starters: string[],
  loadout: Record<string, string | null>,
  reserves: string[] = []
): Promise<ApiResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/tactics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ starters, reserves, loadout }),
    })
    const data = await res.json()
    return data as ApiResponse
  } catch (err) {
    console.error('[HeroFoot API] Erro ao salvar tática:', err)
  }
  return null
}

export async function fetchCraftOptionsBackend(recipeId: string): Promise<CraftOptions | null> {
  try {
    const res = await fetch(`${API_BASE}/craft_options?recipe_id=${encodeURIComponent(recipeId)}`)
    if (res.ok) {
      return (await res.json()) as CraftOptions
    }
  } catch (err) {
    console.warn('[HeroFoot API] Erro ao carregar opções de forja:', err)
  }
  return null
}

export async function fetchCraftPreviewBackend(payload: {
  recipe_id: string
  prefix_id?: string | null
  suffix_id?: string | null
  prefix_material_id?: string | null
  suffix_material_id?: string | null
}): Promise<CraftPreview | null> {
  try {
    const res = await fetch(`${API_BASE}/craft_preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      return (await res.json()) as CraftPreview
    }
  } catch (err) {
    console.warn('[HeroFoot API] Erro ao carregar prévia de forja:', err)
  }
  return null
}

export async function craftItemBackend(
  recipeIdOrPayload: string | {
    recipe_id: string
    branch?: string
    prefix_id?: string | null
    suffix_id?: string | null
    prefix_material_id?: string | null
    suffix_material_id?: string | null
  }
): Promise<ApiResponse<{ item: InventoryItem }> | null> {
  try {
    const body = typeof recipeIdOrPayload === 'string'
      ? { recipe_id: recipeIdOrPayload }
      : recipeIdOrPayload
    const res = await fetch(`${API_BASE}/craft`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    return (await res.json()) as ApiResponse<{ item: InventoryItem }>
  } catch (err) {
    console.error('[HeroFoot API] Erro ao produzir item:', err)
  }
  return null
}

export async function learnAffixBackend(affixId: string): Promise<ApiResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/learn_affix`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ affix_id: affixId }),
    })
    return (await res.json()) as ApiResponse
  } catch (err) {
    console.error('[HeroFoot API] Erro ao adquirir manual:', err)
  }
  return null
}

export async function fetchMaterialSheetBackend(materialId: string): Promise<MaterialSheet | null> {
  try {
    const res = await fetch(`${API_BASE}/material?id=${encodeURIComponent(materialId)}`)
    if (res.ok) {
      return (await res.json()) as MaterialSheet
    }
  } catch (err) {
    console.warn('[HeroFoot API] Erro ao consultar ficha de material:', err)
  }
  return null
}

export async function upgradeWorkshopBackend(branch: string): Promise<ApiResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/upgrade_workshop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ branch }),
    })
    return (await res.json()) as ApiResponse
  } catch (err) {
    console.error('[HeroFoot API] Erro ao aprimorar oficina:', err)
  }
  return null
}

export async function buyMaterialBackend(materialId: string, quantity: number): Promise<ApiResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/buy_material`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ material_id: materialId, quantity }),
    })
    if (res.ok) {
      return (await res.json()) as ApiResponse
    }
  } catch (err) {
    console.error('[HeroFoot API] Erro ao comprar insumo:', err)
  }
  return null
}

export async function buyItemBackend(marketItemId: string): Promise<ApiResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/buy_item`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ market_item_id: marketItemId }),
    })
    if (res.ok) {
      return (await res.json()) as ApiResponse
    }
  } catch (err) {
    console.error('[HeroFoot API] Erro ao comprar item pronto:', err)
  }
  return null
}

export async function sellItemBackend(
  itemInstanceId: string,
  marginType: string
): Promise<ApiResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/sell`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_instance_id: itemInstanceId, margin_type: marginType }),
    })
    if (res.ok) {
      return (await res.json()) as ApiResponse
    }
  } catch (err) {
    console.error('[HeroFoot API] Erro ao liquidar item:', err)
  }
  return null
}

export async function resolveOfferBackend(offerId: string, accept: boolean): Promise<ApiResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/resolve_offer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ offer_id: offerId, accept }),
    })
    if (res.ok) {
      return (await res.json()) as ApiResponse
    }
  } catch (err) {
    console.error('[HeroFoot API] Erro ao responder contraproposta:', err)
  }
  return null
}

// ─────────────────────────────────────────────
// ENDPOINTS DE ARQUIVAMENTO E PERSISTÊNCIA (SAVES)
// ─────────────────────────────────────────────

export async function fetchSavesBackend(): Promise<SaveSlotInfo[] | null> {
  try {
    const res = await fetch(`${API_BASE}/saves`, { signal: AbortSignal.timeout(2000) })
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data)) return data as SaveSlotInfo[]
      if (data && Array.isArray(data.saves)) return data.saves as SaveSlotInfo[]
      return null
    }
  } catch (err) {
    console.warn('[HeroFoot API] Erro ao consultar lista de saves:', err)
  }
  return null
}

export async function saveGameBackend(slot: string): Promise<ApiResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slot }),
    })
    const data = await res.json()
    return data as ApiResponse
  } catch (err) {
    console.error('[HeroFoot API] Erro ao salvar jogo:', err)
  }
  return null
}

export async function loadGameBackend(slot: string): Promise<ApiResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/load`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slot }),
    })
    const data = await res.json()
    if (!res.ok) {
      return { success: false, error: data.error || 'Falha ao carregar save', message: data.message }
    }
    return data as ApiResponse
  } catch (err) {
    console.error('[HeroFoot API] Erro ao carregar jogo:', err)
    return { success: false, error: 'Servidor inacessível ou falha de rede.' }
  }
}

export async function newGameBackend(slot?: string): Promise<ApiResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/new_game`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slot: slot || 'autosave' }),
    })
    const data = await res.json()
    return data as ApiResponse
  } catch (err) {
    console.error('[HeroFoot API] Erro ao iniciar novo jogo:', err)
  }
  return null
}

export async function fetchMedicalFacilitiesBackend(): Promise<ApiResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/medical_facilities`)
    if (res.ok) {
      return (await res.json()) as ApiResponse
    }
  } catch (err) {
    console.error('[HeroFoot API] Erro ao carregar instalações médicas:', err)
  }
  return null
}

export async function upgradeMedicalFacilityBackend(): Promise<ApiResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/upgrade_medical`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    const data = await res.json()
    return data as ApiResponse
  } catch (err) {
    console.error('[HeroFoot API] Erro ao modernizar departamento médico:', err)
  }
  return null
}

export async function treatHeroMassageBackend(heroId: string): Promise<ApiResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/hr/massage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hero_id: heroId }),
    })
    const data = await res.json()
    return data as ApiResponse
  } catch (err) {
    console.error('[HeroFoot API] Erro ao aplicar massagem:', err)
  }
  return null
}

export async function accelerateInjuryBackend(heroId: string): Promise<ApiResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/hr/accelerate_injury`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hero_id: heroId }),
    })
    const data = await res.json()
    return data as ApiResponse
  } catch (err) {
    console.error('[HeroFoot API] Erro ao acelerar tratamento de lesão:', err)
  }
  return null
}

export async function collectiveBanquetBackend(): Promise<ApiResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/hr/banquet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const data = await res.json()
    return data as ApiResponse
  } catch (err) {
    console.error('[HeroFoot API] Erro ao realizar banquete coletivo:', err)
  }
  return null
}

export async function renewContractBackend(heroId: string): Promise<ApiResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/hr/renew_contract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hero_id: heroId }),
    })
    const data = await res.json()
    return data as ApiResponse
  } catch (err) {
    console.error('[HeroFoot API] Erro ao renovar contrato:', err)
  }
  return null
}

export async function releaseContractBackend(heroId: string): Promise<ApiResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/hr/release_contract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hero_id: heroId }),
    })
    const data = await res.json()
    return data as ApiResponse
  } catch (err) {
    console.error('[HeroFoot API] Erro ao rescindir contrato:', err)
  }
  return null
}

export async function fetchAcademyBackend(): Promise<ApiResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/academy`)
    if (res.ok) {
      return (await res.json()) as ApiResponse
    }
  } catch (err) {
    console.error('[HeroFoot API] Erro ao carregar dados da academia:', err)
  }
  return null
}

export async function promoteYouthBackend(heroId: string): Promise<ApiResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/academy/promote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hero_id: heroId }),
    })
    const data = await res.json()
    return data as ApiResponse
  } catch (err) {
    console.error('[HeroFoot API] Erro ao promover aprendiz:', err)
  }
  return null
}

export async function dismissYouthBackend(heroId: string): Promise<ApiResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/academy/dismiss`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hero_id: heroId }),
    })
    const data = await res.json()
    return data as ApiResponse
  } catch (err) {
    console.error('[HeroFoot API] Erro ao dispensar aprendiz:', err)
  }
  return null
}

export async function fetchTransferMarketBackend(): Promise<ApiResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/transfer_market`)
    if (res.ok) {
      return (await res.json()) as ApiResponse
    }
  } catch (err) {
    console.error('[HeroFoot API] Erro ao carregar bolsa de transferências:', err)
  }
  return null
}

export async function scoutMarketHeroBackend(heroId: string): Promise<ApiResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/market/scout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hero_id: heroId }),
    })
    const data = await res.json()
    return data as ApiResponse
  } catch (err) {
    console.error('[HeroFoot API] Erro na auditoria de olheiro:', err)
  }
  return null
}

export async function hireMarketHeroBackend(heroId: string): Promise<ApiResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/market/hire`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hero_id: heroId }),
    })
    const data = await res.json()
    return data as ApiResponse
  } catch (err) {
    console.error('[HeroFoot API] Erro ao contratar herói:', err)
  }
  return null
}



