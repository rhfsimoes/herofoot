"""
HeroFoot Save System.
Gerenciamento de persistência, versionamento, migração e arquivamento corporativo dos estados de guilda.
"""

import os
import json
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple

from game_state import GameState
from league_engine import LeagueEngine
from market_engine import MarketEngine

SAVE_VERSION = 1
DEFAULT_SAVES_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data', 'saves')

ALLOWED_SLOTS = ["slot_1", "slot_2", "slot_3", "autosave"]

SLOT_DISPLAY_NAMES = {
    "slot_1": "Compartimento 1",
    "slot_2": "Compartimento 2",
    "slot_3": "Compartimento 3",
    "autosave": "Salvamento Automático",
}


def normalize_slot(slot_input: Any) -> str:
    """
    Normaliza e valida o identificador do compartimento de arquivamento corporativo.
    Aceita inteiros (1, 2, 3), strings ("1", "slot_1", "slot_1.json", "autosave").
    """
    if slot_input is None:
        return "autosave"

    raw = str(slot_input).strip().lower()
    if raw.endswith(".json"):
        raw = raw[:-5]

    if raw in ("1", "slot_1", "slot1"):
        return "slot_1"
    elif raw in ("2", "slot_2", "slot2"):
        return "slot_2"
    elif raw in ("3", "slot_3", "slot3"):
        return "slot_3"
    elif raw in ("autosave", "auto", "auto_save"):
        return "autosave"

    raise ValueError(
        f"Compartimento de arquivamento '{slot_input}' não reconhecido pelo departamento de registros. "
        "Compartimentos autorizados: 1, 2, 3 ou autosave."
    )


def get_save_filepath(slot: str, saves_dir: Optional[str] = None) -> str:
    """Retorna o caminho canônico do arquivo de save para o slot especificado."""
    norm_slot = normalize_slot(slot)
    target_dir = saves_dir if saves_dir is not None else DEFAULT_SAVES_DIR
    return os.path.join(target_dir, f"{norm_slot}.json")


LEGACY_SLOT_MAP = {
    "weapon": "Arsenal Ofensivo",
    "armor": "Blindagem Operacional",
    "jewelry": "Ativo de Performance",
    "inscription": "Alvará de Risco",
    "consumable": "Provisão Logística",
    "arma": "Arsenal Ofensivo",
    "armadura": "Blindagem Operacional",
    "joia": "Ativo de Performance",
    "inscrição": "Alvará de Risco",
    "inscricao": "Alvará de Risco",
    "consumível": "Provisão Logística",
    "consumivel": "Provisão Logística",
    "Arma": "Arsenal Ofensivo",
    "Armadura": "Blindagem Operacional",
    "Joia": "Ativo de Performance",
    "Inscrição": "Alvará de Risco",
    "Consumível": "Provisão Logística",
    "Arsenal Ofensivo": "Arsenal Ofensivo",
    "Blindagem Operacional": "Blindagem Operacional",
    "Ativo de Performance": "Ativo de Performance",
    "Alvará de Risco": "Alvará de Risco",
    "Provisão Logística": "Provisão Logística",
}


def migrate_legacy_slots(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Normaliza identificadores de slots legados em compartimentos de loadout, inventário,
    vitrine de mercado e ordens VIP para a nova convenção corporativa da guilda.
    """
    if not isinstance(data, dict):
        return data

    def _norm(slot_val: Any) -> Any:
        if not isinstance(slot_val, str):
            return slot_val
        key = slot_val.strip()
        return LEGACY_SLOT_MAP.get(key.lower(), LEGACY_SLOT_MAP.get(key, slot_val))

    def _norm_item(item: Any):
        if isinstance(item, dict):
            if "slot" in item and isinstance(item["slot"], str):
                item["slot"] = _norm(item["slot"])
            if "slot_type" in item and isinstance(item["slot_type"], str):
                item["slot_type"] = _norm(item["slot_type"])

    gs = data.get("game_state")
    if isinstance(gs, dict):
        loadout = gs.get("loadout")
        if isinstance(loadout, dict):
            new_loadout = {
                "Arsenal Ofensivo": None,
                "Blindagem Operacional": None,
                "Ativo de Performance": None,
                "Alvará de Risco": None,
                "Provisão Logística": None,
            }
            for k, v in loadout.items():
                norm_k = _norm(k)
                if isinstance(v, dict):
                    _norm_item(v)
                new_loadout[norm_k] = v
            gs["loadout"] = new_loadout

        for inv_key in ("inventory", "showcase"):
            items = gs.get(inv_key)
            if isinstance(items, list):
                for item in items:
                    _norm_item(item)

    market = data.get("market_engine")
    if isinstance(market, dict):
        ready_items = market.get("ready_items_for_sale")
        if isinstance(ready_items, list):
            for item in ready_items:
                _norm_item(item)

        vip_orders = market.get("vip_orders")
        if isinstance(vip_orders, list):
            for order in vip_orders:
                if isinstance(order, dict) and "target_slot" in order and isinstance(order["target_slot"], str):
                    order["target_slot"] = _norm(order["target_slot"])

        bulletin = market.get("bulletin")
        if isinstance(bulletin, dict) and "target" in bulletin and isinstance(bulletin["target"], str):
            bulletin["target"] = _norm(bulletin["target"])

    return data


def migrate_save(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Valida e executa rotinas de adequação de versão (migração) para arquivos de arquivamento corporativo.
    """
    if not isinstance(data, dict):
        raise ValueError("Estrutura do arquivo de registro corrompida ou ilegível pela auditoria.")

    version = data.get("save_version")
    if version is None or not isinstance(version, int):
        raise ValueError("Registro de guilda desprovido de identificação de versão de arquivamento válida.")

    if version > SAVE_VERSION:
        raise ValueError(
            f"Registro gerado em versão superior ({version}) à suportada pelas diretrizes centrais ({SAVE_VERSION})."
        )

    if version < 1:
        raise ValueError(
            f"Registro em versão obsoleta ou irregular ({version}), incompatível com as normas da guilda."
        )

    # Migração de compatibilidade para slots legados
    data = migrate_legacy_slots(data)

    return data


def list_saves(saves_dir: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Examina o diretório de arquivamento e lista o inventário de registros disponíveis.
    """
    target_dir = saves_dir if saves_dir is not None else DEFAULT_SAVES_DIR
    results = []

    for slot_id in ALLOWED_SLOTS:
        filepath = os.path.join(target_dir, f"{slot_id}.json")
        slot_label = SLOT_DISPLAY_NAMES.get(slot_id, slot_id)

        if not os.path.exists(filepath):
            results.append({
                "slot": slot_id,
                "label": slot_label,
                "exists": False,
            })
            continue

        try:
            with open(filepath, "r", encoding="utf-8") as f:
                data = json.load(f)
            migrated = migrate_save(data)
            meta = migrated.get("metadata", {})
            results.append({
                "slot": slot_id,
                "label": slot_label,
                "exists": True,
                "corrupted": False,
                "save_version": migrated.get("save_version", 1),
                "timestamp": migrated.get("timestamp"),
                "day": meta.get("day", 1),
                "week": meta.get("week", 1),
                "gold": meta.get("gold", 0),
                "team_size": meta.get("team_size", 0),
            })
        except Exception as err:
            results.append({
                "slot": slot_id,
                "label": slot_label,
                "exists": True,
                "corrupted": True,
                "error": f"Falha na auditoria de conformidade: {str(err)}",
            })

    return results


def save_bundle(
    state: GameState,
    league_engine: LeagueEngine,
    market_engine: MarketEngine,
    slot: str = "autosave",
    saves_dir: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Gera o pacote de arquivamento corporativo e realiza a gravação atômica em disco.
    """
    norm_slot = normalize_slot(slot)
    target_dir = saves_dir if saves_dir is not None else DEFAULT_SAVES_DIR
    os.makedirs(target_dir, exist_ok=True)

    timestamp_iso = datetime.now().isoformat()
    bundle = {
        "save_version": SAVE_VERSION,
        "slot": norm_slot,
        "timestamp": timestamp_iso,
        "metadata": {
            "day": state.day,
            "week": state.week,
            "gold": state.gold,
            "team_size": len(state.team),
        },
        "game_state": state.to_dict(),
        "league_engine": league_engine.to_dict(),
        "market_engine": market_engine.to_dict(),
    }

    final_filepath = os.path.join(target_dir, f"{norm_slot}.json")
    temp_filename = f".{norm_slot}_{uuid.uuid4().hex}.tmp"
    temp_filepath = os.path.join(target_dir, temp_filename)

    try:
        with open(temp_filepath, "w", encoding="utf-8") as f:
            json.dump(bundle, f, ensure_ascii=False, indent=2)
            f.flush()
            os.fsync(f.fileno())

        os.replace(temp_filepath, final_filepath)
    except Exception as exc:
        if os.path.exists(temp_filepath):
            try:
                os.remove(temp_filepath)
            except OSError:
                pass
        raise OSError(f"Falha ao consolidar arquivamento no compartimento '{norm_slot}': {str(exc)}") from exc

    return {
        "success": True,
        "slot": norm_slot,
        "timestamp": timestamp_iso,
        "filepath": final_filepath,
        "message": f"Registro corporativo consolidado com êxito no compartimento '{norm_slot}'.",
    }


def load_bundle(slot: str, saves_dir: Optional[str] = None) -> Dict[str, Any]:
    """
    Carrega e valida o registro corporativo a partir de um compartimento de arquivamento.
    """
    norm_slot = normalize_slot(slot)
    filepath = get_save_filepath(norm_slot, saves_dir=saves_dir)

    if not os.path.exists(filepath):
        raise FileNotFoundError(
            f"Compartimento '{norm_slot}' não contém registros arquivados no arquivo central."
        )

    try:
        with open(filepath, "r", encoding="utf-8") as f:
            raw_data = json.load(f)
    except json.JSONDecodeError as jde:
        raise ValueError(f"Registro corrompido ou formato ilegível: {str(jde)}") from jde
    except Exception as err:
        raise IOError(f"Falha de leitura do registro corporativo: {str(err)}") from err

    validated = migrate_save(raw_data)
    return validated


def new_game(slot: Optional[str] = None) -> Tuple[GameState, LeagueEngine, MarketEngine]:
    """
    Inicializa novas instâncias para um novo ciclo corporativo da guilda.
    NUNCA sobrescreve arquivos seed originais de data/.
    """
    state = GameState()
    league = LeagueEngine()
    market = MarketEngine()

    if slot is not None:
        norm_slot = normalize_slot(slot)
        state.active_save_slot = norm_slot

    return state, league, market


class SaveManager:
    """Fachada orientada a objetos para o subsistema de salvamento e arquivamento."""

    def __init__(self, saves_dir: Optional[str] = None):
        self.saves_dir = saves_dir if saves_dir is not None else DEFAULT_SAVES_DIR

    def normalize_slot(self, slot: Any) -> str:
        return normalize_slot(slot)

    def list_saves(self) -> List[Dict[str, Any]]:
        return list_saves(self.saves_dir)

    def save(
        self,
        state: GameState,
        league_engine: LeagueEngine,
        market_engine: MarketEngine,
        slot: str = "autosave",
    ) -> Dict[str, Any]:
        return save_bundle(state, league_engine, market_engine, slot=slot, saves_dir=self.saves_dir)

    def load(self, slot: str) -> Dict[str, Any]:
        return load_bundle(slot, saves_dir=self.saves_dir)

    def new_game(self, slot: Optional[str] = None) -> Tuple[GameState, LeagueEngine, MarketEngine]:
        return new_game(slot=slot)
