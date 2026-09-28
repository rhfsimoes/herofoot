"""
HeroFoot League Engine
Gerencia as guildas da Liga, geração de confrontos e simulação dos jogos dos adversários (estilo Brasfoot).
"""

import os
import json
import random

def load_default_guilds():
    data_path = os.path.join(os.path.dirname(__file__), 'data', 'guilds_seed.json')
    if os.path.exists(data_path):
        try:
            with open(data_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                player_g = data.get("player_guild", {"id": "g_player", "name": "Guilda do Jogador", "is_player": True, "power_rating": 61})
                rivals = data.get("rival_guilds", [])
                return [player_g] + rivals
        except Exception:
            pass
    return [
        {"id": "g_player", "name": "Guilda do Jogador", "is_player": True, "power_rating": 61},
        {"id": "g_grifo", "name": "Ordem do Grifo Dourado", "is_player": False, "power_rating": 74},
        {"id": "g_aco", "name": "Irmandade do Aço Negro", "is_player": False, "power_rating": 69},
        {"id": "g_alvorada", "name": "Lança da Alvorada", "is_player": False, "power_rating": 63},
        {"id": "g_corvo", "name": "Corvo e Osso", "is_player": False, "power_rating": 58},
        {"id": "g_prata", "name": "Sentinelas da Prata", "is_player": False, "power_rating": 55},
        {"id": "g_pedra", "name": "Vigia de Pedra", "is_player": False, "power_rating": 52},
        {"id": "g_crepusculo", "name": "Legião do Crepúsculo", "is_player": False, "power_rating": 50},
    ]

DEFAULT_GUILDS = load_default_guilds()

class LeagueEngine:
    def __init__(self, guilds=None):
        self.guilds = guilds if guilds else [dict(g) for g in load_default_guilds()]
        self.table = {}
        for g in self.guilds:
            self.table[g["id"]] = {
                "id": g["id"],
                "guild_name": g["name"],
                "is_player": g.get("is_player", False),
                "power_rating": g.get("power_rating", 100),
                "played": 0,
                "wins": 0,
                "draws": 0,
                "losses": 0,
                "points": 0,
                "pe_for": 0,       # Pontos de Expedição a favor
                "pe_against": 0,   # Pontos de Expedição contra
                "pe_diff": 0,      # Saldo de PE
            }
        self.current_round = 1
        self.last_round_matches = []
        self._schedule = self._generate_round_robin_schedule()

    def _generate_round_robin_schedule(self):
        """Gera a tabela completa de confrontos (todos contra todos em turnos)."""
        guild_ids = [g["id"] for g in self.guilds]
        n = len(guild_ids)
        rounds = []
        
        # Algoritmo padrão de Round-Robin
        pool = list(guild_ids)
        for r in range(n - 1):
            round_pairs = []
            for i in range(n // 2):
                home = pool[i]
                away = pool[n - 1 - i]
                round_pairs.append((home, away))
            rounds.append(round_pairs)
            # Rotaciona mantendo o primeiro fixo
            pool = [pool[0]] + [pool[-1]] + pool[1:-1]
            
        return rounds

    def get_fixtures_for_round(self, round_num):
        """Retorna os confrontos de uma rodada específica."""
        schedule_idx = (round_num - 1) % len(self._schedule)
        pairs = self._schedule[schedule_idx]
        fixtures = []
        for home_id, away_id in pairs:
            fixtures.append({
                "home_id": home_id,
                "home_name": self.table[home_id]["guild_name"],
                "home_is_player": self.table[home_id]["is_player"],
                "away_id": away_id,
                "away_name": self.table[away_id]["guild_name"],
                "away_is_player": self.table[away_id]["is_player"],
            })
        return fixtures

    def get_player_match(self, round_num):
        """Retorna o confronto da guilda do jogador na rodada especificada."""
        fixtures = self.get_fixtures_for_round(round_num)
        for fix in fixtures:
            if fix["home_is_player"] or fix["away_is_player"]:
                return fix
        return None

    def simulate_ai_match(self, home_id, away_id):
        """
        Simula o confronto entre duas guildas rivais (estilo Brasfoot).
        Baseado na diferença de poder efetivo + variação de sorte, gera Pontos de Expedição.
        """
        home = self.table[home_id]
        away = self.table[away_id]

        p_home = home["power_rating"] + random.randint(-15, 15)
        p_away = away["power_rating"] + random.randint(-15, 15)

        diff = p_home - p_away

        # Salas exploradas / Mini-Bosses (0 a 3 PE)
        pe_home = 0
        pe_away = 0

        # Mini-bosses
        if diff > 10:
            pe_home += random.choice([1, 2])
        elif diff < -10:
            pe_away += random.choice([1, 2])
        else:
            if random.random() < 0.5:
                pe_home += 1
            if random.random() < 0.5:
                pe_away += 1

        # Boss final (diferença de 15% de poder dá +2 PE, empate/próximo dá +1 para ambos)
        higher = max(p_home, p_away)
        percent_diff = (abs(diff) / higher) * 100 if higher > 0 else 0

        if percent_diff > 15:
            if p_home > p_away:
                pe_home += 2
            else:
                pe_away += 2
        else:
            # Abate conjunto
            pe_home += 1
            pe_away += 1

        return pe_home, pe_away

    def record_match_result(self, home_id, away_id, pe_home, pe_away):
        """Atualiza a pontuação, estatísticas e saldo de duas equipes."""
        h = self.table[home_id]
        a = self.table[away_id]

        h["played"] += 1
        a["played"] += 1

        h["pe_for"] += pe_home
        h["pe_against"] += pe_away
        h["pe_diff"] = h["pe_for"] - h["pe_against"]

        a["pe_for"] += pe_away
        a["pe_against"] += pe_home
        a["pe_diff"] = a["pe_for"] - a["pe_against"]

        if pe_home > pe_away:
            h["wins"] += 1
            h["points"] += 3
            a["losses"] += 1
        elif pe_away > pe_home:
            a["wins"] += 1
            a["points"] += 3
            h["losses"] += 1
        else:
            h["draws"] += 1
            h["points"] += 1
            a["draws"] += 1
            a["points"] += 1

    def process_round_simulations(self, round_num, player_pe_for, player_pe_against):
        """
        Executa a rodada completa: registra o jogo do jogador e simula todas as outras partidas.
        """
        fixtures = self.get_fixtures_for_round(round_num)
        results = []

        for fix in fixtures:
            h_id = fix["home_id"]
            a_id = fix["away_id"]

            if fix["home_is_player"]:
                score_h = player_pe_for
                score_a = player_pe_against
            elif fix["away_is_player"]:
                score_h = player_pe_against
                score_a = player_pe_for
            else:
                score_h, score_a = self.simulate_ai_match(h_id, a_id)

            self.record_match_result(h_id, a_id, score_h, score_a)

            results.append({
                "home_name": fix["home_name"],
                "home_score": score_h,
                "away_name": fix["away_name"],
                "away_score": score_a,
                "is_player_match": fix["home_is_player"] or fix["away_is_player"]
            })

        self.last_round_matches = results
        self.current_round = round_num + 1
        return results

    def get_standings(self):
        """
        Retorna a tabela de classificação ordenada:
        1º Critério: Pontos
        2º Critério: Vitórias
        3º Critério: Saldo de PE (pe_diff)
        4º Critério: PE marcados (pe_for)
        """
        rows = list(self.table.values())
        rows.sort(
            key=lambda x: (x["points"], x["wins"], x["pe_diff"], x["pe_for"]),
            reverse=True
        )
        ranked = []
        for idx, row in enumerate(rows, 1):
            item = dict(row)
            item["rank"] = idx
            ranked.append(item)
        return ranked
