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
  Hero,
  CorporateEvent,
  B2BContract,
  AssemblyWorkerInstance,
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
  xp_gained?: number
  is_tinkering?: boolean
  tinkering_success?: boolean
  recipe_unlocked?: boolean
  consequence?: string
  effects_applied?: Record<string, any>
  active_event?: CorporateEvent | null
  overclock?: boolean
  warehouse_parts?: Record<string, number>
  active_b2b_contracts?: B2BContract[]
  corporate_exclusivity_tags?: string[]
  assembly_line_workers?: AssemblyWorkerInstance[]
  items_produced?: number
  assembly_sales_revenue?: number
  item?: InventoryItem
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

export interface CraftPayload {
  recipe_id: string
  branch?: string
  prefix_id?: string | null
  suffix_id?: string | null
  prefix_material_id?: string | null
  suffix_material_id?: string | null
  is_tinkering?: boolean
}

export async function craftItemBackend(
  recipeIdOrPayload: string | CraftPayload
): Promise<ApiResponse<{
  item: InventoryItem
  xp_gained?: number
  is_tinkering?: boolean
  tinkering_success?: boolean
  recipe_unlocked?: boolean
}> | null> {
  try {
    const body = typeof recipeIdOrPayload === 'string'
      ? { recipe_id: recipeIdOrPayload }
      : recipeIdOrPayload
    const res = await fetch(`${API_BASE}/craft`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    return (await res.json()) as ApiResponse<{
      item: InventoryItem
      xp_gained?: number
      is_tinkering?: boolean
      tinkering_success?: boolean
      recipe_unlocked?: boolean
    }>
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

export async function fetchCrownGoalsBackend(): Promise<any | null> {
  try {
    const res = await fetch(`${API_BASE}/crown_goals`)
    if (res.ok) {
      return await res.json()
    }
  } catch (err) {
    console.error('[HeroFoot API] Erro ao consultar metas da coroa:', err)
  }
  return null
}

export async function fetchActiveEventBackend(): Promise<{ active_event: CorporateEvent | null } | null> {
  try {
    const res = await fetch(`${API_BASE}/events/active`, { signal: AbortSignal.timeout(2000) })
    if (res.ok) {
      return (await res.json()) as { active_event: CorporateEvent | null }
    }
  } catch (err) {
    console.warn('[HeroFoot API] Falha ao consultar incidente ativo:', err)
  }
  return null
}

export async function resolveEventChoiceBackend(
  eventId: string,
  optionId: string
): Promise<ApiResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/events/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_id: eventId, option_id: optionId }),
      signal: AbortSignal.timeout(3000),
    })
    if (res.ok) {
      return (await res.json()) as ApiResponse
    }
    const errData = await res.json().catch(() => ({}))
    return { success: false, message: errData.message || 'Falha ao homologar diretriz do incidente corporativo.' }
  } catch (err) {
    console.warn('[HeroFoot API] Falha ao resolver incidente corporativo:', err)
  }
  return null
}

export async function fulfillVipOrderBackend(itemInstanceId: string): Promise<ApiResponse> {
  try {
    const res = await fetch(`${API_BASE}/fulfill_vip_order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_instance_id: itemInstanceId }),
      signal: AbortSignal.timeout(3000),
    })
    if (res.ok) {
      return (await res.json()) as ApiResponse
    }
    const errData = await res.json().catch(() => ({}))
    return {
      success: false,
      message: errData.message || 'Falha ao homologar cumprimento do Edital VIP perante a Câmara.',
    }
  } catch (err) {
    console.warn('[HeroFoot API] Backend indisponível para liquidação VIP:', err)
    return {
      success: false,
      message: 'Falha de comunicação com a junta comercial da Câmara dos Mercadores.',
    }
  }
}

// ─── Complexo Industrial B2B & Montagem Modular (v0.7.0) ───────────────────

export async function signB2BContractBackend(
  contractId: string
): Promise<ApiResponse<{ contract: B2BContract; active_b2b_contracts: B2BContract[] }> | null> {
  try {
    const res = await fetch(`${API_BASE}/b2b/sign_contract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contract_id: contractId }),
      signal: AbortSignal.timeout(3000),
    })
    return (await res.json()) as ApiResponse
  } catch (err) {
    console.warn('[HeroFoot API] Falha ao assinar convênio B2B:', err)
  }
  return null
}

export async function cancelB2BContractBackend(contractId: string): Promise<ApiResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/b2b/cancel_contract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contract_id: contractId }),
      signal: AbortSignal.timeout(3000),
    })
    return (await res.json()) as ApiResponse
  } catch (err) {
    console.warn('[HeroFoot API] Falha ao rescindir contrato B2B:', err)
  }
  return null
}

export async function hireAssemblyWorkerBackend(
  workerId: string,
  assignedBranch: string = 'Ferragem'
): Promise<ApiResponse<{ worker: AssemblyWorkerInstance; assembly_line_workers: AssemblyWorkerInstance[] }> | null> {
  try {
    const res = await fetch(`${API_BASE}/b2b/hire_worker`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ worker_id: workerId, assigned_branch: assignedBranch }),
      signal: AbortSignal.timeout(3000),
    })
    return (await res.json()) as ApiResponse
  } catch (err) {
    console.warn('[HeroFoot API] Falha ao admitir operário fabril:', err)
  }
  return null
}

export async function setWorkerOrderBackend(
  workerInstanceId: string,
  targetRecipe: string
): Promise<ApiResponse<{ worker: AssemblyWorkerInstance }> | null> {
  try {
    const res = await fetch(`${API_BASE}/b2b/set_worker_order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ worker_instance_id: workerInstanceId, target_recipe: targetRecipe }),
      signal: AbortSignal.timeout(3000),
    })
    return (await res.json()) as ApiResponse
  } catch (err) {
    console.warn('[HeroFoot API] Falha ao atribuir ordem de montagem:', err)
  }
  return null
}

export async function dismissAssemblyWorkerBackend(workerInstanceId: string): Promise<ApiResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/b2b/dismiss_worker`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ worker_instance_id: workerInstanceId }),
      signal: AbortSignal.timeout(3000),
    })
    return (await res.json()) as ApiResponse
  } catch (err) {
    console.warn('[HeroFoot API] Falha ao desligar operário fabril:', err)
  }
  return null
}

export async function assembleModularItemBackend(
  partIds: string[],
  baseName: string = 'Artefato Modular',
  isTinkering: boolean = false
): Promise<ApiResponse<{ item: InventoryItem; tinkering?: boolean; tinkering_success?: boolean; overclock?: boolean }> | null> {
  try {
    const res = await fetch(`${API_BASE}/assemble_modular_item`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ part_ids: partIds, base_name: baseName, is_tinkering: isTinkering }),
      signal: AbortSignal.timeout(3000),
    })
    return (await res.json()) as ApiResponse
  } catch (err) {
    console.warn('[HeroFoot API] Falha ao processar montagem modular:', err)
  }
  return null
}

export async function buyModularPartBackend(
  partId: string,
  quantity: number = 1
): Promise<ApiResponse<{ part_id: string; quantity: number; unit_price: number; total_cost: number; warehouse_parts: Record<string, number> }> | null> {
  try {
    const res = await fetch(`${API_BASE}/market/buy_part`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ part_id: partId, quantity: quantity }),
      signal: AbortSignal.timeout(3000),
    })
    return (await res.json()) as ApiResponse
  } catch (err) {
    console.warn('[HeroFoot API] Falha ao adquirir peça no mercado spot:', err)
  }
  return null
}

export async function renameGuildBackend(name: string): Promise<ApiResponse<{ guild_name: string }> | null> {
  try {
    const res = await fetch(`${API_BASE}/rename_guild`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
      signal: AbortSignal.timeout(3000),
    })
    return (await res.json()) as ApiResponse
  } catch (err) {
    console.warn('[HeroFoot API] Falha ao renomear guilda:', err)
  }
  return null
}

export async function renameHeroBackend(heroId: string, name: string): Promise<ApiResponse<{ hero: Hero }> | null> {
  try {
    const res = await fetch(`${API_BASE}/rename_hero`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hero_id: heroId, name }),
      signal: AbortSignal.timeout(3000),
    })
    return (await res.json()) as ApiResponse
  } catch (err) {
    console.warn('[HeroFoot API] Falha ao renomear aventureiro:', err)
  }
  return null
}

