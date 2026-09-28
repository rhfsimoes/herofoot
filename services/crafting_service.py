"""
HeroFoot Crafting Service.
Gerencia as ordens de fabricação de itens nas 4 bancadas da oficina e ampliações departamentais.
"""

import uuid
from constants import normalize_branch, normalize_slot, BRANCHES
from crafting import get_workshops_data


class CraftingService:
    def __init__(self, state, crafting_engine):
        self.state = state
        self.crafting_engine = crafting_engine

    def craft_item(self, recipe_id: str, branch: str = "Ferragem", rng=None) -> dict:
        """Fabrica um item na oficina usando a receita e nível da filial correspondente."""
        if not self.crafting_engine:
            return {"success": False, "message": "Motor de produção indisponível no departamento."}

        recipe = self.crafting_engine.recipe_db.get(recipe_id)
        if not recipe:
            return {"success": False, "message": "Receita não localizada no Livro de Ordens."}

        # O ramo é SEMPRE recipe["branch"] (normalizado). O parâmetro branch do cliente é ignorado.
        branch_raw = recipe.get("branch", "Ferragem")
        norm_branch = normalize_branch(branch_raw)
        workshop_level = self.state.get_workshop_level(norm_branch)

        # Rejeitar se nível da oficina < min_workshop_level da receita com laudo pericial
        min_level = recipe.get("min_workshop_level", 1)
        if workshop_level < min_level:
            return {
                "success": False,
                "message": (
                    f"Laudo pericial: filial de {norm_branch} possui nível {workshop_level}, "
                    f"insuficiente para a complexidade técnica de nível {min_level} exigida pela ordem de serviço."
                )
            }

        if not self.state.has_materials_for(recipe):
            return {"success": False, "message": "Insumos insuficientes para esta ordem de serviço."}

        # Consome insumos após todas as validações
        self.state.consume_materials(recipe)

        crafted_item = self.crafting_engine.craft_item(recipe_id, workshop_level, rng=rng)

        slot = normalize_slot(recipe.get("slot", "Arma"))
        crafted_item["item_instance_id"] = str(uuid.uuid4())
        crafted_item["slot_type"] = slot
        crafted_item["branch"] = norm_branch
        crafted_item["power_bonus"] = int(recipe.get("base_power", 20) * crafted_item.get("multiplier", 1.0))
        crafted_item["market_value_base"] = int(recipe.get("market_value_base", 150) * crafted_item.get("multiplier", 1.0))

        if recipe.get("terrain_mitigation"):
            crafted_item["terrain_mitigation"] = recipe["terrain_mitigation"]
        if recipe.get("energy_bonus") or recipe.get("energy_restore"):
            crafted_item["energy_bonus"] = recipe.get("energy_bonus", recipe.get("energy_restore", 0))

        # Cargas em consumíveis (padrão 3 cargas)
        if slot == "Consumível":
            charges = recipe.get("charges", 3)
            crafted_item["charges"] = charges
            crafted_item["max_charges"] = charges

        self.state.inventory.append(crafted_item)

        return {"success": True, "item": crafted_item}

    def upgrade_workshop(self, branch: str) -> dict:
        """Expande a infraestrutura de uma filial da oficina até o nível 6."""
        norm_branch = normalize_branch(branch)
        if norm_branch not in BRANCHES:
            return {
                "success": False,
                "message": f"Filial departamental '{branch}' não homologada no organograma corporativo."
            }

        current_level = self.state.get_workshop_level(norm_branch)
        if current_level >= 6:
            return {
                "success": False,
                "message": f"Laudo de auditoria: filial de {norm_branch} já opera no nível máximo homologado (nível 6)."
            }

        next_level = current_level + 1
        data = get_workshops_data()
        upgrade_costs = data.get("upgrade_costs", {})
        cost = upgrade_costs.get(str(next_level))
        if cost is None:
            return {
                "success": False,
                "message": "Tabela orçamentária não contempla expansão acima do escalão regulamentado."
            }

        if self.state.gold < cost:
            return {
                "success": False,
                "message": (
                    f"Recursos financeiros insuficientes em tesouraria. "
                    f"Custo de ampliação orçado em {cost} moedas de ouro para filial de {norm_branch}, "
                    f"saldo disponível: {self.state.gold}."
                )
            }

        # Debita tesouraria e atualiza nível homologado
        self.state.gold -= cost
        self.state.workshop_levels[norm_branch] = next_level

        return {
            "success": True,
            "branch": norm_branch,
            "level": next_level,
            "cost": cost,
            "message": f"Ordem de ampliação executada: filial de {norm_branch} promovida para o nível {next_level}."
        }
