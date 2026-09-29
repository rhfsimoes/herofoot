import json
import os

DIVISIONS = [
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
            "g_serpente",
        ],
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
            "g_rosa",
        ],
    },
]

RIVAL_SPECS = [
    ("spec_warrior_swordsman", "class_warrior"),
    ("spec_warrior_berserker", "class_warrior"),
    ("spec_rogue_archer", "class_rogue"),
    ("spec_rogue_assassin", "class_rogue"),
    ("spec_mage_pyromancer", "class_mage"),
    ("spec_cleric_support", "class_cleric"),
]

HERO_NAMES = {
    "spec_warrior_swordsman": ["Aldren Lâmina-Fiel", "Torin Espada-Justa", "Valerius Guarda-Real", "Corbin Guarda-Muralha"],
    "spec_warrior_berserker": ["Brakka Machado-Rubro", "Gromm Quebra-Escudos", "Rorik Fúria-do-Norte", "Dorn Punho-Pesado"],
    "spec_rogue_archer": ["Lyra Flecha-Silenciosa", "Finn Tiro-Certeiro", "Sariel Vento-Noturno", "Kaelen Olho-de-Rapina"],
    "spec_rogue_assassin": ["Kael Passo-Sombrio", "Vesper Adaga-Fria", "Riven Manto-Escuro", "Nalia Sombra-Ágil"],
    "spec_mage_pyromancer": ["Ignis Brasa-Viva", "Solon Chama-Solar", "Pyra Labareda-Real", "Vaelin Centelha-Mística"],
    "spec_cleric_support": ["Irmão Aldous", "Madre Teresa", "Clérigo Cedric", "Irmã Linnea"],
}

RIVALS_DATA = [
    {"id": "g_grifo", "name": "Ordem do Grifo Dourado", "power_rating": 76, "division_id": "div_nobre"},
    {"id": "g_dragao", "name": "Baluarte do Dragão Vermelho", "power_rating": 74, "division_id": "div_nobre"},
    {"id": "g_aco", "name": "Irmandade do Aço Negro", "power_rating": 71, "division_id": "div_nobre"},
    {"id": "g_sol", "name": "Falange do Sol Radiante", "power_rating": 69, "division_id": "div_nobre"},
    {"id": "g_alvorada", "name": "Lança da Alvorada", "power_rating": 67, "division_id": "div_nobre"},
    {"id": "g_leao", "name": "Vigia do Leão Real", "power_rating": 66, "division_id": "div_nobre"},
    {"id": "g_falcao", "name": "Ordem do Falcão Real", "power_rating": 65, "division_id": "div_nobre"},
    {"id": "g_serpente", "name": "Círculo da Serpente de Ferro", "power_rating": 64, "division_id": "div_nobre"},
    {"id": "g_corvo", "name": "Corvo e Osso", "power_rating": 59, "division_id": "div_acesso"},
    {"id": "g_prata", "name": "Sentinelas da Prata", "power_rating": 56, "division_id": "div_acesso"},
    {"id": "g_pedra", "name": "Vigia de Pedra", "power_rating": 54, "division_id": "div_acesso"},
    {"id": "g_martelo", "name": "Companhia do Martelo Rúnico", "power_rating": 53, "division_id": "div_acesso"},
    {"id": "g_crepusculo", "name": "Legião do Crepúsculo", "power_rating": 51, "division_id": "div_acesso"},
    {"id": "g_bastiao", "name": "Bastião dos Desbravadores", "power_rating": 49, "division_id": "div_acesso"},
    {"id": "g_rosa", "name": "Milícia da Rosa de Cinzas", "power_rating": 48, "division_id": "div_acesso"},
]

def make_roster(guild_id, base_power):
    roster = []
    for i, (spec_id, class_id) in enumerate(RIVAL_SPECS):
        name_list = HERO_NAMES[spec_id]
        hero_name = f"{name_list[i % len(name_list)]}"
        
        # Calculate specialized attributes based on class archetype
        if "warrior" in class_id:
            agi = max(10, base_power - 10)
            strength = base_power + 6
            vit = base_power + 4
            intel = max(10, base_power - 20)
            wis = max(10, base_power - 15)
            lck = base_power - 5
        elif "rogue" in class_id:
            agi = base_power + 12
            strength = base_power - 5
            vit = base_power - 5
            intel = max(10, base_power - 15)
            wis = max(10, base_power - 10)
            lck = base_power + 8
        elif "mage" in class_id:
            agi = base_power - 2
            strength = max(10, base_power - 25)
            vit = max(10, base_power - 10)
            intel = base_power + 14
            wis = base_power + 8
            lck = base_power
        else: # cleric
            agi = max(10, base_power - 8)
            strength = base_power - 5
            vit = base_power + 4
            intel = base_power + 4
            wis = base_power + 12
            lck = base_power - 2

        hero = {
            "id": f"hero_{guild_id}_{i+1}",
            "name": hero_name,
            "class_id": class_id,
            "specialization_id": spec_id,
            "power": base_power,
            "attributes": {
                "str": max(1, min(100, strength)),
                "agi": max(1, min(100, agi)),
                "vit": max(1, min(100, vit)),
                "int": max(1, min(100, intel)),
                "wis": max(1, min(100, wis)),
                "lck": max(1, min(100, lck))
            }
        }
        roster.append(hero)
    return roster

rival_guilds = []
for r in RIVALS_DATA:
    roster = make_roster(r["id"], r["power_rating"])
    avg_agi = round(sum(h["attributes"]["agi"] for h in roster) / len(roster))
    rival_guilds.append({
        "id": r["id"],
        "name": r["name"],
        "is_player": False,
        "power_rating": r["power_rating"],
        "division_id": r["division_id"],
        "average_agi": avg_agi,
        "roster": roster
    })

data = {
    "player_guild": {
        "id": "g_player",
        "name": "Guilda do Jogador",
        "is_player": True,
        "power_rating": 61,
        "division_id": "div_acesso"
    },
    "divisions": DIVISIONS,
    "rival_guilds": rival_guilds
}

output_path = os.path.join(os.path.dirname(__file__), "..", "data", "guilds_seed.json")
with open(output_path, "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
print("guilds_seed.json gerado com sucesso!")
