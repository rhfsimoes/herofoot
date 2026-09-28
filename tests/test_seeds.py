import os
import json
import unittest

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')

CANONICAL_SLOTS = {"Arma", "Armadura", "Joia", "Inscrição", "Consumível"}
CANONICAL_BRANCHES = {"Ferragem", "Alquimia", "Joalheria", "Culinária"}
CANONICAL_BRANCH_IDS = {"blacksmithing", "alchemy", "jewelry", "cooking"}
CANONICAL_QUALITIES = {"Fraco", "Normal", "Ótimo", "Lendário"}
CANONICAL_STATUSES = {"Apto", "Fatigado", "Afastado"}
FORBIDDEN_TERMS = ["gol", "gramado", "estádio", "estadio", "escanteio", "bilheteria", "brasfoot"]


class TestSeeds(unittest.TestCase):
    def load_json(self, filename):
        path = os.path.join(DATA_DIR, filename)
        self.assertTrue(os.path.exists(path), f"Arquivo não encontrado: {filename}")
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)

    def test_all_json_load(self):
        """Verifica se todos os arquivos JSON em data/ carregam sem erro de sintaxe."""
        json_files = [f for f in os.listdir(DATA_DIR) if f.endswith('.json')]
        self.assertGreater(len(json_files), 5, "Menos JSONs do que o esperado em data/")
        for jf in json_files:
            data = self.load_json(jf)
            self.assertIsNotNone(data, f"Falha ao carregar {jf}")

    def test_specialization_weights_sum_to_one(self):
        """Pesos das especializações somam 1.0 ± 0.001."""
        classes_data = self.load_json('classes_seed.json')
        specs = classes_data.get('specializations', [])
        self.assertGreater(len(specs), 0)
        for spec in specs:
            profile = spec.get('stat_weight_profile', {})
            total = sum(profile.values())
            self.assertAlmostEqual(
                total, 1.0, places=3,
                msg=f"Pesos de {spec['id']} somam {total}, esperado 1.0"
            )

    def test_canonical_sets(self):
        """Slots, ramos e qualidades pertencem aos conjuntos canônicos."""
        # Itens
        items = self.load_json('items_seed.json')
        for item in items:
            self.assertIn(item['slot'], CANONICAL_SLOTS, f"Slot inválido em {item['id']}")

        # Receitas
        recipes = self.load_json('recipes_seed.json')
        for rec_id, rec in recipes.items():
            self.assertIn(rec['slot'], CANONICAL_SLOTS, f"Slot inválido na receita {rec_id}")
            self.assertIn(rec['branch'], CANONICAL_BRANCHES, f"Ramo inválido na receita {rec_id}")

        # Workshops
        workshops = self.load_json('workshops_seed.json')
        for b in workshops.get('branches', []):
            self.assertIn(b['label'], CANONICAL_BRANCHES)
            self.assertIn(b['id'], CANONICAL_BRANCH_IDS)
        for lvl, q_probs in workshops.get('levels', {}).items():
            for q in q_probs.keys():
                self.assertIn(q, CANONICAL_QUALITIES)

        # Market templates
        templates = self.load_json('market_templates_seed.json')
        for tpl in templates:
            self.assertIn(tpl['slot_type'], CANONICAL_SLOTS)
            self.assertIn(tpl['quality'], CANONICAL_QUALITIES)

    def test_recipe_references_exist(self):
        """Todo base_item_id e todo material de receita existem."""
        items = self.load_json('items_seed.json')
        item_ids = {i['id'] for i in items}
        materials = self.load_json('materials_seed.json')
        material_ids = {m['id'] for m in materials}

        recipes = self.load_json('recipes_seed.json')
        for rec_id, rec in recipes.items():
            self.assertIn('base_item_id', rec, f"Receita {rec_id} sem base_item_id")
            self.assertIn(rec['base_item_id'], item_ids, f"base_item_id {rec['base_item_id']} não existe em items_seed")
            for ing in rec.get('ingredients', []):
                self.assertIn(ing['item_id'], material_ids, f"Ingrediente {ing['item_id']} em {rec_id} não existe em materials_seed")

    def test_class_specialization_references(self):
        """Refs de classe -> especialização são válidas."""
        classes_data = self.load_json('classes_seed.json')
        class_ids = {c['id'] for c in classes_data['classes']}
        for spec in classes_data['specializations']:
            self.assertIn(spec['class_id'], class_ids, f"class_id {spec['class_id']} em {spec['id']} não existe")

    def test_heroes_validate_against_schema(self):
        """Heróis validam contra hero_schema.json (validação manual sem novas dependências)."""
        schema = self.load_json('hero_schema.json')
        heroes = self.load_json('team.json')
        classes_data = self.load_json('classes_seed.json')
        class_ids = {c['id'] for c in classes_data['classes']}
        spec_ids = {s['id'] for s in classes_data['specializations']}

        required_props = set(schema.get('required', []))
        for h in heroes:
            # Propriedades obrigatórias e sem adicionais
            hero_keys = set(h.keys())
            missing = required_props - hero_keys
            extra = hero_keys - set(schema.get('properties', {}).keys())
            self.assertEqual(len(missing), 0, f"Herói {h.get('id')} com campos faltando: {missing}")
            self.assertEqual(len(extra), 0, f"Herói {h.get('id')} com campos extras: {extra}")

            # Tipos e faixas
            self.assertIn(h['class_id'], class_ids)
            self.assertIn(h['specialization_id'], spec_ids)
            self.assertTrue(16 <= h['age'] <= 45, f"Idade fora da faixa em {h['id']}")
            self.assertTrue(1 <= h['current_power'] <= 100, f"Poder fora da faixa em {h['id']}")
            self.assertIn(h['status'], CANONICAL_STATUSES)
            self.assertTrue(0 <= h['fatigue'] <= 100)
            self.assertTrue(h['salary'] >= 0)
            self.assertIsInstance(h['injured'], bool)
            self.assertTrue(h['injury_weeks_left'] >= 0)

            attrs = h.get('hidden_attributes', {})
            for attr in ['str', 'agi', 'vit', 'int', 'wis', 'lck']:
                self.assertIn(attr, attrs)
                val = attrs[attr]
                self.assertTrue(1 <= val <= 100, f"Atributo {attr} com valor {val} fora de 1..100")

            pot = h.get('potential', {})
            self.assertTrue(1 <= pot.get('star_potential', 0) <= 5)
            self.assertIsInstance(pot.get('is_potential_revealed'), bool)

    def test_no_forbidden_terms_in_data_texts(self):
        """Nenhum termo proibido em textos de data/*.json."""
        import re
        for root, _, files in os.walk(DATA_DIR):
            for file in files:
                if file.endswith('.json'):
                    path = os.path.join(root, file)
                    with open(path, 'r', encoding='utf-8') as f:
                        text = f.read()
                    for term in FORBIDDEN_TERMS:
                        match = re.search(r'\b' + re.escape(term) + r'\b', text, re.IGNORECASE)
                        self.assertIsNone(
                            match,
                            f"Termo proibido '{term}' encontrado no arquivo data/{file}"
                        )


if __name__ == '__main__':
    unittest.main()
