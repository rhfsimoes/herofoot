# HeroFoot — Crafting v2: especificação e prompts

Adendo ao `docs/CONTRACT.md`. **Executar depois da Onda 1 integrada** (P1.3 e P1.4 no mínimo), porque toca `crafting.py`, `crafting_service.py`, `market_engine.py` e a tela da Oficina.

## 1. Como o jogador vive isso

1. Na Oficina, escolhe uma **base** (ex.: Espada Longa de Aço).
2. Abre dois seletores: **Prefixo** e **Sufixo**. Cada um tem a opção "Sem prefixo" / "Sem sufixo", então dá para craftar com um, com outro, com os dois ou com nenhum.
3. Só aparecem afixos que o jogador **conhece** e que valem para aquela base. Os que faltam material ficam bloqueados, dizendo o que falta. Um contador informa "N afixos por descobrir".
4. Uma prévia mostra o nome final, o custo total em materiais e os números em cada qualidade (Fraco a Lendário) com as chances da oficina.
5. Clicar em qualquer material (Mercado, Inventário, Oficina) abre a **ficha do material**: usado em quais receitas, que afixos habilita, onde se obtém.

**Espólio.** Como a masmorra da semana não é escolhida pelo jogador, a ficha mostra as fontes de espólio só como informação. O terreno da semana aparece destacado, o que incentiva montar uma Party mais forte para chegar às salas fundas (as `material_sources` dependem de quantas salas a guilda percorreu e de o Boss ter sido alcançado). O espólio só entra em jogo na Onda 3 (Fase 5).

## 2. Modelo de dados (material no centro)

Todos os materiais são matéria-prima. Ids em texto (`mat_iron_ore`). Cada fato mora em **um só arquivo**, e os índices reversos ("receitas que usam o material") são montados em memória ao carregar.

| Arquivo (`data/`) | Conteúdo |
|---|---|
| `materials_seed.json` | id, nome, categoria |
| `material_values_seed.json` | preço, faixa de quantidade e variação no mercado |
| `recipes_seed.json` | receitas de **base**: slot, ramo, gênero, poder base, valor, nível mínimo, liberação |
| `recipe_ingredients_seed.json` | receita ↔ material × quantidade |
| `affixes_seed.json` | prefixos e sufixos: nome (prefixo tem masculino e feminino), liberação |
| `material_affixes_seed.json` | material + slot (+ receita opcional) → afixo, com a quantidade gasta |
| `affix_effects_seed.json` | efeitos numéricos do afixo, com efeito extra opcional só em Lendário |
| `material_sources_seed.json` | espólio por terreno: chance, quantidade, sala mínima alcançada, só no Boss |
| `catalog_meta.json` | `catalog_version` |

Substituições: `items_seed.json` é aposentado. `rec_06`, `rec_07` e `rec_08` viram uma só receita, `rec_06` (Runa de Proteção). A proteção de terreno passa a vir dos **prefixos** da Inscrição (Purificada, Ígnea, Firme), então escolher o afixo é a decisão estratégica do slot 4.

## 3. Regras de cálculo

Vocabulário fechado de efeitos: `power_flat`, `power_pct`, `energy_bonus_flat`, `charges_flat`, `value_pct`, `terrain_mitigation`. O motor de expedição não muda, porque o item continua com os mesmos campos (`power_bonus`, `energy_bonus`, `charges`, `terrain_mitigation`, `market_value_base`).

```
efeitos = os do prefixo + os do sufixo escolhidos
          (linhas com requires_quality só contam se a qualidade for a exigida: Lendário)
power_bonus       = round( (base_power + Σ power_flat) × (1 + Σ power_pct) × mult_qualidade )
energy_bonus      = round( (energy_restore_da_base + Σ energy_bonus_flat) × mult_qualidade )   # só Consumível
charges           = charges_da_base + Σ charges_flat                                          # sem multiplicador
market_value_base = round( valor_da_base × (1 + Σ value_pct) × mult_qualidade )
terrain_mitigation= o do prefixo, se houver (no máximo um por item)
nome              = [prefixo no gênero da base] + base + [sufixo]      (partes ausentes são omitidas)
```

O item é gravado como **foto** dos números no momento do craft, junto com `recipe_id`, `prefix_id`, `suffix_id`, `prefix_material_id`, `suffix_material_id`, `quality` e `catalog_version`. Assim o motor, o Balcão e o save continuam lendo os mesmos campos. Uma função `rehydrate_item()` recalcula a partir dos ids, para o caso de um rebalanceamento futuro.

Valores de referência para os testes (multiplicadores 0,70 / 1,00 / 1,35 / 1,80):

| Caso | Qualidade | Resultado |
|---|---|---|
| `rec_01` + `pref_afiada` + `suf_acidente_trabalho` | Fraco | Poder 23, valor 210 |
| | Normal | Poder 33, valor 300 |
| | Lendário | Poder 65, valor 540 |
| `rec_04` + `pref_concentrada` + `suf_prontuario` | Normal | Suprimentos 33, cargas 4, valor 180 |
| | Lendário | Suprimentos 77, cargas 4, valor 324 |
| `rec_06` + `pref_ignea` (sem sufixo) | Normal | Poder 12, protege Frio Glacial, valor 252 |
| | Lendário | Poder 22, valor 454 |
| `rec_03` sem afixos | Normal | Poder 20, valor 220 |

## 4. Catálogo inicial (27 afixos, valores provisórios)

O `value_pct` de cada afixo é o mínimo que cobre o custo do material com 25% de margem (o teste de integridade exige isso).

### Prefixos

| Nome | Slot | Material | Efeito | Se Lendário | Liberação |
|---|---|---|---|---|---|
| Afiado/Afiada | Arma | 1× Minério de Ferro | Poder +10%, Valor +10% | — | início |
| Temperado/Temperada | Arma | 1× Brasa de Carvão | Poder +15%, Valor +15% | — | Manual (300 G) |
| Reforçado/Reforçada | Armadura | 1× Minério de Ferro ou 1× Pó de Granito | Poder +10%, Valor +15% | — | início |
| Escamado/Escamada | Armadura | 1× Couro Escamoso | Poder +15%, Valor +20% | — | Manual (300 G) |
| Robusto/Robusta | Armadura | 1× Pó de Granito | Poder +4, Valor +20% | — | Manual (250 G) |
| Encantado/Encantada | Joia | 1× Cristal de Mana | Poder +12%, Valor +40% | — | início |
| Vigoroso/Vigorosa | Joia | 1× Mel Silvestre | Poder +3, Valor +25% | — | espólio (futuro) |
| Concentrado/Concentrada | Consumível | 1× Erva de Eucalipto | Suprimentos +8, Valor +25% | — | início |
| Nutritivo/Nutritiva | Consumível | 1× Farinha de Trigo | Suprimentos +5, Valor +15% | — | início |
| Saboroso/Saborosa | Consumível | 1× Mel Silvestre | Suprimentos +10, Valor +35% | — | Manual (200 G) |
| Farto/Farta | Consumível | 2× Farinha de Trigo | Cargas +1, Valor +30% | — | Manual (350 G) |
| Purificado/Purificada | Inscrição | 1× Erva de Eucalipto | Protege: Pântano Tóxico, Valor +15% | — | início |
| Ígneo/Ígnea | Inscrição | 1× Brasa de Carvão | Protege: Frio Glacial, Valor +20% | — | início |
| Firme | Inscrição | 1× Pó de Granito | Protege: Mina Instável, Valor +20% | — | Manual (250 G) |

### Sufixos

| Nome | Slot | Material | Efeito | Se Lendário | Liberação |
|---|---|---|---|---|---|
| do Acidente de Trabalho | Arma | 1× Minério de Ferro | Poder +5, Valor +10% | Poder +10% | início |
| do Termo de Responsabilidade | Arma | 2× Minério de Ferro | Poder +3, Valor +25% | Poder +8% | Manual (250 G) |
| da Cláusula de Rescisão | Arma | 1× Brasa de Carvão | Poder +12%, Valor +15% | Poder +12% | espólio (futuro) |
| do Laudo Pericial Aprovado | Armadura | 1× Couro Escamoso | Poder +4, Valor +20% | Poder +10% | início |
| do Seguro de Vida Complementar | Armadura | 1× Cristal de Mana | Poder +6, Valor +35% | Poder +12% | Manual (300 G) |
| do Adicional de Insalubridade | Joia | 1× Cristal de Mana | Poder +2, Valor +40% | Poder +8% | início |
| do Adicional Noturno | Joia | 1× Mel Silvestre | Poder +8%, Valor +25% | Poder +8% | Manual (350 G) |
| do Prontuário Médico Padrão | Consumível | 1× Erva de Eucalipto | Cargas +1, Valor +25% | Suprimentos +10 | início |
| da Produtividade Sem Pausa | Consumível | 1× Farinha de Trigo | Suprimentos +6, Valor +15% | Cargas +1 | início |
| do Protocolo de Evacuação | Consumível | 1× Mel Silvestre | Suprimentos +8, Valor +35% | Cargas +1 | espólio (futuro) |
| do Alvará de Funcionamento | Inscrição | 1× Cristal de Mana | Poder +5, Valor +35% | Poder +10% | início |
| do Antídoto de Eucalipto | Inscrição | 1× Erva de Eucalipto | Poder +3, Valor +15% | Poder +10% | início |
| da Prevenção à Hipotermia | Inscrição | 1× Brasa de Carvão | Poder +3, Valor +20% | Poder +10% | início |

Todos os materiais: Minério de Ferro, Couro Escamoso, Cristal de Mana, Erva de Eucalipto, Farinha de Trigo, Brasa de Carvão, Pó de Granito e Mel Silvestre. Desde o início, cada base tem ao menos um prefixo e um sufixo conhecidos, e Pântano e Glacial são mitigáveis. A Mina Instável exige o Manual do prefixo Firme. Afixos de espólio ficam bloqueados até a Onda 3.

## 5. API (aditiva, nada existente é removido)

| Método e rota | Função |
|---|---|
| `GET /api/craft_options?recipe_id=` | Base, ingredientes (com quanto o jogador tem), prefixos e sufixos conhecidos com `available`, materiais faltantes e efeitos em texto, e a contagem de afixos por descobrir |
| `POST /api/craft_preview` | Recebe `recipe_id`, `prefix_id?`, `suffix_id?`, `prefix_material_id?`, `suffix_material_id?`. Devolve nome, custo total, `can_craft` com motivos, números por qualidade e as chances da oficina |
| `POST /api/craft` | Mesmos campos. Sem afixos, produz a base pura |
| `POST /api/learn_affix` | Compra de Manual de Ofício pelo `unlock.cost` |
| `GET /api/material?id=` | Ficha: usado em, habilita, fontes (com rótulo de terreno) e oferta atual do mercado |

Também: `get_state()` ganha `known_affixes`, `known_recipes`, `catalog_version` e `market.affix_manuals` (até 2 Manuais desconhecidos por semana). Quando o material do afixo tem alternativas, o servidor usa a primeira que o jogador possa pagar, se o cliente não indicar.

## 6. Fora de escopo agora

- Loot da Fase 5 e sorteio da masmorra da semana. Hoje ela gira em ciclo fixo por semana, e o sorteio semeado entra com o Loot.
- "Cozinhando no Escuro" (combinações de 3 ingredientes descobrindo afixos) e o defeito cômico do Fraco.
- Afixos com bônus de atributos para a party.

---

## Prompts

Cole o **Preâmbulo comum** antes de cada um. Ordem: P3.1, depois P3.2, depois P3.3. Antes de tudo, copie a pasta `craft_v2_seeds/` para `docs/craft_v2_seeds/`.

### P3.1 — Data Architect: instalar o catálogo

**Pode tocar:** `data/*.json`, `tests/test_seeds.py`, `tests/test_catalog.py`. **Proibido:** `.py` de produção, `frontend/`.

1. Copie os 9 JSONs de `docs/craft_v2_seeds/` para `data/`, sobrescrevendo `materials_seed.json` e `recipes_seed.json`. Copie `test_catalog.py` para `tests/`.
2. Aposente `data/items_seed.json` e atualize `tests/test_seeds.py` (referências a `items_seed`, a `base_item_id`, a `rec_07`/`rec_08` e ao formato antigo de `recipes_seed`). Atualize `craft_recipe_schema.json` para a receita de base nova.
3. `data/balance_seed.json`: acrescente `crafting: { "manual_offer_count": 2 }`.
4. Liste em `docs/CONTRACT.md` (seção 7) a decisão D13: Crafting v2, catálogo normalizado com material no centro.

**Aceite:** `python -m unittest discover tests` passa. Rode `test_catalog.py` sem a variável `HEROFOOT_DATA_DIR`, porque o teste usa `data/` por padrão. Liste o que foi apagado.

### P3.2 — Craft & Shop: backend

**Depende de:** P3.1, P1.3, P1.4. **Pode tocar:** `catalog.py` (novo), `item_resolver.py` (novo), `crafting.py`, `services/crafting_service.py`, `services/market_service.py`, `market_engine.py`, `game_state.py` (campos novos), `server.py` (rotas do §5), `tests/test_crafting_v2.py`. **Proibido:** `match_engine.py`, `frontend/`.

1. `catalog.py`: carrega as tabelas e monta os índices em memória (receitas por material, afixos por material, afixos por receita e slot, fontes por material, ingredientes por receita). Nada de regra hardcoded.
2. `item_resolver.py`: `resolve_item(recipe_id, prefix_id, suffix_id, quality)` conforme a §3, `build_name()` e `rehydrate_item()`.
3. Estado novo: `known_affixes` e `known_recipes`, iniciados a partir dos afixos e receitas com `unlock.method == "start"`. Entram em `SERIALIZED_FIELDS`.
4. Craft: consome os ingredientes da base **mais** o material de cada afixo escolhido. Valida nível de oficina do ramo da receita, afixo conhecido, afixo válido para o slot e para a `recipe_id` (quando a ligação restringe), prefixo sendo prefixo e sufixo sendo sufixo, materiais suficientes. Mensagens de erro em tom corporativo. O sorteio de qualidade continua sendo o do P1.3 (RNG injetável).
5. Rotas do §5. `learn_affix` só vale para `unlock.method == "market"`, debita o ouro e adiciona o id em `known_affixes`.
6. `market_engine.refresh_market`: passa a juntar `materials_seed.json` com `material_values_seed.json` (o formato antigo do seed de materiais mudou) e sorteia `crafting.manual_offer_count` Manuais entre os afixos de mercado ainda desconhecidos, expostos em `market.affix_manuals`.
7. Compatibilidade: `get_state()["recipes"]` continua existindo, agora no formato novo com `ingredients` montados a partir da tabela. Itens de mercado prontos (sem `prefix_id`) seguem funcionando como estão.

**Aceite (testes):**
- os valores de referência da §3 batem exatamente;
- craft consome base + afixos e rejeita material insuficiente, afixo desconhecido, afixo de outro slot ou de outra receita e prefixo no lugar de sufixo;
- "Sem afixos" produz a base pura com o nome da base;
- o efeito extra do sufixo só existe em Lendário;
- nenhum item tem mais de uma `terrain_mitigation`;
- `learn_affix` debita o ouro certo e não vale para afixo de `start` ou de `loot`;
- round-trip de save mantém `known_affixes` (se o P1.1 já estiver integrado).

### P3.3 — UI (frontend): Oficina, ficha do material e Manuais

**Depende de:** P3.2. **Pode tocar:** `frontend/src/**`.

1. `Phase2Workshop.tsx`: lista de bases conhecidas. Ao selecionar uma, painel com seletores de Prefixo e Sufixo (cada um com "Sem prefixo"/"Sem sufixo"), cartões de opção mostrando nome, efeitos, materiais com "tem/precisa" e estado bloqueado com o motivo ("Falta 1× Brasa de Carvão"). Contador "N afixos por descobrir".
2. Prévia ao vivo via `/api/craft_preview`: nome final, custo total, tabela de números por qualidade e as chances da oficina. O botão Forjar fica desabilitado com o motivo. Manter o Laudo de Inspeção e o modal de Forja Lendária existentes.
3. Ficha do material (popover ou painel) aberta ao clicar em qualquer material em Mercado, Inventário e Oficina, via `/api/material`. Mostra "Usado em", "Habilita" e "Espólio possível", destacando o terreno da semana como "Clima desta semana". Rótulos de terreno pelo helper do P0.6.
4. Mercado: seção "Manuais de Ofício" com `market.affix_manuals` e botão de compra (`/api/learn_affix`).
5. Nenhum id técnico visível em nenhuma tela. Itens no inventário mostram o nome composto e as linhas de efeito.

**Aceite:** `npm run build` e `tsc --noEmit` sem erros. Fluxo manual: escolher a Espada, craftar só com prefixo, só com sufixo, com os dois e sem nenhum. Comprar um Manual e ver o afixo aparecer no seletor. Abrir a ficha de "Brasa de Carvão" e conferir as fontes. Liste as telas conferidas.
