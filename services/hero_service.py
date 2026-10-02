"""
HeroFoot Hero & Facilities Service.
Gerencia atributos derivados, cálculo de Poder real, contratos de temporada,
renovações e departamento de saúde & medicina ocupacional.
"""

import os
import json
import random
from balance import get_balance

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')


def load_classes_seed() -> dict:
    path = os.path.join(DATA_DIR, 'classes_seed.json')
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {"classes": [], "specializations": []}


def load_facilities_seed() -> dict:
    path = os.path.join(DATA_DIR, 'facilities_seed.json')
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {"medical_facilities": [], "medical_actions": {}}


CLASSES_DATA = load_classes_seed()
FACILITIES_DATA = load_facilities_seed()
SPEC_PROFILES = {
    s["id"]: s.get("stat_weight_profile", {})
    for s in CLASSES_DATA.get("specializations", [])
}

FIRST_NAMES = [
    "Kaelen", "Elira", "Dorn", "Orin", "Thalor", "Vespera", "Aldous",
    "Barris", "Lyanna", "Marek", "Elysia", "Kaelan", "Rowan", "Sylas",
    "Branwyn", "Theron", "Garrick", "Finnian", "Isolde", "Cedric",
    "Morrigan", "Alistair", "Caelum", "Brenna", "Gwilym", "Darian"
]

LAST_NAMES = [
    "Vane", "Sombras", "Martel", "Vento-Gélido", "Coroa-de-Ferro", "Sol-Poente",
    "Escriba", "Guarda-Real", "Folha-Verde", "Quebra-Escudo", "Aurora", "Carvalho",
    "Pederneira", "Fosso-Fundo", "Vigia", "Punho-de-Aço", "Brasas", "Névoa", "Alvorecer"
]


def generate_hero(
    hero_id: str = None,
    is_youth: bool = False,
    star_potential: int = None,
    rng: random.Random = None
) -> dict:
    if rng is None or not hasattr(rng, "randint"):
        rng = random.Random()

    classes = CLASSES_DATA.get("classes", [])
    if classes:
        chosen_class = rng.choice(classes)
        class_id = chosen_class["id"]
        specs = [s for s in CLASSES_DATA.get("specializations", []) if s.get("class_id") == class_id]
        chosen_spec = rng.choice(specs) if specs else None
        spec_id = chosen_spec["id"] if chosen_spec else "spec_warrior_berserker"
    else:
        chosen_class = None
        chosen_spec = None
        class_id = "class_warrior"
        spec_id = "spec_warrior_berserker"

    pos_id = chosen_spec.get("position_id") if chosen_spec else None
    if not pos_id:
        pos_id = chosen_class.get("default_position_id", "pos_dps") if chosen_class else "pos_dps"

    positions_data = CLASSES_DATA.get("positions", [])
    pos_item = next((p for p in positions_data if p["id"] == pos_id), None)
    pos_name = pos_item.get("name", "DPS") if pos_item else "DPS"

    profile = SPEC_PROFILES.get(spec_id, {"str": 0.3, "agi": 0.3, "vit": 0.3, "int": 0.1, "wis": 0.1, "lck": 0.1})

    fname = rng.choice(FIRST_NAMES)
    lname = rng.choice(LAST_NAMES)
    name = f"{fname} {lname}"

    if is_youth:
        age = rng.randint(16, 18)
        level = 1
        xp = 0
        base_min, base_max = 14, 25  # Calibragem: aprendizes iniciam em ~20-28 PE
        if star_potential is None:
            roll = rng.random()
            if roll < 0.15:
                star_potential = 1
            elif roll < 0.45:
                star_potential = 2
            elif roll < 0.80:
                star_potential = 3
            elif roll < 0.95:
                star_potential = 4
            else:
                star_potential = 5
        is_revealed = True
        contract_seasons = 0
    else:
        age = rng.randint(19, 32)
        level = min(4, max(1, 1 + (age - 18) // 4))
        xp = 0
        base_min, base_max = 30, 70
        if star_potential is None:
            roll = rng.random()
            if roll < 0.20:
                star_potential = 1
            elif roll < 0.50:
                star_potential = 2
            elif roll < 0.80:
                star_potential = 3
            elif roll < 0.95:
                star_potential = 4
            else:
                star_potential = 5
        is_revealed = False
        contract_seasons = 2

    hidden_attributes = {}
    for attr in ["str", "agi", "vit", "int", "wis", "lck"]:
        weight = profile.get(attr, 0.05)
        bias = int(weight * 25)
        val = rng.randint(base_min, base_max) + bias
        hidden_attributes[attr] = max(1, min(100, val))

    hero_stub = {
        "id": hero_id or f"hero_{rng.randint(100000, 999999)}",
        "name": name,
        "class_id": class_id,
        "specialization_id": spec_id,
        "position": pos_name,
        "position_id": pos_id,
        "age": age,
        "level": level,
        "xp": xp,
        "current_power": 50,
        "status": "Apto",
        "fatigue": 0,
        "salary": 50,
        "injured": False,
        "injury_weeks_left": 0,
        "hidden_attributes": hidden_attributes,
        "potential": {
            "star_potential": star_potential,
            "is_potential_revealed": is_revealed
        },
        "contract_seasons_left": contract_seasons,
        "season_appearances": 0,
        "happiness": 85,
        "pending_renewal": False,
        "transfer_fee": 0,
        "training_weeks": 0 if is_youth else 10,
        "max_training_weeks": 10,
        "maturation_pct": 0 if is_youth else 100,
        "is_graduated": not is_youth,
        "traits": []
    }

    hero_stub["current_power"] = calculate_hero_power(hero_stub)
    pwr = hero_stub["current_power"]
    if is_youth:
        hero_stub["salary"] = 15
        hero_stub["transfer_fee"] = 0
    else:
        hero_stub["salary"] = max(30, round(pwr * 1.1))
        hero_stub["transfer_fee"] = max(120, round(pwr * 8 + (34 - age) * 12))

    return hero_stub


def calculate_hero_power(hero: dict, fit_multiplier: float = 1.0) -> int:
    """
    Calcula o Poder Efetivo Real do Herói (1 a 100) conforme Seção 3 do Contrato Técnico:
    Poder_Herói = clamp( round( Σ (peso_i × atributo_i) × multiplicador_de_encaixe ), 1, 100 )
    """
    spec_id = hero.get("specialization_id")
    profile = SPEC_PROFILES.get(spec_id)
    attrs = hero.get("hidden_attributes", {})

    if not profile or not attrs:
        return hero.get("current_power", 50)

    weighted_sum = sum(profile.get(k, 0.0) * attrs.get(k, 10) for k in profile)
    raw_power = round(weighted_sum * fit_multiplier)
    return max(1, min(100, raw_power))


class HeroService:
    def __init__(self, state):
        self.state = state
        self.facilities_data = load_facilities_seed()

    def get_medical_facilities_data(self) -> dict:
        """Retorna o estado atual das instalações médicas e ações disponíveis."""
        lvl = getattr(self.state, "medical_level", 1)
        facilities = self.facilities_data.get("medical_facilities", [])
        current_fac = next((f for f in facilities if f["level"] == lvl), facilities[0] if facilities else {})
        next_fac = next((f for f in facilities if f["level"] == lvl + 1), None)

        return {
            "current_level": lvl,
            "max_level": 5,
            "facility_name": current_fac.get("name", "Tenda de Curativos"),
            "description": current_fac.get("description", ""),
            "passive_recovery": current_fac.get("passive_recovery", 15),
            "weekly_maintenance": current_fac.get("weekly_maintenance", 20),
            "injury_reduction_pct": current_fac.get("injury_duration_reduction_pct", 0.0),
            "next_upgrade": {
                "level": next_fac["level"],
                "name": next_fac["name"],
                "cost": next_fac["upgrade_cost"],
                "passive_recovery": next_fac["passive_recovery"],
                "weekly_maintenance": next_fac["weekly_maintenance"],
            } if next_fac else None,
            "actions": self.facilities_data.get("medical_actions", {})
        }

    def upgrade_medical_facility(self) -> dict:
        """Moderniza o Departamento Médico para o próximo nível."""
        current_lvl = getattr(self.state, "medical_level", 1)
        if current_lvl >= 5:
            return {
                "success": False,
                "message": "Laudo de Engenharia: O Departamento Médico já atingiu o nível máximo de excelência (Nível 5)."
            }

        facilities = self.facilities_data.get("medical_facilities", [])
        next_fac = next((f for f in facilities if f["level"] == current_lvl + 1), None)
        if not next_fac:
            return {"success": False, "message": "Instalação superior não catalogada."}

        cost = next_fac.get("upgrade_cost", 1000)
        if self.state.gold < cost:
            return {
                "success": False,
                "message": (
                    f"Recursos financeiros insuficientes em tesouraria. "
                    f"Custo de modernização para {next_fac['name']}: {cost} Ouro. Saldo disponível: {self.state.gold} Ouro."
                )
            }

        self.state.gold -= cost
        self.state.medical_level = current_lvl + 1

        return {
            "success": True,
            "message": f"Ordem de Obras Homologada: O Departamento Médico foi modernizado com sucesso para o Nível {self.state.medical_level} ({next_fac['name']}).",
            "new_level": self.state.medical_level,
            "gold": self.state.gold,
            "facilities": self.get_medical_facilities_data()
        }

    def treat_hero_massage(self, hero_id: str) -> dict:
        """Sessão de Massagem & Banhos Termais avulsa para alívio imediato de fadiga."""
        hero = next((h for h in self.state.team if h["id"] == hero_id), None)
        if not hero:
            return {"success": False, "message": f"Aventureiro com registro '{hero_id}' não localizado na folha."}

        actions = self.facilities_data.get("medical_actions", {})
        massage_cfg = actions.get("massage", {"cost": 75, "fatigue_relief": 40})
        cost = massage_cfg.get("cost", 75)
        relief = massage_cfg.get("fatigue_relief", 40)

        if self.state.gold < cost:
            return {
                "success": False,
                "message": f"Tesouraria insuficiente. Sessão de massagem custa {cost} Ouro. Saldo atual: {self.state.gold} Ouro."
            }

        if hero.get("fatigue", 0) <= 0:
            return {
                "success": False,
                "message": f"Laudo Clínico: {hero['name']} já se encontra em repouso pleno (0% de fadiga)."
            }

        self.state.gold -= cost
        hero["fatigue"] = max(0, hero.get("fatigue", 0) - relief)
        if hero["fatigue"] < 70 and not hero.get("injured"):
            hero["status"] = "Apto"
        hero["happiness"] = min(100, hero.get("happiness", 80) + 5)

        return {
            "success": True,
            "message": f"Sessão de Banhos Termais concluída: {hero['name']} recuperou {relief} pontos de fadiga.",
            "hero": hero,
            "gold": self.state.gold
        }

    def accelerate_hero_injury(self, hero_id: str) -> dict:
        """Tratamento Alquímico Especializado para acelerar recuperação de lesão."""
        hero = next((h for h in self.state.team if h["id"] == hero_id), None)
        if not hero:
            return {"success": False, "message": f"Aventureiro '{hero_id}' não localizado."}

        if hero.get("status") == "Falecido":
            return {"success": False, "message": f"{hero['name']} consta com óbito homologado em cartório. Procedimento médico inviável."}

        if not hero.get("injured") or hero.get("injury_weeks_left", 0) <= 0:
            return {"success": False, "message": f"{hero['name']} não possui atestado médico ativo de afastamento."}

        actions = self.facilities_data.get("medical_actions", {})
        action_cfg = actions.get("accelerate_injury", {"cost": 180, "weeks_reduced": 1})
        cost = action_cfg.get("cost", 180)

        # Benefício de Medicina Ocupacional: Heróis ativos da posição Suporte reduzem custos clínicos
        has_active_support = any(
            (h.get("position_id") == "pos_suporte" or h.get("position") == "Suporte")
            and h.get("status") not in ("Afastado", "Falecido")
            for h in getattr(self.state, "team", [])
        )
        if has_active_support:
            positions_data = CLASSES_DATA.get("positions", [])
            sup_item = next((p for p in positions_data if p.get("id") == "pos_suporte"), {})
            discount_pct = float(sup_item.get("medical_cost_discount_pct", 0.20))
            cost = max(10, int(cost * (1.0 - discount_pct)))

        if self.state.gold < cost:
            return {
                "success": False,
                "message": f"Saldo em tesouraria insuficiente. Honorários do especialista: {cost} Ouro. Saldo: {self.state.gold} Ouro."
            }

        self.state.gold -= cost
        hero["injury_weeks_left"] = max(0, hero.get("injury_weeks_left", 1) - 1)
        if hero["injury_weeks_left"] == 0:
            hero["injured"] = False
            hero["status"] = "Apto"
            msg = f"Alta Médica Homologada: {hero['name']} concluiu a intervenção clínica e está liberado para o serviço."
        else:
            msg = f"Tratamento administrado: Licença de {hero['name']} reduzida para {hero['injury_weeks_left']} semana(s) restante(s)."

        return {
            "success": True,
            "message": msg,
            "hero": hero,
            "gold": self.state.gold
        }

    def calculate_injury_treatment_cost(self, hero: dict) -> int:
        """
        Calcula o custo pericial de tratamento e reabilitação médica de um herói.
        Vanguarda absorve impacto frontal pesado: custo 1.30x maior que Suporte.
        """
        base_cost = 100
        from match_engine import get_hero_position
        pos = get_hero_position(hero)
        if pos == "pos_vanguarda":
            return int(base_cost * 1.30)
        elif pos == "pos_suporte":
            return int(base_cost * 0.90)
        elif pos == "pos_suporte_logistico":
            return int(base_cost * 0.80)
        return base_cost


    def collective_banquet(self) -> dict:
        """Banquete de Descompressão Coletiva para toda a equipe."""
        actions = self.facilities_data.get("medical_actions", {})
        banquet_cfg = actions.get("collective_banquet", {"cost": 350, "fatigue_relief_all": 25})
        cost = banquet_cfg.get("cost", 350)
        relief = banquet_cfg.get("fatigue_relief_all", 25)

        if self.state.gold < cost:
            return {
                "success": False,
                "message": f"Recursos orçamentários insuficientes. Custo do banquete: {cost} Ouro. Saldo: {self.state.gold} Ouro."
            }

        self.state.gold -= cost
        for h in self.state.team:
            h["fatigue"] = max(0, h.get("fatigue", 0) - relief)
            if h["fatigue"] < 70 and not h.get("injured"):
                h["status"] = "Apto"
            h["happiness"] = min(100, h.get("happiness", 80) + 10)

        return {
            "success": True,
            "message": f"Banquete Institucional realizado com louvor: Todo o plantel teve sua fadiga aliviada em {relief} pontos.",
            "gold": self.state.gold
        }

    def renew_contract(self, hero_id: str) -> dict:
        """Renova o contrato de temporada de um herói cuja vigência expirou."""
        hero = next((h for h in self.state.team if h["id"] == hero_id), None)
        if not hero:
            return {"success": False, "message": f"Aventureiro '{hero_id}' não encontrado."}

        demand = hero.get("renewal_demand")
        if not demand:
            # Demanda padrão
            curr_salary = hero.get("salary", 50)
            bonus = round(curr_salary * 2)
            demand = {"salary": round(curr_salary * 1.25), "signing_bonus": bonus, "seasons": 2}

        bonus_cost = demand.get("signing_bonus", 100)
        if self.state.gold < bonus_cost:
            return {
                "success": False,
                "message": (
                    f"Recursos insuficientes para pagar o bônus de assinatura (luvas) de {hero['name']}. "
                    f"Exigido: {bonus_cost} Ouro. Saldo: {self.state.gold} Ouro."
                )
            }

        self.state.gold -= bonus_cost
        hero["salary"] = demand.get("salary", hero.get("salary", 50))
        hero["contract_seasons_left"] = demand.get("seasons", 2)
        hero["pending_renewal"] = False
        hero["renewal_demand"] = None
        hero["happiness"] = min(100, hero.get("happiness", 80) + 15)

        # Remove da lista de pendências
        if hasattr(self.state, "pending_contract_renewals"):
            self.state.pending_contract_renewals = [
                r for r in self.state.pending_contract_renewals if r.get("hero_id") != hero_id
            ]

        return {
            "success": True,
            "message": f"Contrato Homologado: Vínculo de {hero['name']} renovado por {hero['contract_seasons_left']} temporadas com salário de ⬡ {hero['salary']}/semana.",
            "hero": hero,
            "gold": self.state.gold
        }

    def release_hero(self, hero_id: str) -> dict:
        """Rescinde amigavelmente o contrato de um herói com indenização rescisória."""
        hero = next((h for h in self.state.team if h["id"] == hero_id), None)
        if not hero:
            return {"success": False, "message": f"Aventureiro '{hero_id}' não encontrado."}

        # Multa rescisória calculada com base no salário e temporadas restantes (50% do valor restante)
        salary = hero.get("salary", 50)
        seasons_left = max(1, hero.get("contract_seasons_left", 1))
        severance = int(salary * seasons_left * 0.5)
        if severance <= 0:
            severance = salary

        if self.state.gold < severance:
            return {
                "success": False,
                "message": f"Recursos financeiros insuficientes para liquidação rescisória. Exigido: {severance} Ouro. Saldo: {self.state.gold} Ouro."
            }

        self.state.gold -= severance
        self.state.weekly_severance_expenses = getattr(self.state, "weekly_severance_expenses", 0) + severance

        self.state.team.remove(hero)
        if hero_id in self.state.starters:
            self.state.starters.remove(hero_id)
        if hero_id in self.state.reserves:
            self.state.reserves.remove(hero_id)

        if hasattr(self.state, "pending_contract_renewals"):
            self.state.pending_contract_renewals = [
                r for r in self.state.pending_contract_renewals if r.get("hero_id") != hero_id
            ]

        return {
            "success": True,
            "message": f"Rescisão Contratual Efetivada: {hero['name']} foi desligado dos quadros da guilda (Multa rescisória de ⬡ {severance} liquidada).",
            "severance_fee": severance,
            "gold": self.state.gold
        }

    # ----------------------------------------------------
    # Academia de Base & Olheiros
    # ----------------------------------------------------
    def get_academy_data(self) -> dict:
        balance = get_balance()
        acad_cfg = balance.get("academy", {})
        return {
            "youth_academy": getattr(self.state, "youth_academy", []),
            "max_slots": acad_cfg.get("max_youth_slots", 4),
            "weekly_maintenance": acad_cfg.get("weekly_maintenance", 40)
        }

    def replenish_academy(self, rng=None):
        if not hasattr(self.state, "youth_academy") or self.state.youth_academy is None:
            self.state.youth_academy = []
        balance = get_balance()
        max_slots = balance.get("academy", {}).get("max_youth_slots", 4)
        while len(self.state.youth_academy) < max_slots:
            y = generate_hero(is_youth=True, rng=rng)
            self.state.youth_academy.append(y)

    def train_youth_academy_weekly(self, rng=None) -> list:
        """
        Avança o ciclo semanal de treinamento dos aprendizes na Academia de Base:
        - Cada semana avança +1 training_weeks.
        - Evolução nos atributos: atributos principais ganham +4 a +6 (+ bônus estelar), secundários ganham +1 a +2.
        - Ao atingir max_training_weeks (4 semanas):
          - maturation_pct = 100
          - is_graduated = True
          - Concede o traço exclusivo 'Graduado com Láurea' (+3 em todos os atributos).
        """
        if rng is None or not hasattr(rng, "randint"):
            rng = random.Random()

        youth_list = getattr(self.state, "youth_academy", [])
        if not youth_list:
            return []

        trained_reports = []
        for y in youth_list:
            if y.get("is_graduated", False) and y.get("maturation_pct", 0) >= 100:
                continue

            max_weeks = y.get("max_training_weeks", get_balance().get("academy", {}).get("training_weeks", 10))
            weeks = y.get("training_weeks", 0) + 1
            y["training_weeks"] = min(max_weeks, weeks)
            y["max_training_weeks"] = max_weeks
            y["maturation_pct"] = min(100, int((y["training_weeks"] / max_weeks) * 100))

            # Crescimento semanal de atributos (TASK-805: calibragem para ciclo de 10 semanas sem inflação)
            stars = y.get("potential", {}).get("star_potential", 3)
            star_bonus = 1 if stars >= 4 else 0
            spec_id = y.get("specialization_id")
            profile = SPEC_PROFILES.get(spec_id, {})
            attrs = y.setdefault("hidden_attributes", {})

            for attr in ["str", "agi", "vit", "int", "wis", "lck"]:
                weight = profile.get(attr, 0.05)
                curr_val = attrs.get(attr, 20)
                if weight >= 0.20:
                    delta = rng.randint(2, 3) + star_bonus
                else:
                    delta = rng.randint(0, 1)
                attrs[attr] = max(1, min(100, curr_val + delta))

            # Graduação completa após 10 semanas
            just_graduated = False
            if y["training_weeks"] >= max_weeks:
                y["is_graduated"] = True
                y["maturation_pct"] = 100
                traits = y.setdefault("traits", [])
                if "Graduado com Láurea" not in traits:
                    traits.append("Graduado com Láurea")
                    just_graduated = True
                    for attr in attrs:
                        attrs[attr] = min(100, attrs[attr] + 2)

            old_power = y.get("current_power", 20)
            new_power = calculate_hero_power(y)
            y["current_power"] = new_power

            trained_reports.append({
                "hero_id": y.get("id"),
                "hero_name": y.get("name"),
                "weeks": y["training_weeks"],
                "maturation_pct": y["maturation_pct"],
                "power_gain": new_power - old_power,
                "current_power": new_power,
                "is_graduated": y["is_graduated"],
                "just_graduated": just_graduated
            })

        return trained_reports

    def promote_youth_apprentice(self, hero_id: str) -> dict:
        balance = get_balance()
        max_team = balance.get("roster", {}).get("max_team_size", 12)
        if len(self.state.team) >= max_team:
            return {
                "success": False,
                "message": f"Capacidade máxima do alojamento atingida: o quadro profissional já possui o limite de {max_team} colaboradores."
            }

        youth_list = getattr(self.state, "youth_academy", [])
        apprentice = next((h for h in youth_list if h["id"] == hero_id), None)
        if not apprentice:
            return {"success": False, "message": f"Aprendiz '{hero_id}' não localizado no alojamento da base."}

        youth_list.remove(apprentice)
        acad_cfg = balance.get("academy", {})
        apprentice["salary"] = acad_cfg.get("promotion_initial_salary", 35)
        apprentice["contract_seasons_left"] = acad_cfg.get("promotion_contract_seasons", 2)
        apprentice["season_appearances"] = 0
        apprentice["happiness"] = 90
        apprentice["pending_renewal"] = False

        is_graduated = apprentice.get("is_graduated", False)
        maturation_pct = apprentice.get("maturation_pct", 0)
        is_early_promotion = not is_graduated or maturation_pct < 100
        apprentice["is_early_promotion"] = is_early_promotion

        self.state.team.append(apprentice)

        max_w = apprentice.get("max_training_weeks", 10)
        if is_graduated and maturation_pct >= 100:
            msg = (
                f"Ordem de Formatura e Promoção com Láurea: O jovem {apprentice['name']} concluiu com êxito "
                f"o programa probatório de {max_w} semanas (100% de maturação) e foi promovido ao quadro profissional com o título 'Graduado com Láurea'!"
            )
        else:
            msg = (
                f"Ordem de Promoção Precoce: O jovem {apprentice['name']} foi promovido prematuramente com apenas "
                f"{maturation_pct}% de maturação ({apprentice.get('training_weeks', 0)}/{max_w} semanas). "
                f"Seus atributos refletem formação abreviada e ele não recebeu o título de láurea da academia."
            )

        return {
            "success": True,
            "message": msg,
            "hero": apprentice,
            "is_early_promotion": is_early_promotion,
            "maturation_pct": maturation_pct,
            "youth_academy": self.state.youth_academy,
            "team": self.state.team
        }

    def dismiss_youth_apprentice(self, hero_id: str) -> dict:
        youth_list = getattr(self.state, "youth_academy", [])
        apprentice = next((h for h in youth_list if h["id"] == hero_id), None)
        if not apprentice:
            return {"success": False, "message": f"Aprendiz '{hero_id}' não localizado."}

        youth_list.remove(apprentice)
        return {
            "success": True,
            "message": f"Desligamento Homologado: O jovem {apprentice['name']} foi dispensado da formação de base da guilda.",
            "youth_academy": self.state.youth_academy
        }

    # ----------------------------------------------------
    # Mercado de Transferências & Agentes Livres
    # ----------------------------------------------------
    def get_transfer_market_data(self) -> dict:
        balance = get_balance()
        t_cfg = balance.get("transfer_market", {})
        r_cfg = balance.get("roster", {})
        return {
            "listings": getattr(self.state, "transfer_market_listings", []),
            "scout_fee": t_cfg.get("scout_fee", 150),
            "current_team_size": len(self.state.team),
            "max_team_size": r_cfg.get("max_team_size", 12)
        }

    def refresh_transfer_market(self, rng=None) -> list:
        balance = get_balance()
        count = balance.get("transfer_market", {}).get("listings_count", 5)
        new_listings = [generate_hero(is_youth=False, rng=rng) for _ in range(count)]
        self.state.transfer_market_listings = new_listings
        return new_listings

    def scout_market_hero(self, hero_id: str) -> dict:
        listings = getattr(self.state, "transfer_market_listings", [])
        hero = next((h for h in listings if h["id"] == hero_id), None)
        if not hero:
            return {"success": False, "message": f"Aventureiro '{hero_id}' não catalogado na bolsa de transferências."}

        if hero.get("potential", {}).get("is_potential_revealed", False):
            return {"success": False, "message": f"Laudo Pericial já emitido: O potencial de {hero['name']} já foi auditado."}

        balance = get_balance()
        fee = balance.get("transfer_market", {}).get("scout_fee", 150)
        if self.state.gold < fee:
            return {
                "success": False,
                "message": f"Tesouraria insuficiente. Honorários de auditoria pericial exigem {fee} Ouro. Saldo: {self.state.gold} Ouro."
            }

        self.state.gold -= fee
        hero["potential"]["is_potential_revealed"] = True

        stars = hero["potential"].get("star_potential", 3)
        return {
            "success": True,
            "message": f"Laudo de Olheiro Homologado: A auditoria pericial concluiu que {hero['name']} possui Potencial de {stars} Estrelas.",
            "hero": hero,
            "gold": self.state.gold
        }

    def hire_market_hero(self, hero_id: str) -> dict:
        balance = get_balance()
        max_team = balance.get("roster", {}).get("max_team_size", 12)
        if len(self.state.team) >= max_team:
            return {
                "success": False,
                "message": f"Capacidade máxima do plantel atingida ({max_team} heróis). Rescinda contratos antes de novas aquisições."
            }

        listings = getattr(self.state, "transfer_market_listings", [])
        hero = next((h for h in listings if h["id"] == hero_id), None)
        if not hero:
            return {"success": False, "message": f"Aventureiro '{hero_id}' não disponível para contratação."}

        from match_engine import get_hero_position
        pos = get_hero_position(hero)
        # Contratação de Suporte Logístico deduz custo oculto de recrutamento (turnover): +40 ouro
        hidden_recruitment_cost = 40 if pos == "pos_suporte_logistico" else 0

        fee = hero.get("transfer_fee", 200)
        total_cost = fee + hidden_recruitment_cost

        if self.state.gold < total_cost:
            return {
                "success": False,
                "message": f"Recursos financeiros insuficientes. Custo de aquisição de {hero['name']}: {total_cost} Ouro. Saldo: {self.state.gold} Ouro."
            }

        self.state.gold -= total_cost
        self.state.weekly_hiring_expenses = getattr(self.state, "weekly_hiring_expenses", 0) + total_cost

        listings.remove(hero)
        hero["contract_seasons_left"] = balance.get("transfer_market", {}).get("contract_duration_seasons", 2)
        hero["season_appearances"] = 0
        hero["happiness"] = 85
        hero["pending_renewal"] = False
        self.state.team.append(hero)

        return {
            "success": True,
            "message": f"Contrato de Aquisição Homologado: {hero['name']} foi integrado ao quadro profissional da guilda.",
            "hero": hero,
            "total_cost": total_cost,
            "gold": self.state.gold,
            "team": self.state.team,
            "transfer_market_listings": self.state.transfer_market_listings
        }

    # ----------------------------------------------------
    # Envelhecimento & Evolução Anual
    # ----------------------------------------------------
    def process_annual_development_and_aging(self, rng=None) -> dict:
        if rng is None:
            rng = random.Random()
        balance = get_balance()
        dev_cfg = balance.get("development", {})
        growth_max_age = dev_cfg.get("growth_age_max", 28)
        decline_min_age = dev_cfg.get("decline_age_min", 32)
        min_appearances = dev_cfg.get("min_appearances_for_growth", 8)

        evolved_heroes = []
        declined_heroes = []

        for hero in self.state.team:
            old_age = hero.get("age", 22)
            hero["age"] = old_age + 1
            curr_power = hero.get("current_power", 50)

            # Jovem em desenvolvimento
            if hero["age"] <= growth_max_age and hero.get("season_appearances", 0) >= min_appearances:
                stars = hero.get("potential", {}).get("star_potential", 3)
                growth_pts = max(1, min(3, stars - 1))
                attrs = hero.get("hidden_attributes", {})
                spec_id = hero.get("specialization_id")
                profile = SPEC_PROFILES.get(spec_id, {})

                for attr, weight in profile.items():
                    if weight >= 0.20 and attr in attrs:
                        attrs[attr] = min(100, attrs[attr] + growth_pts)

                new_power = calculate_hero_power(hero)
                hero["current_power"] = new_power
                evolved_heroes.append({
                    "hero_name": hero["name"],
                    "age": hero["age"],
                    "old_power": curr_power,
                    "new_power": new_power
                })

            # Veterano em declínio físico
            elif hero["age"] >= decline_min_age:
                attrs = hero.get("hidden_attributes", {})
                for attr in ["str", "agi", "vit"]:
                    if attr in attrs:
                        attrs[attr] = max(10, attrs[attr] - rng.randint(1, 2))
                new_power = calculate_hero_power(hero)
                hero["current_power"] = new_power
                declined_heroes.append({
                    "hero_name": hero["name"],
                    "age": hero["age"],
                    "old_power": curr_power,
                    "new_power": new_power
                })

        # Processamento na Academia de Base
        graduated_count = 0
        if hasattr(self.state, "youth_academy"):
            remaining_youth = []
            for y in self.state.youth_academy:
                y["age"] = y.get("age", 17) + 1
                if y["age"] > 18:
                    graduated_count += 1
                else:
                    remaining_youth.append(y)
            self.state.youth_academy = remaining_youth
            self.replenish_academy(rng=rng)

        return {
            "evolved": evolved_heroes,
            "declined": declined_heroes,
            "graduated_youth": graduated_count
        }
