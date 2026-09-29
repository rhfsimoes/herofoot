"""
HeroFoot Crown Service Module.
Gerencia as Metas da Coroa (KPIs da Coroa / Conselho das Guildas),
auditorias periciais trimestrais, subsídios de fomento e multas fiscais.
"""

from typing import Dict, Any, Optional
from balance import get_balance


def init_crown_goals(state: Any, league_engine: Optional[Any] = None) -> None:
    """Inicializa a estrutura de metas da Coroa no GameState se ainda não existir."""
    balance = get_balance()
    crown_cfg = balance.get("crown_goals", {})
    cycle_length = crown_cfg.get("cycle_length_weeks", 8)

    starting_pts = 0
    if league_engine and hasattr(league_engine, "get_standings"):
        st = league_engine.get_standings()
        player_guild = next(
            (g for g in st if g.get("is_player") or g.get("guild_name") in ["Sua Guilda", "Guilda do Jogador"] or g.get("name") in ["Sua Guilda", "Guilda do Jogador"]),
            None
        )
        if player_guild:
            starting_pts = player_guild.get("points", 0)

    state.crown_goals = {
        "current_cycle": 1,
        "cycle_start_week": 1,
        "cycle_deadline_week": cycle_length,
        "starting_league_points": starting_pts,
        "last_audit_report": None,
        "audit_history": [],
    }


def get_crown_goals_data(state: Any, league_engine: Optional[Any] = None) -> Dict[str, Any]:
    """Retorna os dados em tempo real das Metas da Coroa para o trimestre fiscal vigente."""
    if not hasattr(state, "crown_goals") or not isinstance(state.crown_goals, dict) or "current_cycle" not in state.crown_goals:
        init_crown_goals(state, league_engine)

    balance = get_balance()
    crown_cfg = balance.get("crown_goals", {})
    cycle_length = crown_cfg.get("cycle_length_weeks", 8)
    subsidy_reward = crown_cfg.get("subsidy_reward_base", 400)
    penalty_tax = crown_cfg.get("penalty_tax_base", 200)
    min_goals_to_pass = crown_cfg.get("min_goals_to_pass", 2)
    targets = crown_cfg.get("quarterly_targets", {})

    min_gold = targets.get("min_gold", 1000)
    min_pts = targets.get("min_cycle_league_points", 8)
    max_inj = targets.get("max_injured_heroes", 0)

    # 1. Pontos na Liga obtidos durante o trimestre atual
    current_league_pts = 0
    if league_engine and hasattr(league_engine, "get_standings"):
        st = league_engine.get_standings()
        player_guild = next(
            (g for g in st if g.get("is_player") or g.get("guild_name") in ["Sua Guilda", "Guilda do Jogador"] or g.get("name") in ["Sua Guilda", "Guilda do Jogador"]),
            None
        )
        if player_guild:
            current_league_pts = player_guild.get("points", 0)

    starting_pts = state.crown_goals.get("starting_league_points", 0)
    pts_in_cycle = max(0, current_league_pts - starting_pts)

    # 2. Heróis lesionados / afastados
    injured_count = sum(1 for h in getattr(state, "team", []) if h.get("status") == "Afastado" or h.get("injured", False))

    current_gold = getattr(state, "gold", 0)

    goals = [
        {
            "id": "financial_solvency",
            "title": "Superávit e Solvência de Caixa",
            "description": f"Manter saldo em caixa de pelo menos {min_gold} Moedas de Ouro no encerramento pericial.",
            "target": min_gold,
            "current": current_gold,
            "unit": "Ouro",
            "completed": current_gold >= min_gold,
        },
        {
            "id": "league_performance",
            "title": "Eficácia Competitiva na Liga",
            "description": f"Conquistar pelo menos {min_pts} pontos na Liga das Guildas durante o trimestre fiscal.",
            "target": min_pts,
            "current": pts_in_cycle,
            "unit": "Pontos",
            "completed": pts_in_cycle >= min_pts,
        },
        {
            "id": "operational_health",
            "title": "Conformidade e Segurança Ocupacional",
            "description": f"Apresentar no máximo {max_inj} herói(s) afastado(s) por lesão na auditoria do Conselho.",
            "target": max_inj,
            "current": injured_count,
            "unit": "Afastados",
            "completed": injured_count <= max_inj,
        },
    ]

    completed_count = sum(1 for g in goals if g["completed"])
    deadline_week = state.crown_goals.get("cycle_deadline_week", 8)
    curr_week = getattr(state, "week", 1)

    return {
        "current_cycle": state.crown_goals.get("current_cycle", 1),
        "cycle_start_week": state.crown_goals.get("cycle_start_week", 1),
        "cycle_deadline_week": deadline_week,
        "weeks_remaining": max(0, deadline_week - curr_week),
        "is_audit_week": (curr_week == deadline_week),
        "min_goals_to_pass": min_goals_to_pass,
        "subsidy_reward": subsidy_reward,
        "penalty_tax": penalty_tax,
        "goals": goals,
        "goals_completed_count": completed_count,
        "last_audit_report": state.crown_goals.get("last_audit_report"),
        "audit_history": state.crown_goals.get("audit_history", []),
    }


def process_quarterly_audit(state: Any, league_engine: Optional[Any] = None) -> Optional[Dict[str, Any]]:
    """
    Executa a auditoria pericial do Conselho da Coroa no término do trimestre fiscal.
    Aplica bônus de subsídio ou sanção tributária conforme o cumprimento das metas.
    """
    data = get_crown_goals_data(state, league_engine)
    deadline_week = data["cycle_deadline_week"]
    curr_week = getattr(state, "week", 1)

    if curr_week < deadline_week:
        return None

    completed_count = data["goals_completed_count"]
    min_to_pass = data["min_goals_to_pass"]
    passed = (completed_count >= min_to_pass)

    if passed:
        delta_gold = data["subsidy_reward"]
        status = "Aprovado"
        headline = "Decreto de Louvor Imperial: Metas Operacionais Homologadas com Sucesso."
    else:
        delta_gold = -data["penalty_tax"]
        status = "Autuado"
        headline = "Autuação Fiscal da Coroa: Descumprimento de Diretrizes e Retenção Tributária."

    audit_report = {
        "cycle": data["current_cycle"],
        "audit_week": curr_week,
        "status": status,
        "passed": passed,
        "goals_completed": completed_count,
        "total_goals": len(data["goals"]),
        "delta_gold": delta_gold,
        "headline": headline,
        "details": [
            {
                "title": g["title"],
                "target": g["target"],
                "current": g["current"],
                "unit": g["unit"],
                "completed": g["completed"],
            }
            for g in data["goals"]
        ],
    }

    state.crown_goals["last_audit_report"] = audit_report
    if "audit_history" not in state.crown_goals:
        state.crown_goals["audit_history"] = []
    state.crown_goals["audit_history"].append(audit_report)

    # Avança para o próximo ciclo trimestral
    balance = get_balance()
    crown_cfg = balance.get("crown_goals", {})
    cycle_length = crown_cfg.get("cycle_length_weeks", 8)

    current_league_pts = 0
    if league_engine and hasattr(league_engine, "get_standings"):
        st = league_engine.get_standings()
        player_guild = next(
            (g for g in st if g.get("is_player") or g.get("guild_name") in ["Sua Guilda", "Guilda do Jogador"] or g.get("name") in ["Sua Guilda", "Guilda do Jogador"]),
            None
        )
        if player_guild:
            current_league_pts = player_guild.get("points", 0)

    next_cycle = data["current_cycle"] + 1
    next_start_week = curr_week + 1
    next_deadline = next_start_week + cycle_length - 1

    state.crown_goals["current_cycle"] = next_cycle
    state.crown_goals["cycle_start_week"] = next_start_week
    state.crown_goals["cycle_deadline_week"] = next_deadline
    state.crown_goals["starting_league_points"] = current_league_pts

    return audit_report
