"""
HeroFoot B2B & Modular Assembly Seed Loader.
Carrega os parâmetros de corporações, peças modulares, contratos de fornecimento
e operários de linha de montagem com cache em memória.
"""

import os
import json
from typing import List, Dict, Any, Optional

from balance import get_balance

_CORPORATIONS_CACHE = None
_PARTS_CACHE = None
_CONTRACTS_CACHE = None
_WORKERS_CACHE = None


def get_corporations() -> List[Dict[str, Any]]:
    global _CORPORATIONS_CACHE
    if _CORPORATIONS_CACHE is None:
        path = os.path.join(os.path.dirname(__file__), "data", "corporations_seed.json")
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                _CORPORATIONS_CACHE = json.load(f)
        else:
            _CORPORATIONS_CACHE = []
    return _CORPORATIONS_CACHE


def get_corporations_dict() -> Dict[str, Dict[str, Any]]:
    return {c["id"]: c for c in get_corporations()}


def get_parts() -> List[Dict[str, Any]]:
    global _PARTS_CACHE
    if _PARTS_CACHE is None:
        path = os.path.join(os.path.dirname(__file__), "data", "parts_seed.json")
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                _PARTS_CACHE = json.load(f)
        else:
            _PARTS_CACHE = []
    return _PARTS_CACHE


def get_parts_dict() -> Dict[str, Dict[str, Any]]:
    return {p["part_id"]: p for p in get_parts()}


def get_b2b_contracts() -> List[Dict[str, Any]]:
    global _CONTRACTS_CACHE
    if _CONTRACTS_CACHE is None:
        path = os.path.join(os.path.dirname(__file__), "data", "b2b_contracts_seed.json")
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                _CONTRACTS_CACHE = json.load(f)
        else:
            _CONTRACTS_CACHE = []
    return _CONTRACTS_CACHE


def get_b2b_contracts_dict() -> Dict[str, Dict[str, Any]]:
    return {c["contract_id"]: c for c in get_b2b_contracts()}


def get_assembly_workers() -> List[Dict[str, Any]]:
    global _WORKERS_CACHE
    if _WORKERS_CACHE is None:
        path = os.path.join(os.path.dirname(__file__), "data", "assembly_workers_seed.json")
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                _WORKERS_CACHE = json.load(f)
        else:
            _WORKERS_CACHE = []
    return _WORKERS_CACHE


def get_assembly_workers_dict() -> Dict[str, Dict[str, Any]]:
    return {w["worker_id"]: w for w in get_assembly_workers()}


def get_b2b_balance() -> Dict[str, Any]:
    return get_balance().get("b2b", {})
