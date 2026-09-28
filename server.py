"""
HeroFoot Local Backend API Server
Serve endpoints REST para a interface Web (React/Tauri) usando puramente a biblioteca padrão do Python.
"""

import sys
import os
import json
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from controller import GameController

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
            self._send_json({
                "result": result,
                "state": controller.get_state()
            })
        elif path == '/api/craft':
            body = self._read_json_body()
            recipe_id = body.get('recipe_id')
            branch = body.get('branch', 'blacksmithing')
            result = controller.ui_request_craft(recipe_id, branch)
            self._send_json({
                "result": result,
                "state": controller.get_state()
            })
        elif path == '/api/buy_material':
            body = self._read_json_body()
            material_id = body.get('material_id')
            quantity = int(body.get('quantity', 1))
            result = controller.buy_material(material_id, quantity)
            self._send_json({
                "result": result,
                "state": controller.get_state()
            })
        elif path == '/api/buy_item':
            body = self._read_json_body()
            market_item_id = body.get('market_item_id')
            result = controller.buy_ready_item(market_item_id)
            self._send_json({
                "result": result,
                "state": controller.get_state()
            })
        elif path == '/api/sell':
            body = self._read_json_body()
            item_id = body.get('item_instance_id')
            base_price = int(body.get('base_price', 100))
            margin_type = body.get('margin_type', 'Preço Justo')
            result = controller.list_item_for_sale(item_id, base_price, margin_type)
            self._send_json({
                "result": result,
                "state": controller.get_state()
            })
        elif path == '/api/resolve_offer':
            body = self._read_json_body()
            offer_id = body.get('offer_id')
            accept = bool(body.get('accept', False))
            result = controller.resolve_counter_offer(offer_id, accept)
            self._send_json({
                "result": result,
                "state": controller.get_state()
            })
        else:
            self._send_json({"error": "Endpoint POST desconhecido"}, status=404)

def run():
    server_address = ('', PORT)
    httpd = HTTPServer(server_address, HeroFootAPIHandler)
    print(f"🏰 [HeroFoot] Servidor ativo em http://localhost:{PORT}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor encerrado.")
        httpd.server_close()

if __name__ == '__main__':
    run()
