"""
HeroFoot Crafting Service (Crafting v2).
Gerencia ordens de fabricação de itens nas 4 bancadas da oficina, prévia de forja,
consulta de opções por afixo, aquisição de Manuais de Ofício e ampliações departamentais.
"""

import uuid
import random
from typing import Dict, Any, Optional

from constants import normalize_branch, BRANCHES
from balance import get_balance
from crafting import get_workshops_data, determine_quality
from catalog import get_catalog
from item_resolver import resolve_item, build_name, get_quality_multipliers


class CraftingService:
    def __init__(self, state, crafting_engine=None, sales_service=None):
        self.state = state
        self.crafting_engine = crafting_engine
        self.sales_service = sales_service

    def craft_item(
        self,
        recipe_id: str,
        branch: str = "Ferragem",
        prefix_id: Optional[str] = None,
        suffix_id: Optional[str] = None,
        prefix_material_id: Optional[str] = None,
        suffix_material_id: Optional[str] = None,
        is_tinkering: bool = False,
        rng=None,
    ) -> Dict[str, Any]:
        """
        Executa a ordem de fabricação de um item (Crafting v2).
        Consome os ingredientes da base mais o material de cada afixo escolhido.
        Valida nível de oficina, afixos conhecidos, compatibilidade de slot e estoque de materiais.
        Suporta Forja Experimental (Tinkering) para projetos com nível superior ao homologado.
        """
        if isinstance(is_tinkering, random.Random) and rng is None:
            rng = is_tinkering
            is_tinkering = False

        cat = get_catalog()
        recipe = cat.get_recipe(recipe_id)
        if not recipe:
            # Compatibilidade com fallback do engine se existir
            if self.crafting_engine and hasattr(self.crafting_engine, "recipe_db"):
                recipe = self.crafting_engine.recipe_db.get(recipe_id)
            if not recipe:
                return {"success": False, "message": "Receita não localizada no Livro de Ordens."}

        # Validação de receita conhecida (se não for forja experimental / tinkering)
        if not is_tinkering:
            if hasattr(self.state, "known_recipes") and self.state.known_recipes:
                if recipe_id not in self.state.known_recipes:
                    return {
                        "success": False,
                        "message": f"Ordem de serviço rejeitada: receita '{recipe_id}' não homologada no acervo técnico da guilda.",
                    }

        # O ramo é SEMPRE recipe["branch"] (normalizado). O parâmetro branch do cliente é ignorado.
        branch_raw = recipe.get("branch", "Ferragem")
        norm_branch = normalize_branch(branch_raw)
        workshop_level = self.state.get_workshop_level(norm_branch)

        # Nível mínimo da oficina exigido pela receita
        min_level = recipe.get("min_workshop_level", 1)
        if workshop_level < min_level and not is_tinkering:
            return {
                "success": False,
                "message": (
                    f"Laudo pericial: filial de {norm_branch} possui nível {workshop_level}, "
                    f"insuficiente para a complexidade técnica de nível {min_level} exigida pela ordem de serviço."
                ),
            }

        slot = recipe.get("slot", "Arma")

        # Validações do Prefixo
        chosen_prefix_mat = prefix_material_id
        prefix_qty = 0
        if prefix_id:
            prefix = cat.get_affix(prefix_id)
            if not prefix:
                return {"success": False, "message": f"Prefixo '{prefix_id}' não catalogado."}
            if prefix.get("kind") != "prefix":
                return {"success": False, "message": "Afixo especificado como prefixo pertence à categoria de sufixos."}
            if hasattr(self.state, "known_affixes") and self.state.known_affixes:
                if prefix_id not in self.state.known_affixes:
                    return {"success": False, "message": f"Prefixo '{prefix_id}' não homologado no acervo técnico da guilda."}

            links = [
                l for l in cat.material_affixes
                if l["affix_id"] == prefix_id and l["slot"] == slot and (not l.get("recipe_id") or l["recipe_id"] == recipe_id)
            ]
            if not links:
                return {"success": False, "message": f"Prefixo '{prefix_id}' é incompatível com o slot '{slot}' ou com a receita '{recipe_id}'."}

            if chosen_prefix_mat:
                link = next((l for l in links if l["material_id"] == chosen_prefix_mat), None)
                if not link:
                    return {"success": False, "message": f"Material '{chosen_prefix_mat}' inválido para o prefixo '{prefix_id}'."}
                prefix_qty = link["quantity"]
            else:
                # Escolhe a primeira alternativa que o jogador possui, ou a primeira do catálogo
                link = next((l for l in links if self.state.materials.get(l["material_id"], 0) >= l["quantity"]), links[0])
                chosen_prefix_mat = link["material_id"]
                prefix_qty = link["quantity"]

        # Validações do Sufixo
        chosen_suffix_mat = suffix_material_id
        suffix_qty = 0
        if suffix_id:
            suffix = cat.get_affix(suffix_id)
            if not suffix:
                return {"success": False, "message": f"Sufixo '{suffix_id}' não catalogado."}
            if suffix.get("kind") != "suffix":
                return {"success": False, "message": "Afixo especificado como sufixo pertence à categoria de prefixos."}
            if hasattr(self.state, "known_affixes") and self.state.known_affixes:
                if suffix_id not in self.state.known_affixes:
                    return {"success": False, "message": f"Sufixo '{suffix_id}' não homologado no acervo técnico da guilda."}

            links = [
                l for l in cat.material_affixes
                if l["affix_id"] == suffix_id and l["slot"] == slot and (not l.get("recipe_id") or l["recipe_id"] == recipe_id)
            ]
            if not links:
                return {"success": False, "message": f"Sufixo '{suffix_id}' é incompatível com o slot '{slot}' ou com a receita '{recipe_id}'."}

            if chosen_suffix_mat:
                link = next((l for l in links if l["material_id"] == chosen_suffix_mat), None)
                if not link:
                    return {"success": False, "message": f"Material '{chosen_suffix_mat}' inválido para o sufixo '{suffix_id}'."}
                suffix_qty = link["quantity"]
            else:
                link = next((l for l in links if self.state.materials.get(l["material_id"], 0) >= l["quantity"]), links[0])
                chosen_suffix_mat = link["material_id"]
                suffix_qty = link["quantity"]

        # Consolidação de custos em materiais (Base + Prefixo + Sufixo)
        total_needed: Dict[str, int] = {}
        base_ings = cat.get_recipe_ingredients(recipe_id)
        if not base_ings and "ingredients" in recipe:
            for bi in recipe["ingredients"]:
                mid = bi.get("material_id") or bi.get("item_id")
                total_needed[mid] = total_needed.get(mid, 0) + bi.get("quantity", 1)
        else:
            for bi in base_ings:
                mid = bi["material_id"]
                total_needed[mid] = total_needed.get(mid, 0) + bi["quantity"]

        if chosen_prefix_mat and prefix_qty > 0:
            total_needed[chosen_prefix_mat] = total_needed.get(chosen_prefix_mat, 0) + prefix_qty

        if chosen_suffix_mat and suffix_qty > 0:
            total_needed[chosen_suffix_mat] = total_needed.get(chosen_suffix_mat, 0) + suffix_qty

        # Validação do estoque de insumos
        missing_materials = []
        for mat_id, needed in total_needed.items():
            current_qty = self.state.materials.get(mat_id, 0)
            if current_qty < needed:
                mat_name = cat.materials.get(mat_id, {}).get("name", mat_id)
                missing_materials.append(f"{needed - current_qty}x {mat_name}")

        if missing_materials:
            return {
                "success": False,
                "message": f"Insumos insuficientes para esta ordem de serviço. Faltam: {', '.join(missing_materials)}.",
            }

        # Débito fiscal dos insumos consumidos
        for mat_id, needed in total_needed.items():
            self.state.materials[mat_id] = max(0, self.state.materials.get(mat_id, 0) - needed)

        # Cálculo da XP base de forja a partir da progressão departamental
        data = get_workshops_data()
        xp_progression = data.get("xp_progression", {})
        recipe_tier = recipe.get("tier", 1)
        tier_key = f"xp_per_craft_tier{recipe_tier}"

        base_xp = xp_progression.get(str(workshop_level), {}).get(tier_key)
        if base_xp is None:
            for lvl_info in xp_progression.values():
                if lvl_info.get(tier_key) is not None:
                    base_xp = lvl_info[tier_key]
                    break
        if base_xp is None:
            base_xp = 10 if recipe_tier == 1 else (25 if recipe_tier == 2 else 60)

        if rng is None:
            rng = random.Random()

        # Mecânica de Tinkering (Forja Experimental)
        if workshop_level < min_level:
            balance = get_balance()
            tinkering_cfg = balance.get("crafting", {}).get("tinkering", {})
            penalty_per_gap = tinkering_cfg.get("success_penalty_per_tier_gap", 0.35)
            min_success = tinkering_cfg.get("min_success_chance", 0.05)
            multiplier_success = tinkering_cfg.get("xp_multiplier_on_tinkering_success", 1.5)
            xp_fail = tinkering_cfg.get("xp_on_tinkering_fail", 5)
            gororoba_value = tinkering_cfg.get("gororoba_sell_value", 20)

            tier_gap = max(1, min_level - workshop_level)
            success_chance = max(min_success, 1.0 - tier_gap * penalty_per_gap)

            roll = rng.random()
            if roll < success_chance:
                quality = determine_quality(workshop_level, rng=rng)
                crafted_item = resolve_item(
                    recipe_id=recipe_id,
                    prefix_id=prefix_id,
                    suffix_id=suffix_id,
                    quality=quality,
                    prefix_material_id=chosen_prefix_mat,
                    suffix_material_id=chosen_suffix_mat,
                    catalog=cat,
                )
                mults = get_quality_multipliers()
                crafted_item["multiplier"] = mults.get(quality, 1.0)
                self.state.inventory.append(crafted_item)

                if hasattr(self.state, "known_recipes") and recipe_id not in self.state.known_recipes:
                    self.state.known_recipes.append(recipe_id)

                xp_gained = int(base_xp * multiplier_success)
                if not hasattr(self.state, "workshop_xp") or not isinstance(self.state.workshop_xp, dict):
                    self.state.workshop_xp = {"Ferragem": 0, "Alquimia": 0, "Joalheria": 0, "Culinária": 0}
                self.state.workshop_xp[norm_branch] = self.state.get_workshop_xp(norm_branch) + xp_gained

                return {
                    "success": True,
                    "item": crafted_item,
                    "quality": quality,
                    "tinkering": True,
                    "tinkering_success": True,
                    "recipe_unlocked": True,
                    "xp_gained": xp_gained,
                    "current_xp": self.state.get_workshop_xp(norm_branch),
                }
            else:
                mults = get_quality_multipliers()
                gororoba_item = {
                    "item_instance_id": str(uuid.uuid4()),
                    "recipe_id": recipe_id,
                    "name": "Gororoba Experimental",
                    "description": "Resíduo operacional oriundo de processo fabril experimental sem conformidade técnica homologada.",
                    "slot": slot,
                    "slot_type": slot,
                    "branch": norm_branch,
                    "quality": "Fraco",
                    "power_bonus": 0,
                    "energy_bonus": 0,
                    "terrain_mitigation": None,
                    "market_value_base": int(gororoba_value),
                    "multiplier": mults.get("Fraco", 0.70),
                    "special_suffix_active": False,
                }
                self.state.inventory.append(gororoba_item)

                if hasattr(self.state, "known_recipes") and recipe_id not in self.state.known_recipes:
                    self.state.known_recipes.append(recipe_id)

                xp_fail_int = int(xp_fail)
                if not hasattr(self.state, "workshop_xp") or not isinstance(self.state.workshop_xp, dict):
                    self.state.workshop_xp = {"Ferragem": 0, "Alquimia": 0, "Joalheria": 0, "Culinária": 0}
                self.state.workshop_xp[norm_branch] = self.state.get_workshop_xp(norm_branch) + xp_fail_int

                return {
                    "success": True,
                    "item": gororoba_item,
                    "quality": "Fraco",
                    "tinkering": True,
                    "tinkering_success": False,
                    "recipe_unlocked": True,
                    "message": "Falha no processo de forja experimental. Os insumos foram consumidos gerando refugo operacional (Gororoba Experimental), mas o protocolo da receita foi catalogado.",
                    "xp_gained": xp_fail_int,
                    "current_xp": self.state.get_workshop_xp(norm_branch),
                }

        # Fabricação regular homologada
        quality = determine_quality(workshop_level, rng=rng)

        # Instanciação do item
        crafted_item = resolve_item(
            recipe_id=recipe_id,
            prefix_id=prefix_id,
            suffix_id=suffix_id,
            quality=quality,
            prefix_material_id=chosen_prefix_mat,
            suffix_material_id=chosen_suffix_mat,
            catalog=cat,
        )

        # Multiplicador histórico da oficina para auditoria
        mults = get_quality_multipliers()
        crafted_item["multiplier"] = mults.get(quality, 1.0)

        # Adiciona ao inventário da guilda
        self.state.inventory.append(crafted_item)

        if not hasattr(self.state, "workshop_xp") or not isinstance(self.state.workshop_xp, dict):
            self.state.workshop_xp = {"Ferragem": 0, "Alquimia": 0, "Joalheria": 0, "Culinária": 0}
        self.state.workshop_xp[norm_branch] = self.state.get_workshop_xp(norm_branch) + base_xp

        return {
            "success": True,
            "item": crafted_item,
            "quality": quality,
            "xp_gained": base_xp,
            "current_xp": self.state.get_workshop_xp(norm_branch),
        }

    def get_craft_options(self, recipe_id: str) -> Dict[str, Any]:
        """
        Retorna base, ingredientes com estoque, prefixos e sufixos conhecidos com status de disponibilidade,
        materiais faltantes e efeitos em texto, e o total de afixos por descobrir.
        """
        cat = get_catalog()
        recipe = cat.get_recipe(recipe_id)
        if not recipe:
            return {"success": False, "message": f"Receita '{recipe_id}' não localizada."}

        slot = recipe.get("slot")
        known_set = set(getattr(self.state, "known_affixes", []))

        # 1. Ingredientes da Base
        ingredients = []
        base_ings = cat.get_recipe_ingredients(recipe_id)
        for bi in base_ings:
            mid = bi["material_id"]
            mat_info = cat.get_material(mid) or {}
            qty_needed = bi["quantity"]
            qty_current = self.state.materials.get(mid, 0)
            ingredients.append({
                "material_id": mid,
                "name": mat_info.get("name", mid),
                "quantity_needed": qty_needed,
                "quantity_current": qty_current,
                "has_enough": qty_current >= qty_needed,
            })

        # 2. Afixos válidos para a base
        all_slot_affixes = cat.get_affixes_for_slot(slot, recipe_id=recipe_id)
        undiscovered_count = sum(1 for a in all_slot_affixes if a["affix_id"] not in known_set)

        def _format_affix_option(affix: Dict[str, Any]) -> Dict[str, Any]:
            aid = affix["affix_id"]
            kind = affix.get("kind")
            gender = recipe.get("gender", "m")
            if kind == "prefix":
                name = affix.get("name_f") if gender == "f" else affix.get("name_m")
            else:
                name = affix.get("name")

            links = [
                l for l in cat.material_affixes
                if l["affix_id"] == aid and l["slot"] == slot and (not l.get("recipe_id") or l["recipe_id"] == recipe_id)
            ]

            # Encontra materiais e checa se algum pode ser pago
            materials_options = []
            can_afford_any = False
            missing_text = []
            for l in links:
                mid = l["material_id"]
                mat_info = cat.get_material(mid) or {}
                needed = l["quantity"]
                curr = self.state.materials.get(mid, 0)
                affords = curr >= needed
                if affords:
                    can_afford_any = True
                materials_options.append({
                    "material_id": mid,
                    "name": mat_info.get("name", mid),
                    "quantity": needed,
                    "current": curr,
                    "available": affords,
                })

            if not can_afford_any and links:
                first_link = links[0]
                mat_info = cat.get_material(first_link["material_id"]) or {}
                missing_qty = first_link["quantity"] - self.state.materials.get(first_link["material_id"], 0)
                missing_text.append(f"Falta {missing_qty}× {mat_info.get('name', first_link['material_id'])}")

            # Efeitos descritivos
            effects_raw = cat.get_affix_effects(aid, quality="Normal")
            effects_legendary = cat.get_affix_effects(aid, quality="Lendário")
            effects_desc = []
            for e in effects_raw:
                effects_desc.append(_format_effect_label(e))
            for e in effects_legendary:
                if e not in effects_raw:
                    effects_desc.append(f"[Lendário] {_format_effect_label(e)}")

            return {
                "affix_id": aid,
                "name": name,
                "kind": kind,
                "available": can_afford_any,
                "materials": materials_options,
                "missing_reasons": missing_text,
                "effects_description": effects_desc,
            }

        known_prefixes = [
            _format_affix_option(a) for a in all_slot_affixes
            if a["kind"] == "prefix" and a["affix_id"] in known_set
        ]
        known_suffixes = [
            _format_affix_option(a) for a in all_slot_affixes
            if a["kind"] == "suffix" and a["affix_id"] in known_set
        ]

        return {
            "success": True,
            "recipe": recipe,
            "ingredients": ingredients,
            "prefixes": known_prefixes,
            "suffixes": known_suffixes,
            "undiscovered_count": undiscovered_count,
        }

    def get_craft_preview(
        self,
        recipe_id: str,
        prefix_id: Optional[str] = None,
        suffix_id: Optional[str] = None,
        prefix_material_id: Optional[str] = None,
        suffix_material_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Gera uma prévia corporativa com nome final, custo total, se pode craftar e números por qualidade.
        """
        cat = get_catalog()
        recipe = cat.get_recipe(recipe_id)
        if not recipe:
            return {"success": False, "message": f"Receita '{recipe_id}' não localizada."}

        norm_branch = normalize_branch(recipe.get("branch", "Ferragem"))
        workshop_level = self.state.get_workshop_level(norm_branch)
        min_level = recipe.get("min_workshop_level", 1)

        reasons = []
        if workshop_level < min_level:
            reasons.append(
                f"Nível de oficina insuficiente ({workshop_level}/{min_level} na filial de {norm_branch})"
            )

        slot = recipe.get("slot")

        # Materiais requeridos
        total_needed: Dict[str, int] = {}
        for bi in cat.get_recipe_ingredients(recipe_id):
            total_needed[bi["material_id"]] = total_needed.get(bi["material_id"], 0) + bi["quantity"]

        chosen_prefix_mat = prefix_material_id
        if prefix_id:
            links = [l for l in cat.material_affixes if l["affix_id"] == prefix_id and l["slot"] == slot]
            if links:
                link = next((l for l in links if l["material_id"] == chosen_prefix_mat), None)
                if not link:
                    link = next((l for l in links if self.state.materials.get(l["material_id"], 0) >= l["quantity"]), links[0])
                chosen_prefix_mat = link["material_id"]
                total_needed[chosen_prefix_mat] = total_needed.get(chosen_prefix_mat, 0) + link["quantity"]

        chosen_suffix_mat = suffix_material_id
        if suffix_id:
            links = [l for l in cat.material_affixes if l["affix_id"] == suffix_id and l["slot"] == slot]
            if links:
                link = next((l for l in links if l["material_id"] == chosen_suffix_mat), None)
                if not link:
                    link = next((l for l in links if self.state.materials.get(l["material_id"], 0) >= l["quantity"]), links[0])
                chosen_suffix_mat = link["material_id"]
                total_needed[chosen_suffix_mat] = total_needed.get(chosen_suffix_mat, 0) + link["quantity"]

        materials_summary = []
        for mid, needed in total_needed.items():
            curr = self.state.materials.get(mid, 0)
            mat_info = cat.get_material(mid) or {}
            has_enough = curr >= needed
            if not has_enough:
                reasons.append(f"Falta {needed - curr}× {mat_info.get('name', mid)}")
            materials_summary.append({
                "material_id": mid,
                "name": mat_info.get("name", mid),
                "needed": needed,
                "current": curr,
                "has_enough": has_enough,
            })

        prefix = cat.get_affix(prefix_id) if prefix_id else None
        suffix = cat.get_affix(suffix_id) if suffix_id else None
        final_name = build_name(recipe, prefix, suffix)

        # Números em cada qualidade
        qualities_preview = {}
        for q in ["Fraco", "Normal", "Ótimo", "Lendário"]:
            qualities_preview[q] = resolve_item(
                recipe_id=recipe_id,
                prefix_id=prefix_id,
                suffix_id=suffix_id,
                quality=q,
                prefix_material_id=chosen_prefix_mat,
                suffix_material_id=chosen_suffix_mat,
                catalog=cat,
            )

        # Chances da oficina
        data = get_workshops_data()
        levels_map = data.get("levels", {})
        q_probs = levels_map.get(str(workshop_level), {"Fraco": 50, "Normal": 40, "Ótimo": 10, "Lendário": 0})

        return {
            "success": True,
            "can_craft": len(reasons) == 0,
            "reasons": reasons,
            "final_name": final_name,
            "materials_summary": materials_summary,
            "qualities": qualities_preview,
            "workshop_chances": q_probs,
            "workshop_level": workshop_level,
            "branch": norm_branch,
        }

    def learn_affix(self, affix_id: str) -> Dict[str, Any]:
        """
        Adquire um Manual de Ofício mercantil, debitando ouro e incluindo o afixo nos conhecidos.
        """
        cat = get_catalog()
        affix = cat.get_affix(affix_id)
        if not affix:
            return {"success": False, "message": f"Manual do afixo '{affix_id}' não localizado no catálogo oficial."}

        unlock = affix.get("unlock", {})
        method = unlock.get("method")
        if method != "market":
            return {
                "success": False,
                "message": "Este compêndio técnico não está disponível para aquisição mercantil (requer espólio de masmorra ou já é inicial).",
            }

        if hasattr(self.state, "known_affixes"):
            if affix_id in self.state.known_affixes:
                return {
                    "success": False,
                    "message": "A guilda já homologou e possui domínio técnico sobre este afixo.",
                }

        cost = int(unlock.get("cost", 250))
        if self.state.gold < cost:
            return {
                "success": False,
                "message": f"Recursos financeiros insuficientes em tesouraria. Custo do manual: {cost} Ouro. Saldo disponível: {self.state.gold} Ouro.",
            }

        # Debita o ouro e arquiva o conhecimento
        self.state.gold -= cost
        if hasattr(self.state, "known_affixes"):
            self.state.known_affixes.append(affix_id)

        name_display = affix.get("name")
        if not name_display:
            m_n = affix.get("name_m", "")
            f_n = affix.get("name_f", "")
            name_display = f"{m_n} / {f_n}" if m_n and f_n else (m_n or f_n)

        return {
            "success": True,
            "message": f"Manual corporativo do afixo '{name_display}' adquirido com êxito. Conhecimento registrado no compêndio técnico.",
            "affix_id": affix_id,
            "gold": self.state.gold,
        }

    def get_material_sheet(self, material_id: str) -> Dict[str, Any]:
        """
        Retorna a ficha técnica do material: utilizado em quais receitas, afixos habilitados e fontes de extração.
        """
        cat = get_catalog()
        mat = cat.get_material(material_id)
        if not mat:
            return {"success": False, "message": f"Material '{material_id}' não catalogado."}

        # 1. Receitas que utilizam
        used_in = []
        for rid in cat.get_recipes_using_material(material_id):
            r = cat.get_recipe(rid)
            if r:
                used_in.append({
                    "recipe_id": rid,
                    "name": r.get("name"),
                    "slot": r.get("slot"),
                    "branch": r.get("branch"),
                })

        # 2. Afixos que habilita
        enables = []
        for aid in cat.get_affixes_using_material(material_id):
            aff = cat.get_affix(aid)
            if aff:
                enables.append({
                    "affix_id": aid,
                    "name": aff.get("name") or f"{aff.get('name_m')}/{aff.get('name_f')}",
                    "kind": aff.get("kind"),
                })

        # 3. Fontes de espólio
        sources = cat.get_material_sources(material_id)

        return {
            "success": True,
            "material": mat,
            "used_in_recipes": used_in,
            "enables_affixes": enables,
            "sources": sources,
        }

    def upgrade_workshop(self, branch: str) -> dict:
        """Expande a infraestrutura de uma filial da oficina até o nível 6."""
        norm_branch = normalize_branch(branch)
        if norm_branch not in BRANCHES:
            return {
                "success": False,
                "message": f"Filial departamental '{branch}' não homologada no organograma corporativo.",
            }

        current_level = self.state.get_workshop_level(norm_branch)
        if current_level >= 6:
            return {
                "success": False,
                "message": f"Laudo de auditoria: filial de {norm_branch} já opera no nível máximo homologado (nível 6).",
            }

        next_level = current_level + 1
        data = get_workshops_data()
        upgrade_costs = data.get("upgrade_costs", {})
        cost = upgrade_costs.get(str(next_level))
        if cost is None:
            return {
                "success": False,
                "message": "Tabela orçamentária não contempla expansão acima do escalão regulamentado.",
            }

        if self.state.gold < cost:
            return {
                "success": False,
                "message": (
                    f"Recursos financeiros insuficientes em tesouraria.\n"
                    f"Custo orçado para ampliação da filial de {norm_branch} (nível {next_level}): {cost} Ouro. "
                    f"Saldo disponível: {self.state.gold} Ouro."
                ),
            }

        self.state.gold -= cost
        self.state.workshop_levels[norm_branch] = next_level

        # Débito da XP necessária correspondente ao avanço de current_level para next_level
        xp_progression = data.get("xp_progression", {})
        level_prog = xp_progression.get(str(current_level), {})
        xp_needed = level_prog.get("xp_to_next_level") or 0
        current_xp = self.state.get_workshop_xp(norm_branch)
        if not hasattr(self.state, "workshop_xp") or not isinstance(self.state.workshop_xp, dict):
            self.state.workshop_xp = {"Ferragem": 0, "Alquimia": 0, "Joalheria": 0, "Culinária": 0}
        self.state.workshop_xp[norm_branch] = max(0, current_xp - xp_needed)

        return {
            "success": True,
            "message": f"Ordem de ampliação homologada. Filial de {norm_branch} modernizada para o nível {next_level}.",
            "branch": norm_branch,
            "level": next_level,
            "cost": cost,
            "xp_consumed": xp_needed,
            "current_xp": self.state.get_workshop_xp(norm_branch),
        }

    def assemble_item(
        self,
        part_ids: list,
        base_item_name: str = "Artefato Modular",
        is_tinkering: bool = False,
        rng=None,
        base_name: str = None,
    ) -> dict:
        """
        Monta um artefato combinando peças modulares do almoxarifado fabril (B2B Modular Assembly).
        - Se todas as peças pertencerem à mesma corporação: montagem 100% compatível.
        - Se houver mistura de marcas corporativas rivais/diferentes: dispara Tinkering Inter-Marcas.
          - Sucesso: confere bônus de Overclock Não-Autorizado (+15% poder) e homologa o esquema.
          - Falha: gera Gororoba Experimental e consome os insumos.
        """
        if base_name is not None:
            base_item_name = base_name

        if not part_ids:
            return {"success": False, "message": "Nenhuma peça modular informada para a ordem de montagem."}

        from b2b import get_parts_dict, get_corporations_dict, get_b2b_balance
        parts_catalog = get_parts_dict()
        b2b_cfg = get_b2b_balance()

        # Valida existência das peças no catálogo
        for pid in part_ids:
            if pid not in parts_catalog:
                return {"success": False, "message": f"Peça modular '{pid}' não homologada pelo acervo industrial."}

        # Valida estoque no almoxarifado fabril
        from collections import Counter
        required_counts = Counter(part_ids)
        missing_parts = []
        for pid, req_qty in required_counts.items():
            avail = self.state.get_part_quantity(pid)
            if avail < req_qty:
                p_name = parts_catalog[pid].get("name", pid)
                missing_parts.append(f"{req_qty - avail}x {p_name}")

        if missing_parts:
            return {
                "success": False,
                "message": f"Insumos modulares insuficientes no almoxarifado fabril. Faltam: {', '.join(missing_parts)}."
            }

        # Identifica marcas das peças
        brand_ids = set(parts_catalog[pid].get("corp_id") for pid in part_ids)
        is_inter_brand = len(brand_ids) > 1

        if is_inter_brand and not is_tinkering:
            return {
                "success": False,
                "tinkering_required": True,
                "message": "Montagem modular inter-marcas detectada. A integração de patentes concorrentes exige autorização expressa de Tinkering experimental.",
            }

        # Consome as peças do almoxarifado
        for pid, req_qty in required_counts.items():
            self.state.consume_warehouse_part(pid, req_qty)

        primary_part = parts_catalog[part_ids[0]]
        primary_branch = primary_part.get("branch", "Ferragem")
        slot = primary_part.get("compatible_slots", ["Arma"])[0]

        if rng is None:
            rng = random.Random()

        # Tinkering Inter-Marcas se houver mistura de marcas corporativas
        if is_inter_brand:
            success_chance = float(b2b_cfg.get("inter_brand_tinkering_success_chance", 0.60))
            roll = rng.random()
            if roll >= success_chance:
                gororoba_val = int(b2b_cfg.get("gororoba_sell_value", 20))
                mults = get_quality_multipliers()
                gororoba = {
                    "item_instance_id": str(uuid.uuid4()),
                    "name": "Gororoba Experimental",
                    "description": "Refugo mecânico de montagem modular entre patentes industriais concorrentes sem conformidade.",
                    "slot": slot,
                    "slot_type": slot,
                    "branch": primary_branch,
                    "quality": "Fraco",
                    "power_bonus": 0,
                    "energy_bonus": 0,
                    "market_value_base": gororoba_val,
                    "multiplier": mults.get("Fraco", 0.70),
                    "is_modular": True,
                    "special_suffix_active": False,
                }
                self.state.inventory.append(gororoba)

                recipe_key = f"modular_{'_'.join(sorted(part_ids))}"
                if hasattr(self.state, "known_recipes") and recipe_key not in self.state.known_recipes:
                    self.state.known_recipes.append(recipe_key)

                return {
                    "success": True,
                    "item": gororoba,
                    "quality": "Fraco",
                    "tinkering": True,
                    "tinkering_success": False,
                    "overclock": False,
                    "recipe_unlocked": True,
                    "message": "Falha na montagem modular: choque de especificações entre marcas rivais gerou refugo fabril (Gororoba Experimental). O esquema foi homologado.",
                }

        # Sucesso na montagem (mesma marca OU inter-marcas com sucesso)
        base_power = sum(parts_catalog[pid].get("power_bonus", parts_catalog[pid].get("power_contrib", 10)) for pid in part_ids)
        base_cost_sum = sum(parts_catalog[pid].get("base_cost", 50) for pid in part_ids)
        market_value_base = int(base_cost_sum * 1.35)

        is_overclocked = is_inter_brand
        if is_overclocked:
            overclock_pct = float(b2b_cfg.get("overclock_power_bonus_pct", 0.15))
            power_bonus = round(base_power * (1.0 + overclock_pct))
            item_name = f"{base_item_name} (Overclock Não-Autorizado)"
            quality = "Ótimo"
            recipe_key = f"modular_{'_'.join(sorted(part_ids))}"
            if hasattr(self.state, "known_recipes") and recipe_key not in self.state.known_recipes:
                self.state.known_recipes.append(recipe_key)
        else:
            power_bonus = base_power
            item_name = base_item_name
            quality = "Normal"

        mults = get_quality_multipliers()
        crafted_item = {
            "item_instance_id": str(uuid.uuid4()),
            "name": item_name,
            "slot": slot,
            "slot_type": slot,
            "branch": primary_branch,
            "quality": quality,
            "power_bonus": int(power_bonus),
            "energy_bonus": 0,
            "market_value_base": market_value_base,
            "multiplier": mults.get(quality, 1.0),
            "parts": list(part_ids),
            "is_modular": True,
            "overclock": is_overclocked,
            "special_suffix_active": False,
        }
        self.state.inventory.append(crafted_item)

        return {
            "success": True,
            "item": crafted_item,
            "quality": quality,
            "tinkering": is_inter_brand,
            "tinkering_success": True if is_inter_brand else None,
            "overclock": is_overclocked,
            "recipe_unlocked": True if is_inter_brand else False,
            "message": f"Ordem de montagem modular concluída: '{item_name}' integrado ao almoxarifado.",
        }

    def process_assembly_line(self, rng=None) -> dict:
        """
        Executa a rotina autônoma de montagem semanal dos operários contratados na Linha de Montagem.
        - Para cada operário ativo, verifica a ordem atribuída e a disponibilidade de peças no almoxarifado.
        - Produz itens White-label (Tier 1/2) e despacha diretamente via sales_service.queue_auto_sale().
        - Concede XP reduzida à respectiva filial fabril (assembly_line_xp_rate: 0.10).
        """
        workers = getattr(self.state, "assembly_line_workers", [])
        if not workers:
            return {
                "items_produced": [],
                "assembly_sales_revenue": 0,
                "workers_count": 0,
                "active_workers": 0,
            }

        from b2b import get_b2b_balance, get_parts_dict
        from catalog import get_catalog
        b2b_cfg = get_b2b_balance()
        xp_rate = float(b2b_cfg.get("assembly_line_xp_rate", 0.10))
        parts_catalog = get_parts_dict()
        cat = get_catalog()

        items_produced = []
        total_assembly_revenue = 0
        active_workers_count = 0

        for worker in workers:
            target_recipe_id = worker.get("target_recipe")
            if not target_recipe_id:
                continue

            recipe = cat.get_recipe(target_recipe_id)
            if not recipe:
                continue

            branch = worker.get("assigned_branch") or recipe.get("branch", "Ferragem")
            capacity = int(worker.get("production_capacity", 1))

            for _ in range(capacity):
                available_branch_parts = [
                    pid for pid, qty in self.state.warehouse_parts.items()
                    if qty > 0 and parts_catalog.get(pid, {}).get("branch") == branch
                ]

                if len(available_branch_parts) < 2:
                    available_branch_parts = [
                        pid for pid, qty in self.state.warehouse_parts.items()
                        if qty > 0
                    ]

                total_units_available = sum(self.state.get_part_quantity(pid) for pid in available_branch_parts)
                if total_units_available < 2:
                    break

                consumed_pids = []
                for pid in available_branch_parts:
                    while self.state.get_part_quantity(pid) > 0 and len(consumed_pids) < 2:
                        self.state.consume_warehouse_part(pid, 1)
                        consumed_pids.append(pid)
                    if len(consumed_pids) >= 2:
                        break

                if len(consumed_pids) < 2:
                    break

                active_workers_count += 1
                recipe_tier = int(recipe.get("tier", 1))
                base_val = int(recipe.get("market_value_base", 120))
                base_pow = int(recipe.get("base_power", 20))
                slot = recipe.get("slot", "Arma")

                white_label_item = {
                    "item_instance_id": str(uuid.uuid4()),
                    "name": f"{recipe.get('name', 'Artefato')} (White-label)",
                    "slot": slot,
                    "slot_type": slot,
                    "branch": branch,
                    "quality": "Normal",
                    "power_bonus": base_pow,
                    "energy_bonus": int(recipe.get("energy_restore", 0)),
                    "market_value_base": base_val,
                    "is_white_label": True,
                    "assembler_id": worker.get("worker_instance_id"),
                }

                sale_revenue = base_val
                if hasattr(self, "sales_service") and self.sales_service:
                    sale_res = self.sales_service.queue_auto_sale(white_label_item)
                    sale_revenue = sale_res.get("sale_price", base_val)

                total_assembly_revenue += sale_revenue
                items_produced.append({
                    "item_name": white_label_item["name"],
                    "sale_price": sale_revenue,
                    "worker_name": worker.get("name"),
                })

                base_xp = 10 if recipe_tier == 1 else (25 if recipe_tier == 2 else 60)
                xp_gain = max(1, int(base_xp * xp_rate))
                if not hasattr(self.state, "workshop_xp") or not isinstance(self.state.workshop_xp, dict):
                    self.state.workshop_xp = {"Ferragem": 0, "Alquimia": 0, "Joalheria": 0, "Culinária": 0}
                self.state.workshop_xp[branch] = self.state.get_workshop_xp(branch) + xp_gain

        return {
            "items_produced": items_produced,
            "assembly_sales_revenue": total_assembly_revenue,
            "workers_count": len(workers),
            "active_workers": active_workers_count,
        }



def _format_effect_label(effect: Dict[str, Any]) -> str:
    eff = effect.get("effect")
    val = effect.get("value")
    if eff == "power_flat":
        return f"Poder +{val}"
    elif eff == "power_pct":
        return f"Poder +{int(float(val) * 100)}%"
    elif eff == "energy_bonus_flat":
        return f"Suprimentos +{val}"
    elif eff == "charges_flat":
        return f"Cargas +{val}"
    elif eff == "value_pct":
        return f"Valor de Mercado +{int(float(val) * 100)}%"
    elif eff == "terrain_mitigation":
        terrain_names = {
            "toxic_swamp": "Pântano Tóxico",
            "glacier_frost": "Frio Glacial",
            "unstable_mine": "Mina Instável",
            "neutral": "Padrão",
        }
        return f"Protege contra {terrain_names.get(val, val)}"
    return f"{eff}: {val}"
