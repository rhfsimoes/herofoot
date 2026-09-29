"""
HeroFoot Local Backend API Server
Serve endpoints REST para a interface Web (React/Tauri) usando puramente a biblioteca padrão do Python.
"""

import sys
import os
import json
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from controller import GameController
import save_system

PORT = 8000
FRONTEND_DIST = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'frontend', 'dist')

controller = GameController()

class HeroFootAPIHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=FRONTEND_DIST if os.path.exists(FRONTEND_DIST) else None, **kwargs)

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def _send_json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))

    def _send_action_result(self, result, extra=None, status=200):
        payload = {
            "result": result,
            "state": controller.get_state(),
        }
        if isinstance(result, dict):
            payload["success"] = result.get("success", True)
            if "message" in result:
                payload["message"] = result["message"]
            for k in (
                "gold", "facilities", "hero", "new_level", "saves", "slot", "item", "quality",
                "tinkering", "tinkering_success", "recipe_unlocked", "xp_gained", "current_xp",
                "level", "cost", "xp_consumed", "consequence", "effects_applied", "active_event",
                "gold_earned", "confidence_earned"
            ):
                if k in result:
                    payload[k] = result[k]
        else:
            payload["success"] = True
        if extra:
            payload.update(extra)
        self._send_json(payload, status=status)

    def _read_json_body(self):
        content_length = int(self.headers.get('Content-Length', 0))
        if content_length > 0:
            body = self.rfile.read(content_length)
            return json.loads(body.decode('utf-8'))
        return {}

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path == '/api/state':
            self._send_json(controller.get_state())
        elif path == '/api/market':
            self._send_json(controller.market_engine.get_market_data())
        elif path == '/api/league':
            self._send_json({
                "standings": controller.league_engine.get_standings(),
                "last_matches": controller.league_engine.last_round_matches,
                "current_fixture": controller.league_engine.get_player_match(controller.state.day)
            })
        elif path == '/api/saves':
            self._send_json({
                "success": True,
                "saves": save_system.list_saves()
            })
        elif path == '/api/craft_options':
            query_params = parse_qs(parsed.query)
            recipe_id = query_params.get('recipe_id', [''])[0]
            self._send_json(controller.get_craft_options(recipe_id))
        elif path == '/api/material':
            query_params = parse_qs(parsed.query)
            material_id = query_params.get('id', [''])[0]
            self._send_json(controller.get_material_sheet(material_id))
        elif path == '/api/medical_facilities':
            self._send_json(controller.get_medical_facilities())
        elif path == '/api/academy':
            self._send_json(controller.get_academy())
        elif path == '/api/transfer_market':
            self._send_json(controller.get_transfer_market())
        elif path == '/api/crown_goals':
            self._send_json(controller.get_crown_goals())
        elif path == '/api/events/active':
            self._send_json({"active_event": controller.get_active_event()})
        elif path.startswith('/api/'):
            self._send_json({"error": "Endpoint não encontrado"}, status=404)
        else:
            if os.path.exists(FRONTEND_DIST):
                super().do_GET()
            else:
                self._send_json({"message": "HeroFoot Backend ativo."}, status=200)

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path == '/api/advance_phase':
            result = controller.advance_phase()
            # Autosave corporativo automático ao término da fase
            try:
                controller.save(controller.active_slot or "autosave")
            except Exception:
                pass
            self._send_json({
                "result": result,
                "state": controller.get_state()
            })
        elif path == '/api/tactics':
            body = self._read_json_body()
            starters = body.get('starters', [])
            reserves = body.get('reserves', [])
            loadout = body.get('loadout', {})
            result = controller.save_tactics(starters, loadout, reserves=reserves)
            self._send_action_result(result)
        elif path == '/api/craft':
            body = self._read_json_body()
            recipe_id = body.get('recipe_id')
            branch = body.get('branch', 'Ferragem')
            prefix_id = body.get('prefix_id')
            suffix_id = body.get('suffix_id')
            prefix_material_id = body.get('prefix_material_id')
            suffix_material_id = body.get('suffix_material_id')
            is_tinkering = body.get('is_tinkering', False)
            result = controller.ui_request_craft(
                recipe_id,
                branch=branch,
                prefix_id=prefix_id,
                suffix_id=suffix_id,
                prefix_material_id=prefix_material_id,
                suffix_material_id=suffix_material_id,
                is_tinkering=is_tinkering,
            )
            self._send_action_result(result)
        elif path == '/api/craft_preview':
            body = self._read_json_body()
            recipe_id = body.get('recipe_id')
            prefix_id = body.get('prefix_id')
            suffix_id = body.get('suffix_id')
            prefix_material_id = body.get('prefix_material_id')
            suffix_material_id = body.get('suffix_material_id')
            result = controller.get_craft_preview(
                recipe_id,
                prefix_id=prefix_id,
                suffix_id=suffix_id,
                prefix_material_id=prefix_material_id,
                suffix_material_id=suffix_material_id,
            )
            self._send_json(result)
        elif path == '/api/learn_affix':
            body = self._read_json_body()
            affix_id = body.get('affix_id')
            result = controller.learn_affix(affix_id)
            self._send_action_result(result)
        elif path == '/api/upgrade_workshop':
            body = self._read_json_body()
            branch = body.get('branch', 'Ferragem')
            result = controller.upgrade_workshop(branch)
            self._send_action_result(result)
        elif path == '/api/upgrade_medical':
            result = controller.upgrade_medical_facility()
            self._send_action_result(result)
        elif path == '/api/hr/massage':
            body = self._read_json_body()
            hero_id = body.get('hero_id')
            result = controller.treat_hero_massage(hero_id)
            self._send_action_result(result)
        elif path == '/api/hr/accelerate_injury':
            body = self._read_json_body()
            hero_id = body.get('hero_id')
            result = controller.accelerate_hero_injury(hero_id)
            self._send_action_result(result)
        elif path == '/api/hr/banquet':
            result = controller.collective_banquet()
            self._send_action_result(result)
        elif path == '/api/hr/renew_contract':
            body = self._read_json_body()
            hero_id = body.get('hero_id')
            result = controller.renew_hero_contract(hero_id)
            self._send_action_result(result)
        elif path == '/api/hr/release_contract':
            body = self._read_json_body()
            hero_id = body.get('hero_id')
            result = controller.release_hero_contract(hero_id)
            self._send_action_result(result)
        elif path == '/api/academy/promote':
            body = self._read_json_body()
            hero_id = body.get('hero_id')
            result = controller.promote_youth(hero_id)
            self._send_action_result(result)
        elif path == '/api/academy/dismiss':
            body = self._read_json_body()
            hero_id = body.get('hero_id')
            result = controller.dismiss_youth(hero_id)
            self._send_action_result(result)
        elif path == '/api/market/scout':
            body = self._read_json_body()
            hero_id = body.get('hero_id')
            result = controller.scout_market_hero(hero_id)
            self._send_action_result(result)
        elif path == '/api/market/hire':
            body = self._read_json_body()
            hero_id = body.get('hero_id')
            result = controller.hire_market_hero(hero_id)
            self._send_action_result(result)
        elif path == '/api/buy_material':
            body = self._read_json_body()
            material_id = body.get('material_id')
            quantity = int(body.get('quantity', 1))
            result = controller.buy_material(material_id, quantity)
            self._send_action_result(result)
        elif path == '/api/buy_item':
            body = self._read_json_body()
            market_item_id = body.get('market_item_id')
            result = controller.buy_ready_item(market_item_id)
            self._send_action_result(result)
        elif path == '/api/sell':
            body = self._read_json_body()
            item_id = body.get('item_instance_id')
            margin_type = body.get('margin_type', 'Preço Justo')
            result = controller.list_item_for_sale(item_id, margin_type=margin_type)
            self._send_action_result(result)
        elif path == '/api/resolve_offer':
            body = self._read_json_body()
            offer_id = body.get('offer_id')
            accept = bool(body.get('accept', False))
            result = controller.resolve_counter_offer(offer_id, accept)
            self._send_action_result(result)
        elif path == '/api/fulfill_vip_order':
            body = self._read_json_body()
            item_id = body.get('item_instance_id')
            result = controller.fulfill_vip_order(item_id)
            self._send_action_result(result)
        elif path == '/api/save':
            body = self._read_json_body()
            slot = body.get('slot', 'autosave')
            try:
                save_res = controller.save(slot)
                self._send_json({
                    "success": True,
                    "message": save_res.get("message", "Registro corporativo arquivado com êxito."),
                    "slot": save_res.get("slot"),
                    "saves": save_system.list_saves()
                })
            except Exception as err:
                self._send_json({
                    "success": False,
                    "error": f"Falha no arquivamento corporativo: {str(err)}"
                }, status=400)
        elif path == '/api/load':
            body = self._read_json_body()
            slot = body.get('slot')
            if not slot:
                self._send_json({
                    "success": False,
                    "error": "Compartimento de arquivamento não informado na requisição corporativa."
                }, status=400)
                return

            try:
                controller.load(slot)
                self._send_json({
                    "success": True,
                    "state": controller.get_state()
                })
            except Exception as err:
                self._send_json({
                    "success": False,
                    "error": f"Falha ao carregar registro corporativo: {str(err)}"
                }, status=400)
        elif path == '/api/new_game':
            body = self._read_json_body()
            slot = body.get('slot')
            try:
                controller.new_game(slot=slot)
                self._send_json({
                    "success": True,
                    "state": controller.get_state()
                })
            except Exception as err:
                self._send_json({
                    "success": False,
                    "error": f"Falha ao instaurar novo ciclo corporativo: {str(err)}"
                }, status=400)
        elif path == '/api/events/resolve':
            body = self._read_json_body()
            event_id = body.get('event_id')
            option_id = body.get('option_id')
            result = controller.resolve_event_choice(event_id, option_id)
            status = 200 if result.get("success", True) else 400
            self._send_action_result(result, status=status)
        else:
            self._send_json({"error": "Endpoint POST desconhecido"}, status=404)

def run():
    server_address = ('', PORT)
    httpd = HTTPServer(server_address, HeroFootAPIHandler)
    print(f"[HeroFoot] Servidor ativo em http://localhost:{PORT}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor encerrado.")
        httpd.server_close()

if __name__ == '__main__':
    run()
