# HeroFoot — Prompts para o Antigravity (Ondas 0 e 1)

## Como usar

1. Salve `CONTRACT.md` em `docs/CONTRACT.md` antes de qualquer coisa.
2. Rode os prompts na ordem abaixo. Cada prompt começa com o **Preâmbulo comum**, colado antes do texto do prompt.
3. Se o Antigravity permitir workspaces ou branches por agente, use um por prompt. Os agentes da Onda 1 rodam em paralelo.

```
ONDA 0 (base)
  P0.1 Tech Lead ──► P0.2 Data Architect ─┐
                 └─► P0.3 Controller ─────┴─► P0.4 Front
ONDA 1 (paralela, depois da Onda 0 integrada)
  P1.2 Match Engine    P1.3 Craft    P1.4 Balcão    P1.5 Tática    P1.1 Save
  Ordem de merge: P1.5 → P1.3 → P1.4 → P1.2 → P1.1
ONDA 1b
  P1.6 Front (telas de save e reservas)
```

P0.2 e P0.3 podem rodar juntos porque o P0.3 normaliza nomes legados e novos.

Conflitos esperados em `server.py`, `league_engine.py` e `market_engine.py`: cada agente edita só o próprio bloco, e o Tech Lead resolve o merge.

---

## Preâmbulo comum (colar no início de todo prompt)

```
Você é um subagente do HeroFoot. Antes de começar, leia ORCHESTRATOR_INSTRUCTIONS.md e docs/CONTRACT.md.
O CONTRACT.md vence qualquer texto divergente.

Regras:
1. Nenhum valor de regra ou balanceamento hardcoded em .py. Tudo em data/*.json, lido por código.
2. Só edite os arquivos listados em "Pode tocar". Se precisar de outro, pare e reporte ao Tech Lead.
3. Termos proibidos em texto de jogo: gol, gramado, estádio, escanteio, bilheteria, "Brasfoot", jargão tecnológico moderno.
   Tom: fantasia corporativa 7/10 (mundo sério, frieza burocrática).
4. Aleatoriedade só via random.Random injetável. Nada de random global em regra de jogo.
5. Escreva testes unittest em tests/. O comando `python -m unittest discover tests` deve passar por inteiro,
   inclusive os testes dos outros agentes.
6. Não mude endpoints nem chaves de resposta existentes. Chaves novas são aditivas.
7. Ao terminar, responda com: (a) arquivos alterados, (b) decisões tomadas fora do contrato,
   (c) pendências e riscos, (d) como testar manualmente.
```

---

# ONDA 0 — Base

## P0.1 — Tech Lead (Centralizador)

**Depende de:** nada. **Pode tocar:** `ORCHESTRATOR_INSTRUCTIONS.md`, `IDEAS_BACKLOG.txt`, `docs/`.
**Proibido:** qualquer `.py`, `.json` de `data/`, `frontend/`.

**Tarefa.** Alinhe o `ORCHESTRATOR_INSTRUCTIONS.md` ao `docs/CONTRACT.md`. Aplique estas edições:

1. Seção 2, Fase 3: trocar "5 a 6 titulares/reservas" por "Party de 6 titulares e até 3 na Reserva".
2. Seção 3, Atributos: substituir "O Poder é distribuído entre esses atributos" por:
   - os atributos são gerados primeiro;
   - o Poder (1–100) é a média ponderada pelos pesos da especialização, vezes o encaixe das habilidades;
   - o potencial e a idade governam o crescimento e o declínio dos atributos, não o Poder direto.
3. Seção 5, Motor de Simulação: manter "roda até a energia zerar" (é a intenção do design: partida de duração variável) e detalhar conforme a seção 4 do contrato:
   - salas em sequência até os Suprimentos zerarem, com salas vazias e encontros;
   - o Boss só é resolvido para quem chega a ele;
   - Poder da equipe = média sobre 6 vagas;
   - bônus de slots limitado;
   - terreno em percentual.
4. Mapa de subagentes, Data Architect: atualizar a lista de arquivos para:
   - `hero_schema.json`, `classes_seed.json` (classes + especializações);
   - `workshops_seed.json` (substitui `specializations_seed.json`);
   - `balance_seed.json`, `guilds_seed.json`, `materials_seed.json`, `market_templates_seed.json`;
   - `dungeons_seed.json`, `items_seed.json`, `recipes_seed.json`.
5. Acrescentar duas regras invioláveis:
   - todo atributo novo do `GameState` entra em `SERIALIZED_FIELDS`;
   - todo número de balanceamento vive em `balance_seed.json`.
6. Acrescentar a stack: backend Python `http.server`, frontend React + TypeScript.
7. Checklist de validação: acrescentar "[ ] Aleatoriedade injetável e semeada" e "[ ] Testes passando".
8. `IDEAS_BACKLOG.txt`, item 3: "Magos de TI e Orcs de Vendas" quebra as regras de humor da própria seção 1. Reescreva com exemplos coerentes, por exemplo "apenas Magos de Escritório de Guerra e Guerreiros de Vanguarda".

**Aceite.** Mostre o diff. Nenhuma frase do orquestrador pode contradizer o contrato (busque por "5 salas", "5 a 6", "Gol", "gramado").

---

## P0.2 — Data Architect

**Depende de:** P0.1 (pode começar em paralelo). **Pode tocar:** `data/*.json`, `tests/test_seeds.py`.
**Proibido:** `.py` de produção, `frontend/`.

**Tarefa.** Deixar os seeds consistentes entre si e com o contrato.

1. **`balance_seed.json` (novo).** Blocos e valores iniciais **[provisório]**:
   - `party`: `starters 6`, `reserves 3`.
   - `expedition`:
     - `max_rooms 10` (a última é o Boss), `base_energy 100`, `base_energy_cost_per_room 10`;
     - `room_cost_variance 0.25`, `room_encounter_probability 0.65`, `solo_clear_base 0.6`;
     - `agi_energy_reduction_max 0.20`;
     - `miniboss_draw_margin 0.08`, `miniboss_points 1`;
     - `boss_threshold_pct 0.15`, `boss_win_points 2`, `boss_joint_points 1`.
   - `loadout`: `slot_bonus_factor 0.15`, `slot_bonus_cap 15`.
   - `fatigue`:
     - `gain_per_expedition 20`, `recovery_per_week 20`;
     - `fatigued_threshold 70`, `recovered_threshold 50`;
     - `power_penalty_max 0.30`.
   - `economy`: `initial_gold 1000`, `weekly_maintenance 50`, `base_expedition_revenue 250`.
   - `sales`:
     - `margin_rates {"Promoção": 0.8, "Preço Justo": 1.0, "Preço Abusivo": 1.35}`;
     - `buyer_tolerance_min 1.0`, `buyer_tolerance_max 1.5`, `counter_zone 0.15`;
     - `bulletin_chance 0.35`, `bulletin_multiplier_min 1.5`, `bulletin_multiplier_max 3.0`.
   - `rival`: `default_slot_bonus 6`, `mitigation_probability 0.5`.
   - `provisional_rescale_factor 0.55`.
2. **`workshops_seed.json` (novo).**
   - Os 4 ramos com id e rótulo.
   - Para os níveis 1 a 6, as probabilidades de qualidade em percentual, copiadas da tabela de `crafting.py`.
   - Multiplicadores de qualidade: 0,70 / 1,00 / 1,35 / 1,80.
   - Custo de upgrade por nível (1→2 … 5→6): 500, 900, 1600, 2800, 5000 **[provisório]**.
3. **`classes_seed.json` (reestruturar)** para `{ "classes": [...], "specializations": [...] }`.
   - Classes: `class_warrior`, `class_rogue`, `class_mage`, `class_cleric`.
   - Especializações (pesos somam exatamente 1,0):

   | id | str | agi | vit | int | wis | lck |
   |---|---|---|---|---|---|---|
   | `spec_warrior_berserker` | .45 | .15 | .25 | 0 | .05 | .10 |
   | `spec_warrior_swordsman` | .25 | .35 | .20 | .05 | .05 | .10 |
   | `spec_rogue_archer` | .10 | .40 | .10 | .05 | .10 | .25 |
   | `spec_rogue_assassin` | .25 | .35 | .05 | .05 | .05 | .25 |
   | `spec_mage_pyromancer` | .05 | .10 | .10 | .50 | .15 | .10 |
   | `spec_cleric_support` | .05 | .10 | .20 | .15 | .40 | .10 |

   Cada especialização tem `id`, `class_id`, `name`, `description` e `stat_weight_profile`.
   Isso corrige o Berserker (que deve valorizar STR e VIT sobre AGI) e o Espadachim (AGI acima de VIT).
4. **`hero_schema.json` (atualizar).** Manter `additionalProperties: false`. Campos planos:
   - `id`, `name`, `class_id`, `specialization_id`, `age` (16–45), `level`, `xp` (padrão 0);
   - `current_power` (1–100), `status` (enum canônico), `fatigue` (0–100), `salary`;
   - `injured`, `injury_weeks_left`;
   - `hidden_attributes` (cada um de 1 a 100) e `potential`.
   - Remover `stat_weight_profile` (deriva da especialização) e `class_name` (deriva da classe).
5. **`team.json` (migrar).**
   - Adicionar `specialization_id` e `age` (33, 24, 29, 19, 31), remover `class_name` e `stat_weight_profile`.
   - Trocar `class_id` pelo id da nova classe.
   - Corrigir atributos 0 para 1.
   - Multiplicar `current_power` por `provisional_rescale_factor` (arredondar).
   - Renomear `hero_02` para "Seren Ironthorn, a Berserker".
6. **`guilds_seed.json` (novo).** Mover `DEFAULT_GUILDS` do `league_engine.py`, com `power_rating` × 0,55 arredondado. A guilda do jogador entra como campo separado `player_guild`.
7. **`materials_seed.json` e `market_templates_seed.json` (novos).** Mover `AVAILABLE_MATERIALS` e `READY_ITEM_TEMPLATES` do `market_engine.py`. Slots em pt-BR.
8. **`items_seed.json`.**
   - Slots em pt-BR, `energy_restore` vira `energy_bonus`, consumíveis ganham `charges` e `max_charges`.
   - Criar as bases que as receitas usam e faltam no catálogo: Cota de Malha, Amuleto de Guarda-Alma, Poção de Cura, Ração de Batalha, Runa de Proteção e Inscrição Térmica.
9. **`recipes_seed.json`.**
   - Acrescentar `base_item_id` apontando para `items_seed`.
   - `min_workshop_level` = 2 para `rec_06` e `rec_07`.
   - Nova receita `rec_08`: Selo de Firmeza Estrutural, Inscrição, Alquimia, nível 2, `terrain_mitigation: unstable_mine`.
10. **`dungeons_seed.json`.**
    - `power_penalty` vira `power_penalty_pct`: 0 no neutro e 0,12 nos demais.
    - `recommended_power` × 0,55 arredondado.
    - `dungeon_01`: nome "Vale dos Ecos Verdejantes", `terrain_label` "Campo Aberto Verdejante". Descrição sem "gramado", por exemplo "Terreno padrão da Liga, sem penalidades ambientais. Trilha seca em campo aberto verdejante."
    - Corrigir o typo "Emanaçoes".
11. **`shop_inventory_schema.json`.** Chaves de `workshop_levels` em pt-BR canônico (`Ferragem`, `Alquimia`, `Joalheria`, `Culinária`).
12. **`tests/test_seeds.py`.** Verifica:
    - todo JSON carrega;
    - pesos somam 1,0 ± 0,001;
    - slots, ramos e qualidades pertencem aos conjuntos canônicos;
    - todo `base_item_id` e todo material de receita existem;
    - refs de classe → especialização são válidas;
    - heróis validam contra `hero_schema.json` (validação manual, sem dependências novas);
    - nenhum termo proibido nos textos.

**Aceite.** Testes passando e nenhum termo proibido nos JSONs (`grep -ri "gramado" data/` vazio).

---

## P0.3 — UI & Controller (refatoração do backend)

**Depende de:** P0.1. **Pode tocar:** `controller.py`, `server.py`, `crafting.py`, `league_engine.py`, `market_engine.py`, `match_engine.py`, novos `constants.py`, `balance.py`, `game_state.py`, `counter_sales.py`, `services/*.py`, `tests/test_api_contract.py`, pasta `legacy/`.
**Proibido:** `data/*.json`, `frontend/`.

**Tarefa.** Dividir o `controller.py` (27 KB) **sem mudar o comportamento**, salvo as adaptações citadas.

1. `constants.py`: `SLOTS`, `BRANCHES`, `QUALITIES`, `STATUSES`, `MARGINS` canônicos, mais mapas legados (`blacksmithing → Ferragem`, `alchemy → Alquimia`, `jewelry → Joalheria`, `cooking → Culinária`, `Weapon → Arma`, `Armor → Armadura`, `Jewelry → Joia`, `Inscription → Inscrição`, `Consumable → Consumível`, `Abusivo → Preço Abusivo`, `energy_restore → energy_bonus`) e funções `normalize_*`. Aplicar a normalização ao carregar seeds e ao receber entrada do cliente.
2. `balance.py`: `get_balance()` carrega `data/balance_seed.json` uma vez.
3. `game_state.py`: `GameState` movido. Manter o comportamento atual e acrescentar `is_equipped(item_instance_id)`, `hero_by_id()`, e as listas `SERIALIZED_FIELDS` e `TRANSIENT_FIELDS` (vazias de lógica, só declaradas).
4. `services/`: `tactics_service.py`, `phase_service.py` (fases 1, 3, 4 e 5), `crafting_service.py`, `sales_service.py`, `market_service.py`. Cada método público do `GameController` delega para eles.
5. `controller.py` vira fachada. Todos os métodos e atributos usados por `server.py` continuam existindo.
6. `crafting.py`: extrair `CounterSales` para `counter_sales.py`. `Workshop.determine_quality` passa a ler as probabilidades de `workshops_seed.json`, sem mudar o algoritmo (a correção fica com P1.3).
7. `league_engine.py` lê `guilds_seed.json`. `market_engine.py` lê `materials_seed.json` e `market_templates_seed.json`.
8. Adaptação de `phase_4_dungeon` ao novo campo `power_penalty_pct`: penalidade = `round(pct × (base_power + bônus))`. O P1.2 refaz essa fase depois; aqui só evite quebrar.
9. `get_state()` acrescenta em cada herói `class_name`, `specialization_name` e `stat_weight_profile` calculados a partir dos seeds. O front atual continua funcionando.
10. Mover `ui.py` e `main.py` (terminal legado do MVP) para `legacy/`, com um `legacy/README.txt` de uma linha explicando. O ponto de entrada é `server.py`.
11. `tests/test_api_contract.py`: instancia o controller e percorre as 5 fases, um craft, uma compra de insumo, uma compra de item, uma venda e uma tática. Confere que as chaves de `get_state()` e de cada resposta são superconjunto das atuais.

**Aceite.**
- Servidor sobe (`python server.py`) e `/api/state` responde.
- Teste de contrato passando.
- `controller.py` com menos de 150 linhas.
- Nenhum `import` circular.

---

## P0.4 — UI (frontend)

**Depende de:** P0.3 integrado. **Pode tocar:** `frontend/src/**`.
**Proibido:** backend, `data/`.

**Tarefa.** Alinhar o frontend aos nomes canônicos, sem redesign.

1. `api.ts`: corrigir o comentário "FastAPI" (o backend é `http.server`). Tipar as respostas conforme o contrato.
2. `mockData.ts`: tipos e fallback com slots, ramos e margens canônicos, e `specialization_name` no herói.
3. `Phase2Workshop.tsx`: usar as chaves `Ferragem`, `Alquimia`, `Joalheria`, `Culinária`. Deixar de enviar `branch` no `/api/craft`.
4. `Phase3Tactics.tsx`: rótulos "Party (6)" e "Reserva (3)". A UI ainda envia só `starters`; as reservas ficam para o P1.6.
5. Varrer `frontend/src` por "gramado", "estádio", "gol", "bilheteria" e trocar por termos do contrato. O terreno neutro é "Campo Aberto Verdejante".
6. Onde houver "Rodada"/"Dia" duplicado no Header, exibir `week`.

**Aceite.** `npm run build` e `tsc --noEmit` sem erros. Fluxo completo das 5 fases funciona contra o backend real. Liste as telas que testou.

---

# ONDA 1 — Correções (paralelas)

## P1.5 — UI & Controller: validação de tática e loadout

**Depende de:** Onda 0. **Pode tocar:** `services/tactics_service.py`, `game_state.py` (só campo `reserves`), `server.py` (bloco `/api/tactics`), `tests/test_tactics.py`.

**Tarefa.** O servidor é a autoridade sobre escalação e equipamento.

1. `/api/tactics` aceita `starters` (até 6 ids), `reserves` (até 3 ids) e `loadout` (por slot, **somente `item_instance_id`**). Nunca aceitar o objeto do item enviado pelo cliente.
2. Validações, com mensagem de erro em tom corporativo:
   - ids existem e são únicos, e um herói não fica em `starters` e `reserves` ao mesmo tempo;
   - `injured` ou status `Afastado` não entram na Party nem na Reserva;
   - o item existe no inventário e pertence ao slot (`slot_type == slot`);
   - o mesmo item não ocupa dois slots.
3. Estado novo: `state.reserves`. Exposto em `get_state()["tactics"]["reserves"]`. Entra em `SERIALIZED_FIELDS`.
4. Escalação padrão inicial: os 6 aptos de maior Poder. As 3 reservas seguintes ficam em `reserves`.
5. Se uma escalação salva ficar inválida (herói ferido na Fase 1 seguinte, item vendido), `phase_1` remove o id inválido e registra no relatório.

**Aceite.** Testes: cliente que envia item forjado é rejeitado; slot trocado é rejeitado; ferido é rejeitado; 7 titulares são rejeitados; a escalação padrão tem 6 + 3.

---

## P1.3 — Craft & Shop: oficina

**Depende de:** Onda 0. **Pode tocar:** `crafting.py`, `services/crafting_service.py`, `server.py` (blocos `/api/craft` e novo `/api/upgrade_workshop`), `tests/test_crafting.py`.

**Tarefa.**

1. O ramo é sempre `recipe["branch"]`. O parâmetro `branch` do cliente é ignorado (se divergir da receita, ignorar sem erro). O nível usado é `state.workshop_levels[branch]`.
2. Rejeitar o craft se `nível < min_workshop_level` da receita, com mensagem de laudo de inspeção.
3. `determine_quality(level, rng)`: probabilidades de `workshops_seed.json`, RNG injetável, comparação por `<` (nunca sortear uma faixa de 0%). Incluir os níveis 2 e 4.
4. Novo `/api/upgrade_workshop {branch}`: custo vem de `workshops_seed.json`, o nível máximo é 6, falha por ouro insuficiente com mensagem clara, retorna o novo nível. Entra no `get_state()` via `workshop_levels`.
5. Multiplicadores de qualidade vêm do seed, não do código. `special_suffix_active` continua como flag (o efeito vem na Onda 3).
6. O fallback "Gororoba" vira função separada, ainda sem endpoint ("Cozinhando no Escuro" é da Onda 3).

**Aceite.** Testes: 10.000 crafts por nível batem a tabela com ±1,5 ponto percentual; nível 1 nunca gera Lendário; receita de Alquimia com `branch` enviado como Ferragem usa Alquimia; nível insuficiente é rejeitado; upgrade debita o ouro certo e para no nível 6.

---

## P1.4 — Craft & Shop: Balcão e Boletim de Mercado

**Depende de:** Onda 0. **Pode tocar:** `counter_sales.py`, `services/sales_service.py`, `market_engine.py` (Boletim), `services/market_service.py`, `server.py` (blocos `/api/sell` e `/api/resolve_offer`), `data/bulletins_seed.json` (novo), `tests/test_sales.py`.

**Tarefa.** Implementar a seção 5 do contrato.

1. `/api/sell` aceita `item_instance_id` e `margin_type`. **Ignora qualquer `base_price` do cliente.** A referência é o `market_value_base` do item, lido no servidor.
2. Recusar a venda se `state.is_equipped(item_instance_id)`.
3. A resolução segue o contrato: tolerância oculta do comprador sorteada por anúncio, com RNG injetável. As taxas e a `counter_zone` vêm de `balance_seed.json`. A resposta traz `reference_price`, `asked_price` e `demand_multiplier`. Nunca expor a tolerância.
4. Boletim de Mercado:
   - em `refresh_market`, com chance `bulletin_chance`, sortear um alvo (um slot) e um multiplicador entre min e max;
   - o Boletim dura a semana e se expõe em `get_state()["market"]["bulletin"] = {target, multiplier, headline}`;
   - `bulletins_seed.json` traz de 6 a 8 manchetes em tom corporativo, por exemplo "Ruptura de fornecimento eleva a demanda por Armaduras junto à Câmara dos Mercadores.";
   - a demanda multiplica o preço pedido e o preço da contraproposta.
5. `set_market_speculation` deixa de ser um setter global sem uso e vira parte do fluxo (demanda por item).
6. Contrapropostas pendentes continuam removendo o item do inventário. Ao rejeitar, o item volta uma única vez (sem duplicar).

**Aceite.** Testes: Promoção e Preço Justo vendem sempre; Preço Abusivo em 10.000 anúncios fica em cerca de 30% vende, 30% contraproposta e 40% não vende (±3); `base_price` forjado não altera o resultado; item equipado não vende; com Boletim ×3 o ouro recebido triplica; rejeitar e reaceitar não duplica item.

---

## P1.2 — Match Engine: motor de expedição

**Depende de:** Onda 0. **Pode tocar:** `match_engine.py`, `services/phase_service.py` (só a Fase 4), `league_engine.py` (só `simulate_ai_match`), `tests/test_match_engine.py`.

**Tarefa.** Implementar a seção 4 do contrato, lendo tudo de `balance_seed.json`. A partida tem duração variável: roda até os Suprimentos zerarem.

1. **Poder da equipe.**
   - `Poder_Base_Equipe` = soma do Poder efetivo dos titulares dividida por 6 (vaga vazia vale 0).
   - Poder efetivo do herói = `current_power × (1 − fatigue.power_penalty_max × fadiga/100)`.
2. **Bônus de slots.** `min(Σ power_bonus × slot_bonus_factor, slot_bonus_cap)`.
3. **Terreno.** Penalidade percentual (`power_penalty_pct`) e custo extra de Suprimentos só se nenhum item equipado tiver a `terrain_mitigation` exigida.
4. **Suprimentos.**
   - Início: `base_energy` + `energy_bonus` do Consumível.
   - Custo por sala: `base × variação_da_sala × (1 − agi_energy_reduction_max × AGI_média/100) + extra_terreno`. A variação é sorteada por sala em ±`room_cost_variance`, com RNG semeado, e vale para as duas guildas na mesma sala. A AGI média é a dos titulares, de `hidden_attributes.agi`.
   - A guilda só entra numa sala com energia acima de 0. Ao zerar, encerra a incursão e deixa de pontuar. Isso substitui a lógica atual de `break` e a ideia de penalidade por exaustão.
5. **Salas.** Sequência de 1 a `max_rooms`. A última é o Boss. Cada sala sorteia se há encontro (`room_encounter_probability`). Sala sem encontro é vazia e entra no relatório como "Sala sem ocorrências".
6. **Mini-Boss.**
   - Duas guildas presentes: probabilidade pela razão de Poder Efetivo, com margem de empate `miniboss_draw_margin`, como hoje.
   - Uma guilda presente: `clamp(solo_clear_base × PoderEfetivo / recommended_power, 0.05, 0.95)`, com `recommended_power` lido da masmorra.
7. **Boss Final.**
   - Duas presentes: regra dos 15% sobre o maior Poder Efetivo (+2 ou Abate Conjunto).
   - Uma presente: enfrenta sozinha e leva +2 se o Poder Efetivo for maior ou igual a `recommended_power`. Caso contrário, não pontua.
   - Nenhuma presente: sem Boss.
8. **Fim da partida.** Quando as duas guildas esgotam os Suprimentos ou o Boss é resolvido. O relatório informa quantas salas cada guilda percorreu e por que a incursão terminou ("Suprimentos esgotados" ou "Boss resolvido").
9. **Rival.** Poder = `power_rating` da guilda. Bônus de slots = `rival.default_slot_bonus`. Cada rival mitiga o terreno com probabilidade `rival.mitigation_probability`, sorteada com RNG semeado. Some o `+10` hardcoded. A AGI média do rival vem de um valor abstrato derivado do `power_rating` (`AGI_rival = power_rating`) até a Onda 2 gerar rosters.
10. **Jogos entre IAs.** `simulate_ai_match` deixa de ter fórmula própria e usa `MatchEngine` em modo rápido (sem `match_log`), com as mesmas regras. A masmorra da rodada vale para todos os jogos da Liga.
11. **Determinismo.** `MatchEngine(rng=...)`. A Fase 4 semeia com `hash(world_seed, week, "expedition")`. Se `world_seed` ainda não existir no estado, criá-lo (o P1.1 o serializa).
12. **Consumível.** O número de cargas usa `max_charges` do item, sem "3" fixo.
13. **Fadiga.** Ganho por expedição e limiares vêm de `balance_seed.json`. Reservas que não jogaram recuperam fadiga na Fase 1 (regra atual mantida).
14. Não persistir `match_log` nem `room_events` no estado. Eles existem só na resposta da Fase 4, que a UI usa para mostrar a partida.

**Aceite.** Testes:
- mesma semente produz o mesmo resultado, e sementes diferentes produzem partidas diferentes;
- uma guilda com energia 0 nunca pontua em salas posteriores;
- o Boss só é resolvido por quem chega a ele, e nunca pontua para uma guilda sem energia;
- terreno sem mitigação e sem Consumível reduz o número médio de salas percorridas;
- Consumível e AGI alta aumentam o número médio de salas percorridas;
- times de Poder igual dão Abate Conjunto na maioria dos Bosses, e o Abate exclusivo só aparece com diferença acima de 15%;
- simulação em massa (10.000 partidas, Poder médio parecido) imprime a distribuição de placares e a taxa de chegada ao Boss, e reporta se cada meta de calibração do contrato ficou dentro ou fora da faixa (falha de meta não reprova o teste, só é reportada);
- `grep` não encontra números de regra hardcoded em `match_engine.py` e `phase_service.py`.

---

## P1.1 — UI & Controller: save e load

**Depende de:** Onda 0. Pode começar junto dos demais, mas o teste de round-trip só é aceito **depois** do merge de P1.5, P1.3, P1.4 e P1.2.
**Pode tocar:** `save_system.py` (novo), `game_state.py`, `controller.py`, `league_engine.py` e `market_engine.py` (só `to_dict/from_dict`), `server.py` (novos endpoints), `.gitignore`, `tests/test_save.py`.

**Tarefa.** Implementar a seção 6 do contrato.

1. `GameState.to_dict()` / `from_dict()` percorrem `SERIALIZED_FIELDS`. Incluir: ouro, semana, fase, heróis, inventário, materiais, níveis de oficina, tática (titulares, reservas, loadout), contrapropostas pendentes, `world_seed`.
2. `LeagueEngine` e `MarketEngine` ganham `to_dict/from_dict` (tabela, calendário, rodada atual, estoque e Boletim). Do placar da última rodada guardar só os pontos.
3. `save_system.py`:
   - `SAVE_VERSION = 1` e função de migração vazia, mas testada;
   - escrita atômica em `data/saves/slot_{1..3}.json` e `autosave.json`;
   - `list_saves()` com slot, semana, ouro e data;
   - `new_game(slot)` faz cópia profunda dos seeds. **Nunca escreve nos seeds.**
4. Endpoints: `GET /api/saves`, `POST /api/save {slot}`, `POST /api/load {slot}`, `POST /api/new_game {slot}`. Como o `server.py` usa um `controller` global, `load` e `new_game` devem trocar o estado **in place**, sem reatribuir a variável.
5. Autosave ao fim de cada `advance_phase`: grava no `active_slot`, ou em `autosave` se não houver slot ativo.
6. Adicionar `data/saves/` ao `.gitignore`.
7. Teste de cobertura: falha se algum atributo de `GameState` não estiver em `SERIALIZED_FIELDS` ou `TRANSIENT_FIELDS`.

**Aceite.** Testes:
- round-trip: `get_state()` antes e depois de salvar e carregar são iguais;
- arquivo corrompido ou de versão desconhecida retorna erro 400, sem derrubar o servidor;
- 30 semanas simuladas geram save com menos de 200 KB;
- o save não contém `match_log` nem `room_events`;
- `team.json` e demais seeds permanecem byte a byte idênticos após um jogo salvo.

---

# ONDA 1b

## P1.6 — UI (frontend): saves e reservas

**Depende de:** P1.1 e P1.5 integrados. **Pode tocar:** `frontend/src/**`.

**Tarefa.**
1. Tela ou modal de Menu da Guilda no Header com Novo Jogo, Salvar, Carregar (slots 1–3 e autosave, mostrando semana e ouro) e confirmação antes de sobrescrever.
2. `Phase3Tactics.tsx`: Party de 6 e Reserva de 3, com bloqueio visual e mensagem para heróis feridos. Enviar `reserves` e usar somente `item_instance_id` no loadout.
3. Exibir o erro do servidor em tom corporativo, sem mensagens genéricas.
4. Exibir o Boletim de Mercado (`market.bulletin`) como pop-up esporádico, respeitando a regra de notícias do orquestrador.

**Aceite.** `npm run build` e `tsc --noEmit` sem erros. Fechar e reabrir o servidor e carregar o save restaura a tela exatamente como estava.
