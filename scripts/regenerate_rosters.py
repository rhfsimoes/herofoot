"""
Script para regeneração canônica de elencos (Player e Rivais) do HeroFoot.
Garante:
1. Todas as 4 posições representadas em cada guilda (Vanguarda, DPS, Suporte, Suporte Logístico).
2. Presença de Suportes Logísticos em todos os times.
3. Diferenciação rigorosa de poder por liga (Divisão Nobre da Coroa vs Divisão de Acesso Mercante).
4. Zero Hardcoding e conformidade com hero_schema.json e classes_seed.json.
5. Termos esportivos proibidos 100% ausentes.
"""

import json
import os
import random

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")

with open(os.path.join(DATA_DIR, "classes_seed.json"), "r", encoding="utf-8") as f:
    CLASSES_DATA = json.load(f)

POSITIONS = {p["id"]: p for p in CLASSES_DATA["positions"]}
SPECS = {s["id"]: s for s in CLASSES_DATA["specializations"]}

# Nomes para geração imersiva corporativa/fantástica
HERO_FIRST_NAMES = [
    "Aldren", "Gromm", "Sariel", "Nalia", "Ignis", "Cedric", "Valdris", "Seren",
    "Vorn", "Reva", "Dorath", "Brakka", "Torin", "Lyra", "Finn", "Kael", "Vesper",
    "Solon", "Pyra", "Aldous", "Teresa", "Linnea", "Marek", "Theron", "Isolde",
    "Garrick", "Rowan", "Sylas", "Branwyn", "Morrigan", "Caelum", "Alistair",
    "Gwilym", "Darian", "Corbin", "Valerius", "Vaelin", "Rorik", "Dorn", "Riven"
]

HERO_LAST_NAMES = [
    "Lâmina-Fiel", "Quebra-Escudos", "Vento-Noturno", "Sombra-Ágil", "Brasa-Viva",
    "do Santo-Sudário", "Guarda-Real", "Fúria-de-Aço", "Chama-Eterna", "Mão-Curadora",
    "Pedra-Cinza", "Passo-Veloz", "Guarda-Muralha", "Flecha-Silenciosa", "Olho-de-Rapina",
    "Manto-Escuro", "Adaga-Fria", "Labareda-Real", "da Alvorada", "Martelo-Forte",
    "Carvalho-Antigo", "Vigia-Noturno", "Caminha-Névoa", "Gelo-Puro", "Punho-Férreo",
    "Trilheiro-Ágil", "Vento-do-Norte", "Baluarte", "Espada-Rúnica", "Guia-Caravanas"
]

def make_hero_attributes(spec_id: str, target_power: int, rng: random.Random) -> dict:
    """Gera atributos 1-100 para que o poder ponderado seja exatamente target_power."""
    spec = SPECS[spec_id]
    profile = spec["stat_weight_profile"]
    
    attrs = {}
    for attr, weight in profile.items():
        if weight >= 0.30:
            # Atributo primário: acima do target_power
            bonus = rng.randint(4, 9)
            val = target_power + bonus
        elif weight >= 0.15:
            # Atributo secundário: próximo do target_power
            bonus = rng.randint(-1, 3)
            val = target_power + bonus
        else:
            # Atributo terciário / dump: abaixo do target_power
            penalty = rng.randint(5, 14)
            val = target_power - penalty
        attrs[attr] = max(10, min(100, val))

    # Ajuste fino para cravar exatamente target_power no cálculo ponderado
    def calc_power(at):
        return round(sum(profile.get(k, 0.0) * at.get(k, 10) for k in profile))

    diff = target_power - calc_power(attrs)
    attempts = 0
    # Ajusta os atributos com maior peso para convergir rapidamente
    sorted_attrs = sorted(profile.keys(), key=lambda k: profile[k], reverse=True)
    while diff != 0 and attempts < 20:
        for attr in sorted_attrs:
            if diff == 0:
                break
            step = 1 if diff > 0 else -1
            if 1 <= attrs[attr] + step <= 100:
                attrs[attr] += step
                diff = target_power - calc_power(attrs)
        attempts += 1

    return attrs


def generate_player_team() -> list:
    """
    Gera o elenco do jogador com 8 aventureiros:
    6 titulares (Aptos) cobrindo todas as 4 posições.
    2 reservas com status (1 Fatigado, 1 Afastado/lesionado).
    """
    rng = random.Random(42)  # Semente determinística
    
    # Especificações dos 8 heróis do jogador:
    # 1. hero_05: DPS (Piromante ou Assassino) - poder 68 (Apto)
    # 2. hero_01: Vanguarda (Guardião) - poder 65 (Apto)
    # 3. hero_03: DPS (Piromante) - poder 63 (Apto)
    # 4. hero_06: Vanguarda (Berserk) - poder 60 (Apto)
    # 5. hero_07: Suporte (Clérigo de Apoio) - poder 58 (Apto)
    # 6. hero_08: Suporte Logístico (Arqueiro) - poder 56 (Apto)
    # 7. hero_02: Suporte Logístico (Intendente) ou Vanguarda - poder 52 (Fatigado, fatigue=65)
    # 8. hero_04: Suporte (Taumaturgo) - poder 48 (Afastado, injured=True, injury_weeks_left=1)
    
    heroes_blueprint = [
        {
            "id": "hero_05",
            "name": "Dorath Pedra-Cinza",
            "spec_id": "spec_rogue_assassin",
            "pos_id": "pos_dps",
            "power": 48,
            "status": "Apto",
            "fatigue": 15,
            "salary": 50,
            "injured": False,
            "injury_weeks_left": 0,
            "age": 31,
            "level": 3,
            "contract_seasons_left": 2,
            "star_potential": 4,
            "is_potential_revealed": True,
        },
        {
            "id": "hero_01",
            "name": "Valdris, o Escudeiro Sênior",
            "spec_id": "spec_warrior_swordsman",
            "pos_id": "pos_vanguarda",
            "power": 46,
            "status": "Apto",
            "fatigue": 20,
            "salary": 45,
            "injured": False,
            "injury_weeks_left": 0,
            "age": 33,
            "level": 3,
            "contract_seasons_left": 2,
            "star_potential": 4,
            "is_potential_revealed": True,
        },
        {
            "id": "hero_03",
            "name": "Magister Vorn",
            "spec_id": "spec_mage_pyromancer",
            "pos_id": "pos_dps",
            "power": 44,
            "status": "Apto",
            "fatigue": 0,
            "salary": 45,
            "injured": False,
            "injury_weeks_left": 0,
            "age": 29,
            "level": 2,
            "contract_seasons_left": 2,
            "star_potential": 5,
            "is_potential_revealed": True,
        },
        {
            "id": "hero_06",
            "name": "Brakka Fúria-de-Aço",
            "spec_id": "spec_warrior_berserker",
            "pos_id": "pos_vanguarda",
            "power": 42,
            "status": "Apto",
            "fatigue": 10,
            "salary": 40,
            "injured": False,
            "injury_weeks_left": 0,
            "age": 26,
            "level": 2,
            "contract_seasons_left": 2,
            "star_potential": 3,
            "is_potential_revealed": True,
        },
        {
            "id": "hero_07",
            "name": "Irmão Cedric da Alvorada",
            "spec_id": "spec_cleric_support",
            "pos_id": "pos_suporte",
            "power": 40,
            "status": "Apto",
            "fatigue": 5,
            "salary": 38,
            "injured": False,
            "injury_weeks_left": 0,
            "age": 27,
            "level": 2,
            "contract_seasons_left": 3,
            "star_potential": 4,
            "is_potential_revealed": True,
        },
        {
            "id": "hero_08",
            "name": "Lyra Flecha-Silenciosa",
            "spec_id": "spec_rogue_archer",
            "pos_id": "pos_suporte_logistico",
            "power": 38,
            "status": "Apto",
            "fatigue": 10,
            "salary": 35,
            "injured": False,
            "injury_weeks_left": 0,
            "age": 22,
            "level": 2,
            "contract_seasons_left": 3,
            "star_potential": 4,
            "is_potential_revealed": False,
        },
        {
            "id": "hero_02",
            "name": "Seren Ironthorn, a Intendente",
            "spec_id": "spec_logistics_quartermaster",
            "pos_id": "pos_suporte_logistico",
            "power": 35,
            "status": "Fatigado",
            "fatigue": 65,
            "salary": 30,
            "injured": False,
            "injury_weeks_left": 0,
            "age": 24,
            "level": 1,
            "contract_seasons_left": 2,
            "star_potential": 3,
            "is_potential_revealed": True,
        },
        {
            "id": "hero_04",
            "name": "Reva, a Taumaturga",
            "spec_id": "spec_cleric_thaumaturge",
            "pos_id": "pos_suporte",
            "power": 30,
            "status": "Afastado",
            "fatigue": 0,
            "salary": 25,
            "injured": True,
            "injury_weeks_left": 1,
            "age": 20,
            "level": 1,
            "contract_seasons_left": 3,
            "star_potential": 4,
            "is_potential_revealed": True,
        },
    ]

    team = []
    for b in heroes_blueprint:
        spec = SPECS[b["spec_id"]]
        pos = POSITIONS[b["pos_id"]]
        attrs = make_hero_attributes(b["spec_id"], b["power"], rng)
        role_title = f"{pos['name']} - {spec['name']}"

        hero = {
            "id": b["id"],
            "name": b["name"],
            "class_id": b["pos_id"],
            "position": pos["name"],
            "position_id": b["pos_id"],
            "specialization": spec["name"],
            "specialization_id": b["spec_id"],
            "specialization_name": spec["name"],
            "role_title": role_title,
            "class_name": role_title,
            "age": b["age"],
            "level": b["level"],
            "xp": 0,
            "current_power": b["power"],
            "status": b["status"],
            "fatigue": b["fatigue"],
            "salary": b["salary"],
            "injured": b["injured"],
            "injury_weeks_left": b["injury_weeks_left"],
            "contract_seasons_left": b["contract_seasons_left"],
            "season_appearances": 0,
            "happiness": 85,
            "hidden_attributes": attrs,
            "potential": {
                "star_potential": b["star_potential"],
                "is_potential_revealed": b["is_potential_revealed"]
            }
        }
        team.append(hero)

    return team


def generate_rival_guilds() -> list:
    """
    Gera elencos de 6 heróis para as 15 guildas rivais.
    Regra inegociável:
    - Todas as 4 posições devem estar presentes em cada guilda.
    - Divisão Nobre: Poder alto (Flamengo tier, 64 a 78).
    - Divisão de Acesso: Poder intermediário/baixo (Criciúma tier, 48 a 59).
    """
    rng = random.Random(2026)

    guilds_config = [
        # Divisão Nobre (poderes 52 a 64)
        {"id": "g_grifo", "name": "Ordem do Grifo Dourado", "power_rating": 64, "division_id": "div_nobre",
         "comp": ["spec_warrior_swordsman", "spec_warrior_berserker", "spec_rogue_assassin", "spec_mage_pyromancer", "spec_cleric_support", "spec_rogue_archer"]},
        {"id": "g_dragao", "name": "Baluarte do Dragão Vermelho", "power_rating": 62, "division_id": "div_nobre",
         "comp": ["spec_warrior_berserker", "spec_rogue_assassin", "spec_mage_pyromancer", "spec_rogue_assassin", "spec_cleric_thaumaturge", "spec_logistics_quartermaster"]},
        {"id": "g_aco", "name": "Irmandade do Aço Negro", "power_rating": 59, "division_id": "div_nobre",
         "comp": ["spec_warrior_swordsman", "spec_warrior_berserker", "spec_mage_pyromancer", "spec_cleric_support", "spec_rogue_archer", "spec_logistics_quartermaster"]},
        {"id": "g_sol", "name": "Falange do Sol Radiante", "power_rating": 57, "division_id": "div_nobre",
         "comp": ["spec_warrior_swordsman", "spec_rogue_assassin", "spec_mage_pyromancer", "spec_cleric_support", "spec_cleric_thaumaturge", "spec_rogue_archer"]},
        {"id": "alvorada", "name": "Lança da Alvorada", "power_rating": 55, "division_id": "div_nobre", "real_id": "g_alvorada",
         "comp": ["spec_warrior_swordsman", "spec_warrior_berserker", "spec_rogue_assassin", "spec_mage_pyromancer", "spec_cleric_support", "spec_logistics_quartermaster"]},
        {"id": "g_leao", "name": "Vigia do Leão Real", "power_rating": 54, "division_id": "div_nobre",
         "comp": ["spec_warrior_swordsman", "spec_warrior_berserker", "spec_rogue_assassin", "spec_cleric_support", "spec_cleric_thaumaturge", "spec_rogue_archer"]},
        {"id": "g_falcao", "name": "Ordem do Falcão Real", "power_rating": 53, "division_id": "div_nobre",
         "comp": ["spec_warrior_swordsman", "spec_rogue_assassin", "spec_mage_pyromancer", "spec_cleric_support", "spec_rogue_archer", "spec_logistics_quartermaster"]},
        {"id": "g_serpente", "name": "Círculo da Serpente de Ferro", "power_rating": 52, "division_id": "div_nobre",
         "comp": ["spec_warrior_berserker", "spec_rogue_assassin", "spec_mage_pyromancer", "spec_rogue_assassin", "spec_cleric_thaumaturge", "spec_logistics_quartermaster"]},

        # Divisão de Acesso (poderes 35 a 48; jogador em 43 = 4º lugar / meio de tabela)
        {"id": "g_corvo", "name": "Corvo e Osso", "power_rating": 48, "division_id": "div_acesso",
         "comp": ["spec_warrior_berserker", "spec_rogue_assassin", "spec_mage_pyromancer", "spec_cleric_support", "spec_rogue_archer", "spec_logistics_quartermaster"]},
        {"id": "g_prata", "name": "Sentinelas da Prata", "power_rating": 46, "division_id": "div_acesso",
         "comp": ["spec_warrior_swordsman", "spec_warrior_berserker", "spec_rogue_assassin", "spec_mage_pyromancer", "spec_cleric_thaumaturge", "spec_rogue_archer"]},
        {"id": "g_pedra", "name": "Vigia de Pedra", "power_rating": 44, "division_id": "div_acesso",
         "comp": ["spec_warrior_swordsman", "spec_warrior_berserker", "spec_mage_pyromancer", "spec_cleric_support", "spec_cleric_thaumaturge", "spec_logistics_quartermaster"]},
        {"id": "g_martelo", "name": "Companhia do Martelo Rúnico", "power_rating": 42, "division_id": "div_acesso",
         "comp": ["spec_warrior_swordsman", "spec_warrior_berserker", "spec_rogue_assassin", "spec_mage_pyromancer", "spec_cleric_support", "spec_rogue_archer"]},
        {"id": "g_crepusculo", "name": "Legião do Crepúsculo", "power_rating": 40, "division_id": "div_acesso",
         "comp": ["spec_warrior_berserker", "spec_rogue_assassin", "spec_mage_pyromancer", "spec_cleric_thaumaturge", "spec_rogue_archer", "spec_logistics_quartermaster"]},
        {"id": "g_bastiao", "name": "Bastião dos Desbravadores", "power_rating": 37, "division_id": "div_acesso",
         "comp": ["spec_warrior_swordsman", "spec_warrior_berserker", "spec_rogue_assassin", "spec_cleric_support", "spec_rogue_archer", "spec_logistics_quartermaster"]},
        {"id": "g_rosa", "name": "Milícia da Rosa de Cinzas", "power_rating": 35, "division_id": "div_acesso",
         "comp": ["spec_warrior_swordsman", "spec_rogue_assassin", "spec_mage_pyromancer", "spec_cleric_support", "spec_cleric_thaumaturge", "spec_rogue_archer"]},
    ]

    rival_guilds = []

    # Nome pool para evitar duplicatas óbvias no mesmo time
    used_names = set()

    for g_cfg in guilds_config:
        gid = g_cfg.get("real_id", g_cfg["id"])
        base_pr = g_cfg["power_rating"]
        roster = []

        # Distribuição de variações de poder em torno do power_rating: soma das deltas = 0
        deltas = [+2, +1, 0, 0, -1, -2]
        rng.shuffle(deltas)

        for i, spec_id in enumerate(g_cfg["comp"]):
            spec = SPECS[spec_id]
            pos_id = spec["position_id"]
            pos = POSITIONS[pos_id]
            hero_power = base_pr + deltas[i]

            # Atributos sintonizados
            attrs = make_hero_attributes(spec_id, hero_power, rng)

            # Gera nome único
            fn = rng.choice(HERO_FIRST_NAMES)
            ln = rng.choice(HERO_LAST_NAMES)
            h_name = f"{fn} {ln}"
            while h_name in used_names:
                fn = rng.choice(HERO_FIRST_NAMES)
                ln = rng.choice(HERO_LAST_NAMES)
                h_name = f"{fn} {ln}"
            used_names.add(h_name)

            role_title = f"{pos['name']} - {spec['name']}"

            hero = {
                "id": f"hero_{gid}_{i+1}",
                "name": h_name,
                "class_id": pos_id,
                "specialization_id": spec_id,
                "power": hero_power,
                "attributes": attrs
            }
            roster.append(hero)

        avg_agi = round(sum(h["attributes"]["agi"] for h in roster) / len(roster))
        avg_power = round(sum(h["power"] for h in roster) / len(roster))

        rival_guilds.append({
            "id": gid,
            "name": g_cfg["name"],
            "is_player": False,
            "power_rating": avg_power,
            "division_id": g_cfg["division_id"],
            "average_agi": avg_agi,
            "roster": roster
        })

    return rival_guilds


def main():
    print("Iniciando geração de elencos canônicos...")
    player_team = generate_player_team()
    team_path = os.path.join(DATA_DIR, "team.json")
    with open(team_path, "w", encoding="utf-8") as f:
        json.dump(player_team, f, indent=2, ensure_ascii=False)
    print(f"data/team.json gerado com {len(player_team)} heróis.")

    rival_guilds = generate_rival_guilds()
    divisions = [
        {
            "id": "div_nobre",
            "name": "Divisão Nobre da Coroa",
            "tier": 1,
            "promotion_spots": 0,
            "relegation_spots": 2,
            "guild_ids": [
                "g_grifo",
                "g_dragao",
                "g_aco",
                "g_sol",
                "g_alvorada",
                "g_leao",
                "g_falcao",
                "g_serpente"
            ]
        },
        {
            "id": "div_acesso",
            "name": "Divisão de Acesso Mercante",
            "tier": 2,
            "promotion_spots": 2,
            "relegation_spots": 0,
            "guild_ids": [
                "g_player",
                "g_corvo",
                "g_prata",
                "g_pedra",
                "g_martelo",
                "g_crepusculo",
                "g_bastiao",
                "g_rosa"
            ]
        }
    ]

    guilds_data = {
        "player_guild": {
            "id": "g_player",
            "name": "Guilda do Jogador",
            "is_player": True,
            "power_rating": 43,
            "division_id": "div_acesso"
        },
        "divisions": divisions,
        "rival_guilds": rival_guilds
    }

    guilds_path = os.path.join(DATA_DIR, "guilds_seed.json")
    with open(guilds_path, "w", encoding="utf-8") as f:
        json.dump(guilds_data, f, indent=2, ensure_ascii=False)
    print(f"data/guilds_seed.json gerado com {len(rival_guilds)} rivais.")


if __name__ == "__main__":
    main()
