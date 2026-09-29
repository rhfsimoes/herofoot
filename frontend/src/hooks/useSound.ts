// HeroFoot — Hook de Sonoplastia e Efeitos Sonoros
// Esboço v1.0 — Assets binários em fase de especificação/produção.
// Pronto para conexão com Howler.js sem quebrar builds do frontend.

import { useCallback } from 'react';

/**
 * Mapeamento canônico de identificadores sonoros para seus arquivos correspondentes.
 * Estrutura pública: /sfx/[nome].ogg
 */
export const SFX_MAP = {
  // --- Prioridade 1 (v1.0 Obrigatório) ---
  sfx_forge_success: '/sfx/forge_success.ogg',
  sfx_forge_fail: '/sfx/forge_fail.ogg',
  sfx_sale_complete: '/sfx/sale_complete.ogg',
  sfx_sale_counter: '/sfx/sale_counter.ogg',
  sfx_sale_rejected: '/sfx/sale_rejected.ogg',
  sfx_audit_pass: '/sfx/audit_pass.ogg',
  sfx_audit_fail: '/sfx/audit_fail.ogg',
  sfx_expedition_start: '/sfx/expedition_start.ogg',
  sfx_expedition_boss: '/sfx/expedition_boss.ogg',
  sfx_league_promoted: '/sfx/league_promoted.ogg',
  sfx_league_relegated: '/sfx/league_relegated.ogg',
  sfx_hero_tired: '/sfx/hero_tired.ogg',
  sfx_weekly_advance: '/sfx/weekly_advance.ogg',
  sfx_craft_tinkering: '/sfx/craft_tinkering.ogg',
  sfx_recipe_discovered: '/sfx/recipe_discovered.ogg',

  // --- Prioridade 2 (Interface & Gestão de RH) ---
  ui_button_hover: '/sfx/ui_button_hover.ogg',
  ui_button_click: '/sfx/ui_button_click.ogg',
  ui_modal_open: '/sfx/ui_modal_open.ogg',
  ui_modal_close: '/sfx/ui_modal_close.ogg',
  ui_tab_switch: '/sfx/ui_tab_switch.ogg',
  ui_error_alert: '/sfx/ui_error_alert.ogg',
  sfx_hero_hire: '/sfx/hero_hire.ogg',
  sfx_hero_injured: '/sfx/hero_injured.ogg',
  sfx_hero_retired: '/sfx/hero_retired.ogg',
  sfx_academy_grad: '/sfx/academy_grad.ogg',
} as const;

export type SoundEffectId = keyof typeof SFX_MAP;

export interface PlaySoundOptions {
  volume?: number; // 0.0 a 1.0
  rate?: number;   // taxa de reprodução / pitch (ex: 0.8 a 1.2)
}

/**
 * Hook de controle de efeitos sonoros diegéticos e burocráticos do HeroFoot.
 */
export function useSound() {
  const play = useCallback((sfxId: SoundEffectId | string, options?: PlaySoundOptions) => {
    const assetPath = SFX_MAP[sfxId as SoundEffectId];

    if (!assetPath) {
      console.warn(`[SFX] Efeito sonoro não catalogado: "${sfxId}"`);
      return;
    }

    // TODO: Integrar Howler.js (Howl) quando os arquivos binários em /public/sfx/ forem homologados.
    // Exemplo de integração futura:
    // const sound = new Howl({ src: [assetPath, assetPath.replace('.ogg', '.mp3')], volume: options?.volume ?? 1.0 });
    // sound.play();

    console.debug(`[SFX] Reproduzindo som: ${sfxId} (${assetPath})`, options ?? {});
  }, []);

  return { play };
}
