"""
HeroFoot Medical Service Module.
Gerencia o Departamento de Saúde & Bem-Estar Ocupacional, Enfermaria,
tratamentos de reabilitação e passivos médicos de Vanguardas conforme Contrato Canônico.
"""

import os
import json
from typing import Dict, Any, Optional
from balance import get_balance

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')


def load_facilities_seed() -> dict:
    path = os.path.join(DATA_DIR, 'facilities_seed.json')
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {"medical_facilities": [], "medical_actions": {}}


def load_classes_seed() -> dict:
    path = os.path.join(DATA_DIR, 'classes_seed.json')
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {"positions": [], "specializations": []}


FACILITIES_DATA = load_facilities_seed()
CLASSES_DATA = load_classes_seed()


class MedicalService:
    def __init__(self, state: Any):
        self.state = state
        self.facilities_data = FACILITIES_DATA

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

    def calculate_injury_treatment_cost(self, hero: dict) -> int:
        """
        Calcula o custo de intervenção clínica para acelerar a lesão de um herói.
        Aplica o multiplicador de passivo médico da Vanguarda (1.30) e desconto de Suporte ativo.
        """
        actions = self.facilities_data.get("medical_actions", {})
        action_cfg = actions.get("accelerate_injury", {"cost": 180, "weeks_reduced": 1})
        base_cost = action_cfg.get("cost", 180)

        balance = get_balance()
        pos_mods = balance.get("position_market_modifiers", {})

        pos_id = hero.get("position_id")
        if not pos_id:
            from match_engine import get_hero_position
            pos_id = get_hero_position(hero)

        cost_mult = pos_mods.get(pos_id, {}).get("medical_treatment_cost_multiplier", 1.0)
        cost = int(round(base_cost * cost_mult))

        # Benefício de Medicina Ocupacional: Heróis ativos da posição Suporte reduzem custos clínicos
        has_active_support = any(
            (h.get("position_id") == "pos_suporte" or h.get("position") == "Suporte")
            and h.get("status") != "Afastado" and not h.get("injured", False)
            for h in getattr(self.state, "team", [])
        )
        if has_active_support:
            sup_mod = pos_mods.get("pos_suporte", {})
            discount_pct = float(sup_mod.get("medical_discount_pct", 0.20))
            cost = max(10, int(cost * (1.0 - discount_pct)))

        return cost

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

        self.state.weekly_medical_expenses = getattr(self.state, "weekly_medical_expenses", 0) + cost

        return {
            "success": True,
            "message": f"Sessão de Banhos Termais concluída: {hero['name']} recuperou {relief} pontos de fadiga.",
            "hero": hero,
            "gold": self.state.gold
        }

    def accelerate_hero_injury(self, hero_id: str) -> dict:
        """Tratamento Alquímico Especializado para acelerar recuperação de lesão com tarifação por posição."""
        hero = next((h for h in self.state.team if h["id"] == hero_id), None)
        if not hero:
            return {"success": False, "message": f"Aventureiro '{hero_id}' não localizado."}

        if not hero.get("injured") or hero.get("injury_weeks_left", 0) <= 0:
            return {"success": False, "message": f"{hero['name']} não possui atestado médico ativo de afastamento."}

        cost = self.calculate_injury_treatment_cost(hero)

        if self.state.gold < cost:
            return {
                "success": False,
                "message": f"Saldo em tesouraria insuficiente. Honorários do especialista: {cost} Ouro. Saldo: {self.state.gold} Ouro."
            }

        self.state.gold -= cost
        self.state.weekly_medical_expenses = getattr(self.state, "weekly_medical_expenses", 0) + cost

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
            "cost": cost,
            "gold": self.state.gold
        }

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
        self.state.weekly_medical_expenses = getattr(self.state, "weekly_medical_expenses", 0) + cost

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
