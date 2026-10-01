"""
HeroFoot Match Engine Module.
Simulador de expedição e confrontos entre guildas em masmorras.
Lê todas as regras e parâmetros de balanceamento via balance.get_balance() (data/balance_seed.json),
catálogo de classes e habilidades (data/classes_seed.json) e climas (data/climates_seed.json).
"""

import os
import json
import random
from typing import Optional, Dict, Any, List
from balance import get_balance

_CLASSES_CACHE = None
_CLIMATES_CACHE = None
_RIVAL_TRAITS_CACHE = None

# ==============================================================================
# Matrizes Narrativas de Fantasia Corporativa (Ordem de Serviço: TASK-804)
# ==============================================================================

EMPTY_LOGS = [
    'Corredor silencioso. O Suporte Logístico mapeia as armadilhas no chão e a equipe avança sem gastar recursos extras.',
    'A câmara está vazia, mas a tensão continua. Trânsito livre aprovado e a formação tática se mantém intacta.',
    'Nenhum monstro à vista. O Suporte aproveita para curar escoriações leves e a expedição ganha fôlego.',
    'Caminho limpo! A equipe economiza Suprimentos e marcha a passos largos para a próxima câmara.'
]

PLAYER_MINIBOSS_LOGS = [
    'O Vanguarda segura a linha de frente de forma heroica, abrindo espaço para a Guilda do Jogador esmagar a ameaça! (+1 PE).',
    'Lâminas e magias voando! Os DPS limpam a câmara em tempo recorde e faturam o Abate Prioritário para a nossa Guilda! (+1 PE).',
    'Numa manobra brilhante de controle, o Suporte isola o Mini-boss e a Guilda do Jogador garante mais um abate! (+1 PE).',
    'Deixamos a concorrência comendo poeira! A Guilda do Jogador limpa a sala e o Cartório homologa o Ponto! (+1 PE).'
]

RIVAL_MINIBOSS_LOGS = [
    'Que golpe baixo! O Suporte Logístico rival passou furtivamente pelo nosso bloqueio e roubou o Abate Prioritário! (+1 PE).',
    'A Vanguarda rival formou uma parede intransponível, esmagando o monstro antes da nossa equipe se posicionar! (+1 PE).',
    'Desastre tático! Os DPS rivais foram mais rápidos no gatilho e limparam a sala na nossa frente! (+1 PE).',
    'Fomos atropelados na corrida! A guilda rival finaliza o Mini-boss e garante o ponto da câmara! (+1 PE).'
]

PLAYER_BOSS_LOGS = [
    'UM VERDADEIRO MASSACRE! Os DPS da Guilda do Jogador atropelam o Boss Final com vantagem máxima e levam a glória exclusiva! (+2 PE).',
    'É O FIM DA LINHA PARA O BOSS! A Guilda do Jogador domina a arena, fatura o Abate Exclusivo e a torcida vai à loucura! (+2 PE).'
]

JOINT_BOSS_LOGS = [
    'QUE LUTA FRENÉTICA! Ninguém cedeu espaço! O Boss cai sob os ataques cruzados das duas guildas e o abate é dividido! (+1 PE para cada).',
    'Empate técnico e brutal na câmara final! As espadas se cruzaram no golpe fatal, e a Coroa homologa um Abate Conjunto! (+1 PE para cada).'
]

PLAYER_EXHAUSTION_LOGS = [
    'FALÊNCIA LOGÍSTICA! Os Suprimentos da Guilda do Jogador zeraram antes da reta final! A equipe abandona a masmorra exausta!',
    'Pane no planejamento! A equipe do Jogador não aguenta o dreno da masmorra, recua e deixa o caminho livre para a concorrência!'
]

RIVAL_EXHAUSTION_LOGS = [
    'QUEBROU O MOTOR! A guilda rival ficou sem Suprimentos no meio do caminho e joga a toalha! O caminho está livre!',
    'Que vexame logístico! Os rivais ficaram sem rações e bateram em retirada. A nossa torcida faz a festa!'
]

INJURY_LOGS = [
    'CENA TERRÍVEL NA MASMORRA! A linha de frente cede e um herói sofre um dano colateral gravíssimo! O Cartório já prepara a notificação de Afastamento Médico!',
    'Um golpe fatal devastador quebra a nossa formação! Baixa confirmada na equipe! Isso vai custar caro no DRE e na alma da Guilda!'
]

LEGENDARY_LOOT_LOGS = [
    'BINGO OPERACIONAL!!! O Suporte Logístico encontrou um baú oculto contendo um Ativo Lendário! A diretoria da Guilda vai à loucura!',
    'INACREDITÁVEL! No meio dos escombros, a equipe fatura um Lote Nível Ouro! O Almoxarifado nunca viu uma peça tão valiosa!'
]


def get_rival_traits_data() -> List[Dict[str, Any]]:
    """Carrega catálogo de traços de rivais de data/rival_traits_seed.json."""
    global _RIVAL_TRAITS_CACHE
    if _RIVAL_TRAITS_CACHE is None:
        path = os.path.join(os.path.dirname(__file__), 'data', 'rival_traits_seed.json')
        if os.path.exists(path):
            with open(path, 'r', encoding='utf-8') as f:
                _RIVAL_TRAITS_CACHE = json.load(f)
        else:
            _RIVAL_TRAITS_CACHE = []
    return _RIVAL_TRAITS_CACHE


def get_trait_dict(trait: Any) -> Optional[Dict[str, Any]]:
    """Retorna o dicionário de dados do traço a partir de um objeto ou id."""
    if isinstance(trait, dict):
        return trait
    for t in get_rival_traits_data():
        if t.get("id") == trait:
            return t
    return None



def get_classes_data() -> Dict[str, Any]:
    """Carrega dados de classes, especializações e habilidades de data/classes_seed.json."""
    global _CLASSES_CACHE
    if _CLASSES_CACHE is None:
        path = os.path.join(os.path.dirname(__file__), 'data', 'classes_seed.json')
        if os.path.exists(path):
            with open(path, 'r', encoding='utf-8') as f:
                _CLASSES_CACHE = json.load(f)
        else:
            _CLASSES_CACHE = {"classes": [], "specializations": [], "skills": []}
    return _CLASSES_CACHE


def get_skills_dict() -> Dict[str, Dict[str, Any]]:
    """Retorna dicionário de habilidades indexado por skill_id."""
    data = get_classes_data()
    skills = data.get("skills", [])
    return {s["id"]: s for s in skills if "id" in s}


def get_positions_data() -> List[Dict[str, Any]]:
    """Carrega catálogo de posições operacionais de data/classes_seed.json."""
    return get_classes_data().get("positions", [])


def get_positions_config() -> Dict[str, Any]:
    """Carrega configurações e ciclo de vantagens das posições operacionais."""
    return get_classes_data().get("positions_config", {})


def get_hero_position(hero: Optional[Dict[str, Any]]) -> str:
    """Retorna o position_id canônico de um herói a partir de seus metadados."""
    if not hero or not isinstance(hero, dict):
        return ""
    pos_id = hero.get("position_id")
    if pos_id:
        return pos_id
    pos_name = hero.get("position", "")
    mapping = {
        "Vanguarda": "pos_vanguarda",
        "DPS": "pos_dps",
        "Suporte": "pos_suporte",
        "Suporte Logístico": "pos_suporte_logistico",
        "vanguarda": "pos_vanguarda",
        "dps": "pos_dps",
        "suporte": "pos_suporte",
        "suporte_logistico": "pos_suporte_logistico",
    }
    if pos_name in mapping:
        return mapping[pos_name]
    return ""


def calculate_positional_advantage(team1: Any, team2: Any) -> tuple:
    """
    Calcula multiplicadores de Poder Efetivo baseados nas vantagens de posições operacionais (PvPvE).
    Ciclo: Vanguarda > DPS > Suporte > Suporte Logístico > Vanguarda.
    Retorna (mult_t1, mult_t2, list_of_log_messages).
    """
    counts1 = team1.get_position_counts() if hasattr(team1, "get_position_counts") else {}
    counts2 = team2.get_position_counts() if hasattr(team2, "get_position_counts") else {}

    config = get_positions_config()
    cycle = config.get("advantage_cycle", {
        "pos_vanguarda": "pos_dps",
        "pos_dps": "pos_suporte",
        "pos_suporte": "pos_suporte_logistico",
        "pos_suporte_logistico": "pos_vanguarda",
    })
    messages_map = config.get("counter_log_messages", {})

    c1_total = 0
    c2_total = 0
    logs = []

    for attacker_pos, target_pos in cycle.items():
        m1 = min(counts1.get(attacker_pos, 0), counts2.get(target_pos, 0))
        if m1 > 0:
            c1_total += m1
            msg = messages_map.get(attacker_pos)
            if msg:
                logs.append(f"{team1.name}: {msg}")

        m2 = min(counts2.get(attacker_pos, 0), counts1.get(target_pos, 0))
        if m2 > 0:
            c2_total += m2
            msg = messages_map.get(attacker_pos)
            if msg:
                logs.append(f"{team2.name}: {msg}")

    delta = c1_total - c2_total
    if delta > 0:
        factor = 1.0 + min(0.35, delta * 0.10)
        return factor, 1.0 / factor, logs
    elif delta < 0:
        factor = 1.0 + min(0.35, (-delta) * 0.10)
        return 1.0 / factor, factor, logs
    return 1.0, 1.0, logs


def get_climates_data() -> List[Dict[str, Any]]:
    """Carrega catálogo de climas de data/climates_seed.json."""
    global _CLIMATES_CACHE
    if _CLIMATES_CACHE is None:
        path = os.path.join(os.path.dirname(__file__), 'data', 'climates_seed.json')
        if os.path.exists(path):
            with open(path, 'r', encoding='utf-8') as f:
                _CLIMATES_CACHE = json.load(f)
        else:
            _CLIMATES_CACHE = []
    return _CLIMATES_CACHE


def get_default_climate() -> Dict[str, Any]:
    """Retorna o clima neutro padrão (Céu Limpo)."""
    climates = get_climates_data()
    for c in climates:
        if c.get("climate") == "clear_sky":
            return c
    return {
        "id": "climate_clear_sky",
        "climate": "clear_sky",
        "name": "Céu Limpo",
        "description": "Visibilidade plena e condições operacionais estáveis.",
        "power_penalty_pct": 0.0,
        "energy_cost_extra": 0,
        "mitigation_required": None,
        "mitigation_label": "Nenhuma mitigação necessária",
    }


def calculate_hero_effective_power(hero: Optional[Dict[str, Any]], balance: Optional[Dict[str, Any]] = None) -> float:
    """Calcula o poder efetivo de um herói considerando sua fadiga."""
    if not hero:
        return 0.0
    if balance is None:
        balance = get_balance()
    fatigue_cfg = balance.get("fatigue", {})
    penalty_max = fatigue_cfg.get("power_penalty_max", 0.30)
    current_power = hero.get("current_power", hero.get("power", 50))
    fatigue = hero.get("fatigue", 0)
    return float(current_power) * (1.0 - float(penalty_max) * (float(fatigue) / 100.0))


def calculate_team_base_power(starters: List[Optional[Dict[str, Any]]], balance: Optional[Dict[str, Any]] = None) -> float:
    """Calcula o Poder Base da Equipe: soma do poder efetivo dos titulares dividido pela contagem padrão de titulares."""
    if balance is None:
        balance = get_balance()
    starters_count = balance.get("party", {}).get("starters", 6)
    if starters_count <= 0:
        return 0.0
    total_power = sum(calculate_hero_effective_power(h, balance) for h in starters if h)
    return total_power / starters_count


def calculate_slot_bonus(loadout: Optional[Dict[str, Any]], balance: Optional[Dict[str, Any]] = None) -> float:
    """Calcula o bônus de poder total conferido pelos slots de loadout equipados."""
    if balance is None:
        balance = get_balance()
    loadout_cfg = balance.get("loadout", {})
    factor = loadout_cfg.get("slot_bonus_factor", 0.15)
    cap = loadout_cfg.get("slot_bonus_cap", 15)
    total_power_bonus = 0.0
    if loadout and isinstance(loadout, dict):
        for item in loadout.values():
            if isinstance(item, dict):
                total_power_bonus += item.get("power_bonus", 0)
    return min(total_power_bonus * factor, float(cap))


def check_terrain_mitigation(loadout: Optional[Dict[str, Any]], required_mitigation: Optional[str]) -> bool:
    """Verifica se algum item no loadout mitiga a exigência ambiental da masmorra."""
    if not required_mitigation:
        return True
    if loadout and isinstance(loadout, dict):
        for item in loadout.values():
            if isinstance(item, dict):
                mit = item.get("terrain_mitigation")
                if mit == required_mitigation:
                    return True
                # Suporte a múltiplas mitigações ou tags se fornecidas em lista
                mits = item.get("mitigations", [])
                if required_mitigation in mits:
                    return True
    return False


def check_climate_mitigation(loadout: Optional[Dict[str, Any]], required_mitigation: Optional[str]) -> bool:
    """Verifica se algum item no loadout mitiga a condição climática."""
    if not required_mitigation:
        return True
    if loadout and isinstance(loadout, dict):
        for item in loadout.values():
            if isinstance(item, dict):
                mit = item.get("terrain_mitigation")
                if mit == required_mitigation:
                    return True
                mits = item.get("mitigations", [])
                if required_mitigation in mits:
                    return True
    return False


def calculate_average_agi(starters: List[Optional[Dict[str, Any]]]) -> float:
    """Calcula a Agilidade média dos titulares a partir de hidden_attributes.agi."""
    if not starters:
        return 0.0
    valid_heroes = [h for h in starters if h]
    if not valid_heroes:
        return 0.0
    total_agi = 0.0
    for h in valid_heroes:
        attrs = h.get("hidden_attributes", {})
        agi = attrs.get("agi", h.get("agi", 50))
        total_agi += agi
    return total_agi / len(valid_heroes)


class Team:
    """Representa a força-tarefa de uma guilda escalada para a expedição."""

    def __init__(
        self,
        name: str,
        base_power: float = 0.0,
        bonus_slots: float = 0.0,
        consumable_energy_bonus: float = 0.0,
        agi: float = 50.0,
        has_terrain_mitigation: bool = True,
        has_climate_mitigation: bool = True,
        balance: Optional[Dict[str, Any]] = None,
        heroes: Optional[List[Dict[str, Any]]] = None,
        traits: Optional[List[Any]] = None,
        loadout: Optional[Dict[str, Any]] = None,
    ):
        if balance is None:
            balance = get_balance()
        self.balance = balance
        self.name = name
        self.base_power = float(base_power)
        self.bonus_slots = float(bonus_slots)
        self.consumable_energy_bonus = float(consumable_energy_bonus)
        self.agi = float(agi)
        self.has_terrain_mitigation = has_terrain_mitigation
        self.has_climate_mitigation = has_climate_mitigation
        self.heroes = heroes or []
        self.traits = traits or []
        self.loadout = loadout or {}

        # Extração das habilidades ativas da equipe com base nos heróis titulares
        self.skills = self._extract_active_skills()

        exp_cfg = self.balance.get("expedition", {})
        base_energy = exp_cfg.get("base_energy", 100)
        self.energy = float(base_energy + self.consumable_energy_bonus)
        self.score = 0
        self.rooms_explored = 0
        self.exit_reason = "Suprimentos esgotados"

    def get_loadout_item_name(self, slot_key: str) -> Optional[str]:
        """Retorna a denominação do artefato corporativo equipado no slot especificado."""
        if not hasattr(self, "loadout") or not self.loadout:
            return None
        item = self.loadout.get(slot_key)
        if isinstance(item, dict):
            return item.get("name")
        return None

    def _extract_active_skills(self) -> Dict[str, Dict[str, Any]]:
        """Mapeia quais habilidades estão ativas na equipe com base nos titulares."""
        skills_catalog = get_skills_dict()
        active = {}
        for h in self.heroes:
            if not h or not isinstance(h, dict):
                continue
            spec_id = h.get("specialization_id")
            class_id = h.get("class_id")

            # Busca por especialização vinculada
            for skill_id, skill in skills_catalog.items():
                if skill.get("specialization_id") and skill.get("specialization_id") == spec_id:
                    active[skill_id] = skill
                elif skill.get("class_id") and skill.get("class_id") == class_id and not skill.get("specialization_id"):
                    active[skill_id] = skill

            # Suporte a declaração direta de skill_ids no herói
            for sid in h.get("skill_ids", []):
                if sid in skills_catalog:
                    active[sid] = skills_catalog[sid]

        return active

    def has_skill(self, skill_id: str) -> bool:
        """Verifica se a equipe possui uma habilidade ativa."""
        return skill_id in self.skills

    def get_skill(self, skill_id: str) -> Optional[Dict[str, Any]]:
        """Retorna os dados da habilidade ativa ou None."""
        return self.skills.get(skill_id)

    def has_trait(self, trait_id: str) -> bool:
        """Verifica se a equipe possui um traço específico."""
        for t in self.traits:
            tid = t.get("id") if isinstance(t, dict) else str(t)
            if tid == trait_id:
                return True
        return False

    def get_trait_effects_list(self) -> List[Dict[str, Any]]:
        """Retorna a lista de dicionários de efeitos dos traços da equipe."""
        res = []
        for t in self.traits:
            td = get_trait_dict(t)
            if td and "effects" in td:
                res.append(td["effects"])
        return res

    def get_auto_mitigate_terrains(self) -> List[str]:
        """Retorna lista de terrenos mitigados automaticamente pelos traços."""
        res = []
        for eff in self.get_trait_effects_list():
            mits = eff.get("auto_mitigate_terrain", [])
            if isinstance(mits, list):
                res.extend(mits)
            elif isinstance(mits, str):
                res.append(mits)
        return res

    def get_auto_mitigate_climates(self) -> List[str]:
        """Retorna lista de climas mitigados automaticamente pelos traços."""
        res = []
        for eff in self.get_trait_effects_list():
            mits = eff.get("auto_mitigate_climate", [])
            if isinstance(mits, list):
                res.extend(mits)
            elif isinstance(mits, str):
                res.append(mits)
        return res

    def get_trait_power_bonus(self, terrain_type: Optional[str] = None, climate_type: Optional[str] = None) -> float:
        """Calcula o bônus de poder advindo dos traços da equipe."""
        bonus = 0.0
        for eff in self.get_trait_effects_list():
            bonus += float(eff.get("defense_power_bonus", 0))
            bonus += float(eff.get("combat_power_bonus", 0))
            if terrain_type == "toxic_swamp":
                bonus += float(eff.get("swamp_power_bonus", 0))
            if terrain_type == "glacier_frost":
                bonus += float(eff.get("cold_terrain_bonus", 0))
        return bonus

    def get_trait_energy_multiplier(self, terrain_type: Optional[str] = None) -> float:
        """Calcula o multiplicador de gasto de suprimentos advindo dos traços."""
        multiplier = 1.0
        for eff in self.get_trait_effects_list():
            multiplier *= float(eff.get("energy_cost_multiplier", 1.0))
            if terrain_type in ("volcanic_heat", "scorching_heat") and "arid_energy_penalty" in eff:
                multiplier *= float(eff.get("arid_energy_penalty", 1.0))
        return multiplier

    def get_position_counts(self) -> Dict[str, int]:
        """Retorna a contagem de colaboradores titulares por posição operacional."""
        counts = {
            "pos_vanguarda": 0,
            "pos_dps": 0,
            "pos_suporte": 0,
            "pos_suporte_logistico": 0,
        }
        for h in self.heroes:
            if h and isinstance(h, dict):
                pos = get_hero_position(h)
                if pos in counts:
                    counts[pos] += 1
        return counts

    def get_logistics_energy_multiplier(self) -> float:
        """
        Calcula o multiplicador de consumo de suprimentos conferido por Suportes Logísticos.
        Fórmula: C = base_drain * ... * team.get_logistics_energy_multiplier()
        """
        counts = self.get_position_counts()
        num_logistics = counts.get("pos_suporte_logistico", 0)
        if num_logistics <= 0:
            return 1.0
        positions = get_positions_data()
        reduction_per_hero = 0.15
        max_reduction = 0.40
        for p in positions:
            if p.get("id") == "pos_suporte_logistico":
                reduction_per_hero = float(p.get("supply_drain_reduction_pct", 0.15))
                max_reduction = float(p.get("max_supply_drain_reduction_pct", 0.40))
                break
        total_reduction = min(max_reduction, num_logistics * reduction_per_hero)
        return max(0.1, 1.0 - total_reduction)

    def get_dps_boss_execution_bonus(self) -> float:
        """Calcula o bônus percentual de execução contra o Boss Final conferido por heróis DPS."""
        counts = self.get_position_counts()
        num_dps = counts.get("pos_dps", 0)
        if num_dps <= 0:
            return 0.0
        positions = get_positions_data()
        bonus_per_dps = 0.15
        for p in positions:
            if p.get("id") == "pos_dps":
                bonus_per_dps = float(p.get("boss_execution_bonus_pct", 0.15))
                break
        return num_dps * bonus_per_dps

    def calculate_effective_power(
        self,
        terrain_power_penalty_pct: float = 0.0,
        climate_power_penalty_pct: float = 0.0,
        terrain_type: Optional[str] = None,
        climate_type: Optional[str] = None,
    ) -> float:
        """
        Calcula o Poder Efetivo da equipe aplicando penalidade percentual de terreno e clima,
        além de bônus advindos de habilidades e traços da guilda.
        """
        raw_terrain_pct = float(terrain_power_penalty_pct)
        if raw_terrain_pct > 1.0:
            raw_terrain_pct /= 100.0

        raw_climate_pct = float(climate_power_penalty_pct)
        if raw_climate_pct > 1.0:
            raw_climate_pct /= 100.0

        terrain_pct = 0.0 if self.has_terrain_mitigation else raw_terrain_pct

        # Habilidade Sobrevivência (Guerreiro/Berserker):
        # Reduz pela metade a penalidade de terrenos severos sem necessidade de item.
        if terrain_pct > 0.0 and self.has_skill("skill_survival"):
            skill_data = self.get_skill("skill_survival") or {}
            multiplier = float(skill_data.get("severe_terrain_penalty_multiplier", 0.50))
            terrain_pct *= multiplier

        # Desacoplamento da Dupla Penalidade (TASK-806):
        # O Bioma (Terreno) é o único vetor de impacto em Poder Efetivo.
        total_penalty_pct = min(1.0, terrain_pct)
        trait_bonus = self.get_trait_power_bonus(terrain_type, climate_type)
        effective = (self.base_power + self.bonus_slots + trait_bonus) * (1.0 - total_penalty_pct)
        return max(0.0, effective)


class MatchEngine:
    """Motor de simulação de expedições semanais e confrontos em masmorras."""

    def __init__(
        self,
        team1: Team,
        team2: Team,
        dungeon: Optional[Dict[str, Any]] = None,
        climate: Optional[Dict[str, Any]] = None,
        terrain_penalty_t1: Optional[float] = None,
        terrain_penalty_t2: Optional[float] = None,
        energy_cost_extra_t1: Optional[float] = None,
        energy_cost_extra_t2: Optional[float] = None,
        num_rooms: Optional[int] = None,
        base_energy_cost_per_room: Optional[float] = None,
        terrain_name: Optional[str] = None,
        recommended_power: Optional[float] = None,
        rng: Optional[random.Random] = None,
        fast_mode: bool = False,
        balance: Optional[Dict[str, Any]] = None,
    ):
        self.team1 = team1
        self.team2 = team2
        self.balance = balance if balance is not None else get_balance()
        self.fast_mode = fast_mode
        self.rng = rng if rng is not None else random.Random()

        exp_cfg = self.balance.get("expedition", {})
        self.num_rooms = num_rooms if num_rooms is not None else exp_cfg.get("max_rooms", 10)
        self.base_energy_cost_per_room = (
            base_energy_cost_per_room
            if base_energy_cost_per_room is not None
            else exp_cfg.get("base_energy_cost_per_room", 10)
        )
        self.room_cost_variance = exp_cfg.get("room_cost_variance", 0.25)
        self.room_encounter_probability = exp_cfg.get("room_encounter_probability", 0.65)
        self.solo_clear_base = exp_cfg.get("solo_clear_base", 0.6)
        self.agi_energy_reduction_max = exp_cfg.get("agi_energy_reduction_max", 0.20)
        self.miniboss_draw_margin = exp_cfg.get("miniboss_draw_margin", 0.08)
        self.miniboss_points = exp_cfg.get("miniboss_points", 1)
        self.boss_threshold_pct = exp_cfg.get("boss_threshold_pct", 0.15)
        self.boss_win_points = exp_cfg.get("boss_win_points", 2)
        self.boss_joint_points = exp_cfg.get("boss_joint_points", 1)

        # Configurações ambientais da masmorra (Bioma)
        self.dungeon = dungeon or {}
        if dungeon:
            self.terrain_name = terrain_name or dungeon.get("name", dungeon.get("terrain_label", "Masmorra"))
            self.recommended_power = (
                recommended_power if recommended_power is not None else dungeon.get("recommended_power", 55)
            )
            self.terrain_type = dungeon.get("terrain", "neutral")
            dungeon_penalty = dungeon.get("power_penalty_pct", 0.0)
            dungeon_extra_energy = dungeon.get("energy_cost_extra", 0)
            req_mitigation = dungeon.get("mitigation_required")
        else:
            self.terrain_name = terrain_name or "Campo Aberto Verdejante"
            self.recommended_power = recommended_power if recommended_power is not None else 55
            self.terrain_type = "neutral"
            dungeon_penalty = 0.0
            dungeon_extra_energy = 0
            req_mitigation = None

        # Configurações climáticas semanais (Clima)
        self.climate = climate if climate is not None else get_default_climate()
        self.climate_name = self.climate.get("name", "Céu Limpo")
        self.climate_type = self.climate.get("climate", "clear_sky")
        climate_penalty = self.climate.get("power_penalty_pct", 0.0)
        climate_extra_energy = self.climate.get("energy_cost_extra", 0)
        climate_req_mitigation = self.climate.get("mitigation_required")

        # Verifica se o confronto ocorre em ambiente com matriz elemental
        elemental_tags = {
            "volcanic_heat", "glacier_frost", "toxic_swamp", "lightning_peaks",
            "arcane_fog", "submerged_ruins", "lightning_storm", "scorching_heat",
            "polar_wind", "acid_rain"
        }
        self.is_elemental_encounter = (
            self.terrain_type in elemental_tags or self.climate_type in elemental_tags
        )

        # Mitigações automáticas advindas de traços das forças-tarefas
        if req_mitigation:
            if req_mitigation in self.team1.get_auto_mitigate_terrains() or self.terrain_type in self.team1.get_auto_mitigate_terrains():
                self.team1.has_terrain_mitigation = True
            if req_mitigation in self.team2.get_auto_mitigate_terrains() or self.terrain_type in self.team2.get_auto_mitigate_terrains():
                self.team2.has_terrain_mitigation = True

        if climate_req_mitigation:
            if climate_req_mitigation in self.team1.get_auto_mitigate_climates() or self.climate_type in self.team1.get_auto_mitigate_climates():
                self.team1.has_climate_mitigation = True
            if climate_req_mitigation in self.team2.get_auto_mitigate_climates() or self.climate_type in self.team2.get_auto_mitigate_climates():
                self.team2.has_climate_mitigation = True

        # Penalidades ambientais de terreno calculadas para cada equipe
        if terrain_penalty_t1 is not None:
            self.penalty_pct_t1 = terrain_penalty_t1
        else:
            self.penalty_pct_t1 = 0.0 if (not req_mitigation or team1.has_terrain_mitigation) else dungeon_penalty

        if terrain_penalty_t2 is not None:
            self.penalty_pct_t2 = terrain_penalty_t2
        else:
            self.penalty_pct_t2 = 0.0 if (not req_mitigation or team2.has_terrain_mitigation) else dungeon_penalty

        # Desacoplamento da Dupla Penalidade (TASK-806):
        # O Bioma (Terreno) é o único vetor de impacto em Poder Efetivo e Consumo Extra de Suprimentos.
        self.climate_penalty_t1 = 0.0
        self.climate_penalty_t2 = 0.0

        # Custos extras de suprimentos exclusivos do Terreno (Bioma)
        t1_terrain_extra = 0 if (not req_mitigation or team1.has_terrain_mitigation) else dungeon_extra_energy
        if energy_cost_extra_t1 is not None:
            self.extra_cost_t1 = energy_cost_extra_t1
        else:
            self.extra_cost_t1 = t1_terrain_extra

        t2_terrain_extra = 0 if (not req_mitigation or team2.has_terrain_mitigation) else dungeon_extra_energy
        if energy_cost_extra_t2 is not None:
            self.extra_cost_t2 = energy_cost_extra_t2
        else:
            self.extra_cost_t2 = t2_terrain_extra

        self.match_log: List[str] = []
        self.room_events: List[Dict[str, Any]] = []

    def log(self, message: str):
        if not self.fast_mode:
            self.match_log.append(message)

    def _simulate_round(self, room: int, ep1: float, ep2: float) -> bool:
        """Simula a resolução de uma câmara da masmorra para ambas as forças-tarefas."""
        is_final_boss = (room == self.num_rooms)

        # A guilda só entra numa sala com energia estritamente acima de 0
        t1_entered = self.team1.energy > 0
        t2_entered = self.team2.energy > 0

        if not t1_entered and not t2_entered:
            return True

        # A variação de custo de suprimentos é sorteada por sala e vale para as duas guildas na mesma sala
        room_variance = self.rng.uniform(1.0 - self.room_cost_variance, 1.0 + self.room_cost_variance)

        # Define antecipadamente se há encontro (salas 1 até max_rooms - 1)
        has_encounter = True
        if not is_final_boss:
            has_encounter = (self.rng.random() < self.room_encounter_probability)

        # Consumo de suprimentos da sala percorrida (com multiplicador de traços de cada equipe e Suporte Logístico)
        if t1_entered:
            agi_reduction_1 = self.agi_energy_reduction_max * (self.team1.agi / 100.0)
            logistics_mult_1 = self.team1.get_logistics_energy_multiplier()
            base_cost_1 = self.base_energy_cost_per_room * room_variance * (1.0 - agi_reduction_1) * logistics_mult_1

            # Habilidade Batedor (Ladino/Arqueiro):
            # Redução no custo de suprimentos ao explorar salas vazias
            if not has_encounter and self.team1.has_skill("skill_scout"):
                scout_skill = self.team1.get_skill("skill_scout") or {}
                reduction_pct = float(scout_skill.get("empty_room_cost_reduction_pct", 0.30))
                base_cost_1 *= (1.0 - reduction_pct)

            trait_energy_mult_1 = self.team1.get_trait_energy_multiplier(self.terrain_type)
            cost_t1 = (base_cost_1 + self.extra_cost_t1) * trait_energy_mult_1
            self.team1.energy = max(0.0, self.team1.energy - cost_t1)
            self.team1.rooms_explored += 1
            if self.team1.energy == 0 and not is_final_boss:
                self.team1.exit_reason = "Suprimentos esgotados"

        if t2_entered:
            agi_reduction_2 = self.agi_energy_reduction_max * (self.team2.agi / 100.0)
            logistics_mult_2 = self.team2.get_logistics_energy_multiplier()
            base_cost_2 = self.base_energy_cost_per_room * room_variance * (1.0 - agi_reduction_2) * logistics_mult_2

            # Habilidade Batedor (Ladino/Arqueiro) para Team 2
            if not has_encounter and self.team2.has_skill("skill_scout"):
                scout_skill = self.team2.get_skill("skill_scout") or {}
                reduction_pct = float(scout_skill.get("empty_room_cost_reduction_pct", 0.30))
                base_cost_2 *= (1.0 - reduction_pct)

            trait_energy_mult_2 = self.team2.get_trait_energy_multiplier(self.terrain_type)
            cost_t2 = (base_cost_2 + self.extra_cost_t2) * trait_energy_mult_2
            self.team2.energy = max(0.0, self.team2.energy - cost_t2)
            self.team2.rooms_explored += 1
            if self.team2.energy == 0 and not is_final_boss:
                self.team2.exit_reason = "Suprimentos esgotados"

        room_report = {
            "room": room,
            "is_final_boss": is_final_boss,
            "energy_t1": round(self.team1.energy, 2),
            "energy_t2": round(self.team2.energy, 2),
            "t1_present": t1_entered,
            "t2_present": t2_entered,
        }

        score_before_t1 = self.team1.score
        score_before_t2 = self.team2.score

        if is_final_boss:
            event_msg = self._resolve_final_boss(ep1, ep2, t1_entered, t2_entered)
            if t1_entered:
                self.team1.exit_reason = "Boss resolvido"
            if t2_entered:
                self.team2.exit_reason = "Boss resolvido"
            if not self.fast_mode:
                room_report["event"] = event_msg
                room_report["score_t1"] = self.team1.score
                room_report["score_t2"] = self.team2.score
                room_report["points_t1"] = self.team1.score - score_before_t1
                room_report["points_t2"] = self.team2.score - score_before_t2
                self.room_events.append(room_report)
            return True
        else:
            if not has_encounter:
                empty_idx = self.rng.randint(0, len(EMPTY_LOGS) - 1)
                event_msg = EMPTY_LOGS[empty_idx]
                if t1_entered and self.team1.has_skill("skill_scout"):
                    event_msg += f" (Batedor de {self.team1.name} otimizou a rota e reduziu custos de provisão)."
                self.log(f"Câmara {room}: {event_msg}")
            else:
                event_msg = self._resolve_miniboss(ep1, ep2, room, t1_entered, t2_entered)

            if not self.fast_mode:
                room_report["event"] = event_msg
                room_report["score_t1"] = self.team1.score
                room_report["score_t2"] = self.team2.score
                room_report["points_t1"] = self.team1.score - score_before_t1
                room_report["points_t2"] = self.team2.score - score_before_t2
                self.room_events.append(room_report)

        if self.team1.energy == 0 and self.team2.energy == 0:
            self.log(f"Câmara {room}: Ambas as expedições esgotaram seus suprimentos operacionais.")
            return True

        return False

    def simulate(self) -> Dict[str, Any]:
        """Executa a simulação sala a sala até o esgotamento de suprimentos ou resolução do Boss Final."""
        self.log(f"Iniciando expedição oficial na masmorra: {self.terrain_name} | Clima: {self.climate_name}")
        self.log(f"Confronto da Rodada: {self.team1.name} vs {self.team2.name}")

        ep1 = self.team1.calculate_effective_power(self.penalty_pct_t1, self.climate_penalty_t1, self.terrain_type, self.climate_type)
        ep2 = self.team2.calculate_effective_power(self.penalty_pct_t2, self.climate_penalty_t2, self.terrain_type, self.climate_type)

        self.log(
            f"Poder Efetivo Calculado — {self.team1.name}: {ep1:.1f} | "
            f"{self.team2.name}: {ep2:.1f}"
        )

        for room in range(1, self.num_rooms + 1):
            should_stop = self._simulate_round(room, ep1, ep2)
            if should_stop:
                break

        return self._generate_save_data()

    def _resolve_miniboss(self, ep1: float, ep2: float, room: int, t1_present: bool, t2_present: bool) -> str:
        """Resolve o confronto de câmara intermediária com Mini-Boss ou ameaça de sala."""
        effective_ep1 = ep1
        effective_ep2 = ep2

        # Bônus de poder advindo de traços táticos para miniboss e masmorras elementais
        for eff in self.team1.get_trait_effects_list():
            effective_ep1 += float(eff.get("miniboss_power_bonus", 0))
            if self.is_elemental_encounter:
                effective_ep1 += float(eff.get("elemental_encounter_power_bonus", 0))

        for eff in self.team2.get_trait_effects_list():
            effective_ep2 += float(eff.get("miniboss_power_bonus", 0))
            if self.is_elemental_encounter:
                effective_ep2 += float(eff.get("elemental_encounter_power_bonus", 0))

        if self.is_elemental_encounter:
            if t1_present and self.team1.has_skill("skill_concentrated_channeling"):
                skill_data = self.team1.get_skill("skill_concentrated_channeling") or {}
                bonus_pct = float(skill_data.get("elemental_miniboss_power_bonus_pct", 0.20))
                effective_ep1 *= (1.0 + bonus_pct)

            if t2_present and self.team2.has_skill("skill_concentrated_channeling"):
                skill_data = self.team2.get_skill("skill_concentrated_channeling") or {}
                bonus_pct = float(skill_data.get("elemental_miniboss_power_bonus_pct", 0.20))
                effective_ep2 *= (1.0 + bonus_pct)

        offensive_name_1 = self.team1.get_loadout_item_name("Arsenal Ofensivo")
        defensive_name_1 = self.team1.get_loadout_item_name("Blindagem Operacional")

        if t1_present and t2_present:
            # Aplica multiplicadores de vantagem de posições operacionais (PvPvE)
            mult_t1, mult_t2, counter_logs = calculate_positional_advantage(self.team1, self.team2)
            effective_ep1 *= mult_t1
            effective_ep2 *= mult_t2
            for clog in counter_logs:
                self.log(f"Câmara {room} [Vantagem Posicional]: {clog}")

            total_p = effective_ep1 + effective_ep2
            prob_t1 = effective_ep1 / total_p if total_p > 0 else 0.5
            roll = self.rng.random()

            # Margem de desempate modificada por traços (ex: trait_tact_arcane_interdiction)
            draw_margin_1 = self.miniboss_draw_margin
            for eff in self.team1.get_trait_effects_list():
                draw_margin_1 += float(eff.get("miniboss_draw_margin_bonus", 0))

            if roll < prob_t1 - draw_margin_1:
                self.team1.score += self.miniboss_points
                base_log = PLAYER_MINIBOSS_LOGS[self.rng.randint(0, len(PLAYER_MINIBOSS_LOGS) - 1)]
                loot_bonus = f" — {LEGENDARY_LOOT_LOGS[self.rng.randint(0, len(LEGENDARY_LOOT_LOGS) - 1)]}" if self.rng.random() < 0.20 else ""
                msg = f"{self.team1.name}: {base_log}{loot_bonus}"
            elif roll > prob_t1 + self.miniboss_draw_margin:
                self.team2.score += self.miniboss_points
                base_log = RIVAL_MINIBOSS_LOGS[self.rng.randint(0, len(RIVAL_MINIBOSS_LOGS) - 1)]
                inj_bonus = f" — ⚠️ {INJURY_LOGS[self.rng.randint(0, len(INJURY_LOGS) - 1)]}" if self.rng.random() < 0.15 else ""
                msg = f"{self.team2.name}: {base_log}{inj_bonus}"
            else:
                # Zona de desempate:
                # Habilidade Parede de Escudos (Guerreiro/Espadachim):
                # Vantagem de desempate em Minibosses contra rivais
                t1_has_shield = self.team1.has_skill("skill_shield_wall")
                t2_has_shield = self.team2.has_skill("skill_shield_wall")

                if t1_has_shield and not t2_has_shield:
                    self.team1.score += self.miniboss_points
                    msg = (
                        f"Disputa equilibrada na Câmara {room}, resolvida pela Parede de Escudos de "
                        f"{self.team1.name} (+{self.miniboss_points} PE)."
                    )
                elif t2_has_shield and not t1_has_shield:
                    self.team2.score += self.miniboss_points
                    msg = (
                        f"Disputa equilibrada na Câmara {room}, resolvida pela Parede de Escudos de "
                        f"{self.team2.name} (+{self.miniboss_points} PE)."
                    )
                else:
                    msg = f"Disputa equilibrada na Câmara {room}. Confronto simultâneo entre {self.team1.name} e {self.team2.name} sem abate prioritário (0 PE)."
        elif t1_present:
            solo_bonus = sum(float(e.get("solo_clear_bonus", 0)) for e in self.team1.get_trait_effects_list())
            p_clear = max(0.05, min(0.95, (self.solo_clear_base + solo_bonus) * effective_ep1 / self.recommended_power))
            if self.rng.random() < p_clear:
                self.team1.score += self.miniboss_points
                base_log = PLAYER_MINIBOSS_LOGS[self.rng.randint(0, len(PLAYER_MINIBOSS_LOGS) - 1)]
                msg = f"{self.team1.name}: {base_log}"
            else:
                if defensive_name_1:
                    msg = f"{self.team1.name} não obteve êxito na contenção da ameaça na Câmara {room} (0 PE); a blindagem '{defensive_name_1}' mitigou danos maiores."
                else:
                    msg = f"{self.team1.name} não obteve êxito na contenção da ameaça na Câmara {room} (0 PE)."
        elif t2_present:
            solo_bonus = sum(float(e.get("solo_clear_bonus", 0)) for e in self.team2.get_trait_effects_list())
            p_clear = max(0.05, min(0.95, (self.solo_clear_base + solo_bonus) * effective_ep2 / self.recommended_power))
            if self.rng.random() < p_clear:
                self.team2.score += self.miniboss_points
                base_log = RIVAL_MINIBOSS_LOGS[self.rng.randint(0, len(RIVAL_MINIBOSS_LOGS) - 1)]
                msg = f"{self.team2.name}: {base_log}"
            else:
                msg = f"{self.team2.name} não obteve êxito na contenção da ameaça na Câmara {room} (0 PE)."
        else:
            msg = f"Nenhum destacamento operacional presente na Câmara {room}."

        self.log(msg)
        return msg

    def _resolve_final_boss(self, ep1: float, ep2: float, t1_present: bool, t2_present: bool) -> str:
        """Resolve o confronto final do Boss da masmorra."""
        self.log("Forças-tarefas alcançaram a Câmara do Boss Final!")

        offensive_name_1 = self.team1.get_loadout_item_name("Arsenal Ofensivo")

        eval_ep1 = ep1
        eval_ep2 = ep2
        for eff in self.team1.get_trait_effects_list():
            eval_ep1 += float(eff.get("boss_power_bonus", 0))
        for eff in self.team2.get_trait_effects_list():
            eval_ep2 += float(eff.get("boss_power_bonus", 0))

        if t1_present and t2_present:
            # Bônus de Execução de Boss dos colaboradores DPS
            dps_bonus_t1 = self.team1.get_dps_boss_execution_bonus()
            dps_bonus_t2 = self.team2.get_dps_boss_execution_bonus()
            eval_ep1 *= (1.0 + dps_bonus_t1)
            eval_ep2 *= (1.0 + dps_bonus_t2)

            # Vantagens de posições operacionais (PvPvE) no Boss Final
            mult_t1, mult_t2, counter_logs = calculate_positional_advantage(self.team1, self.team2)
            eval_ep1 *= mult_t1
            eval_ep2 *= mult_t2
            for clog in counter_logs:
                self.log(f"Câmara do Boss [Vantagem Posicional]: {clog}")

            diff = abs(eval_ep1 - eval_ep2)
            higher_p = max(eval_ep1, eval_ep2)
            percent_diff = (diff / higher_p) if higher_p > 0 else 0.0

            if percent_diff > self.boss_threshold_pct:
                if eval_ep1 > eval_ep2:
                    self.team1.score += self.boss_win_points
                    boss_log = PLAYER_BOSS_LOGS[self.rng.randint(0, len(PLAYER_BOSS_LOGS) - 1)]
                    msg = f"{self.team1.name}: {boss_log}"
                else:
                    self.team2.score += self.boss_win_points
                    boss_log = PLAYER_BOSS_LOGS[self.rng.randint(0, len(PLAYER_BOSS_LOGS) - 1)].replace("da Guilda do Jogador", f"de {self.team2.name}")
                    msg = f"{self.team2.name}: {boss_log}"
            else:
                self.team1.score += self.boss_joint_points
                self.team2.score += self.boss_joint_points
                joint_log = JOINT_BOSS_LOGS[self.rng.randint(0, len(JOINT_BOSS_LOGS) - 1)]
                msg = f"{joint_log} (Abate Conjunto)"
        elif t1_present:
            # Habilidade Execução Fria (Ladino/Assassino):
            # Bônus na rolagem de Boss solitário
            solo_eval = eval_ep1
            if self.team1.has_skill("skill_cold_execution"):
                skill_data = self.team1.get_skill("skill_cold_execution") or {}
                bonus_pct = float(skill_data.get("solo_boss_power_bonus_pct", 0.15))
                solo_eval *= (1.0 + bonus_pct)

            if solo_eval >= self.recommended_power:
                self.team1.score += self.boss_win_points
                boss_log = PLAYER_BOSS_LOGS[self.rng.randint(0, len(PLAYER_BOSS_LOGS) - 1)]
                msg = f"{self.team1.name}: {boss_log}"
            else:
                msg = f"{self.team1.name} enfrentou o Boss Final, mas o contingente operacional não atingiu o poder recomendado de {self.recommended_power} (0 PE)."
        elif t2_present:
            solo_eval = eval_ep2
            if self.team2.has_skill("skill_cold_execution"):
                skill_data = self.team2.get_skill("skill_cold_execution") or {}
                bonus_pct = float(skill_data.get("solo_boss_power_bonus_pct", 0.15))
                solo_eval *= (1.0 + bonus_pct)

            if solo_eval >= self.recommended_power:
                self.team2.score += self.boss_win_points
                boss_log = PLAYER_BOSS_LOGS[self.rng.randint(0, len(PLAYER_BOSS_LOGS) - 1)].replace("da Guilda do Jogador", f"de {self.team2.name}")
                msg = f"{self.team2.name}: {boss_log}"
            else:
                msg = f"{self.team2.name} enfrentou o Boss Final, mas o contingente operacional não atingiu o poder recomendado de {self.recommended_power} (0 PE)."
        else:
            msg = "Nenhuma expedição alcançou a Câmara do Boss Final."

        self.log(msg)
        return msg

    def _generate_save_data(self) -> Dict[str, Any]:
        """Gera o consolidado do resultado da expedição."""
        return {
            "score": {
                self.team1.name: self.team1.score,
                self.team2.name: self.team2.score,
            },
            "player_score": self.team1.score,
            "rival_score": self.team2.score,
            "score_t1": self.team1.score,
            "score_t2": self.team2.score,
            "points_t1": self.team1.score,
            "points_t2": self.team2.score,
            "final_energy_player": round(self.team1.energy, 2),
            "final_energy_rival": round(self.team2.energy, 2),
            "rooms_explored_player": self.team1.rooms_explored,
            "rooms_explored_rival": self.team2.rooms_explored,
            "exit_reason_player": self.team1.exit_reason,
            "exit_reason_rival": self.team2.exit_reason,
            "climate": self.climate,
            "match_log": self.match_log,
            "room_events": self.room_events,
        }


def calculate_rival_power(
    guild: Dict[str, Any],
    dungeon: Optional[Dict[str, Any]] = None,
    climate: Optional[Dict[str, Any]] = None,
) -> float:
    """
    Calcula o poder efetivo de uma guilda rival considerando seus traços, masmorra e clima.
    """
    base_power = float(guild.get("power_rating", 60))
    traits = guild.get("traits", [])
    team = Team(
        name=guild.get("name", "Rival"),
        base_power=base_power,
        bonus_slots=6.0,
        traits=traits,
        has_terrain_mitigation=False,
        has_climate_mitigation=False,
    )
    req_mit = dungeon.get("mitigation_required") if dungeon else None
    terrain_type = dungeon.get("terrain", "neutral") if dungeon else "neutral"
    dungeon_penalty = float(dungeon.get("power_penalty_pct", 0.0)) if dungeon else 0.0

    req_climate_mit = climate.get("mitigation_required") if climate else None
    climate_type = climate.get("climate", "clear_sky") if climate else "clear_sky"
    climate_penalty = float(climate.get("power_penalty_pct", 0.0)) if climate else 0.0

    if req_mit:
        if req_mit in team.get_auto_mitigate_terrains() or terrain_type in team.get_auto_mitigate_terrains():
            team.has_terrain_mitigation = True

    if req_climate_mit:
        if req_climate_mit in team.get_auto_mitigate_climates() or climate_type in team.get_auto_mitigate_climates():
            team.has_climate_mitigation = True

    return team.calculate_effective_power(
        terrain_power_penalty_pct=dungeon_penalty,
        climate_power_penalty_pct=climate_penalty,
        terrain_type=terrain_type,
        climate_type=climate_type,
    )
