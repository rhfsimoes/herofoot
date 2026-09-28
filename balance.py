"""
HeroFoot Balance Module.
Loads and caches balance parameters from data/balance_seed.json.
"""

import os
import json

_BALANCE_CACHE = None


def get_balance() -> dict:
    global _BALANCE_CACHE
    if _BALANCE_CACHE is None:
        data_path = os.path.join(os.path.dirname(__file__), 'data', 'balance_seed.json')
        if os.path.exists(data_path):
            with open(data_path, 'r', encoding='utf-8') as f:
                _BALANCE_CACHE = json.load(f)
        else:
            _BALANCE_CACHE = {}
    return _BALANCE_CACHE


def reload_balance() -> dict:
    """Recarrega o cache de balanceamento (útil para testes)."""
    global _BALANCE_CACHE
    _BALANCE_CACHE = None
    return get_balance()
