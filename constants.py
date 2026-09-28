"""
HeroFoot Canonical Constants and Legacy Normalization Maps.
"""

SLOTS = ["Arma", "Armadura", "Joia", "Inscrição", "Consumível"]
BRANCHES = ["Ferragem", "Alquimia", "Joalheria", "Culinária"]
QUALITIES = ["Fraco", "Normal", "Ótimo", "Lendário"]
STATUSES = ["Apto", "Fatigado", "Afastado"]
MARGINS = ["Promoção", "Preço Justo", "Preço Abusivo"]

LEGACY_BRANCH_MAP = {
    "blacksmithing": "Ferragem",
    "alchemy": "Alquimia",
    "jewelry": "Joalheria",
    "cooking": "Culinária",
    "ferragem": "Ferragem",
    "alquimia": "Alquimia",
    "joalheria": "Joalheria",
    "culinária": "Culinária",
    "culinaria": "Culinária",
}

LEGACY_SLOT_MAP = {
    "weapon": "Arma",
    "armor": "Armadura",
    "jewelry": "Joia",
    "inscription": "Inscrição",
    "consumable": "Consumível",
    "arma": "Arma",
    "armadura": "Armadura",
    "joia": "Joia",
    "inscrição": "Inscrição",
    "inscricao": "Inscrição",
    "consumível": "Consumível",
    "consumivel": "Consumível",
}

LEGACY_MARGIN_MAP = {
    "promocao": "Promoção",
    "promoção": "Promoção",
    "justo": "Preço Justo",
    "preço justo": "Preço Justo",
    "preco justo": "Preço Justo",
    "abusivo": "Preço Abusivo",
    "preço abusivo": "Preço Abusivo",
    "preco abusivo": "Preço Abusivo",
}

LEGACY_QUALITY_MAP = {
    "fraco": "Fraco",
    "normal": "Normal",
    "ótimo": "Ótimo",
    "otimo": "Ótimo",
    "lendário": "Lendário",
    "lendario": "Lendário",
}

LEGACY_STATUS_MAP = {
    "apto": "Apto",
    "fatigado": "Fatigado",
    "afastado": "Afastado",
}


def normalize_branch(val: str) -> str:
    if not val:
        return "Ferragem"
    return LEGACY_BRANCH_MAP.get(str(val).strip().lower(), val)


def normalize_slot(val: str) -> str:
    if not val:
        return "Arma"
    return LEGACY_SLOT_MAP.get(str(val).strip().lower(), val)


def normalize_margin(val: str) -> str:
    if not val:
        return "Preço Justo"
    return LEGACY_MARGIN_MAP.get(str(val).strip().lower(), val)


def normalize_quality(val: str) -> str:
    if not val:
        return "Normal"
    return LEGACY_QUALITY_MAP.get(str(val).strip().lower(), val)


def normalize_status(val: str) -> str:
    if not val:
        return "Apto"
    return LEGACY_STATUS_MAP.get(str(val).strip().lower(), val)
