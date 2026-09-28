/**
 * HeroFoot API Client.
 * Comunica-se com o backend Python local (http.server nativo da biblioteca padrão).
 */

import type { GameState, InventoryItem } from './mockData'

const API_BASE = 'http://localhost:8000/api'

export interface ApiResponse<T = any> {
  result?: T
  state?: GameState
  success?: boolean
  message?: string
  error?: string
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
  loadout: Record<string, any>
): Promise<ApiResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/tactics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ starters, loadout }),
    })
    if (res.ok) {
      return (await res.json()) as ApiResponse
    }
  } catch (err) {
    console.error('[HeroFoot API] Erro ao salvar tática:', err)
  }
  return null
}

export async function craftItemBackend(recipeId: string): Promise<ApiResponse<{ item: InventoryItem }> | null> {
  try {
    const res = await fetch(`${API_BASE}/craft`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipe_id: recipeId }),
    })
    if (res.ok) {
      return (await res.json()) as ApiResponse<{ item: InventoryItem }>
    }
  } catch (err) {
    console.error('[HeroFoot API] Erro ao produzir item:', err)
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
  basePrice: number,
  marginType: string
): Promise<ApiResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/sell`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_instance_id: itemInstanceId, base_price: basePrice, margin_type: marginType }),
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
