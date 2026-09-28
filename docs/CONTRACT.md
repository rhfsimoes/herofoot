# HeroFoot — Contrato Técnico v0.2

> Salvar em `docs/CONTRACT.md`. É a fonte única de decisões. Se este arquivo e o código divergirem, o código está errado, a menos que o Tech Lead atualize o contrato.
> Itens marcados **[provisório]** são valores iniciais a validar na simulação em massa (Onda 4).

## 1. Stack e arquitetura

- Backend em Python, biblioteca padrão (`server.py` com `http.server`). Não migrar de framework sem decisão explícita. O comentário "FastAPI" em `frontend/src/api.ts` está desatualizado e deve ser corrigido.
- Frontend em React + TypeScript + Vite + Tailwind (`frontend/src`).
- Todo valor de balanceamento vive em `data/*.json`. Nenhum número de regra fica hardcoded em `.py`.
- O controller é uma fachada fina. A lógica fica em `services/*.py`.
- Testes com `unittest` da biblioteca padrão, em `tests/`. Comando: `python -m unittest discover tests`.
- Aleatoriedade sempre por `random.Random` injetável, semeado a partir de `world_seed` + semana + finalidade. Nenhum `random.*` global em regra de jogo.

## 2. Nomes canônicos

| Conceito | Valores canônicos |
|---|---|
| Slots | `Arma`, `Armadura`, `Joia`, `Inscrição`, `Consumível` |
| Ramos da oficina (chaves de `workshop_levels`) | `Ferragem`, `Alquimia`, `Joalheria`, `Culinária` |
| Qualidades | `Fraco`, `Normal`, `Ótimo`, `Lendário` |
| Margens do Balcão | `Promoção`, `Preço Justo`, `Preço Abusivo` (aceitar `Abusivo` só na entrada, por legado) |
| Status de herói | `Apto`, `Fatigado`, `Afastado` |
| Terrenos (ids técnicos) | `neutral`, `toxic_swamp`, `glacier_frost`, `unstable_mine` |
| Grupo de 6 em campo / 3 de apoio | **Party** / **Reserva** |
| Conjunto de todos os heróis | **Guilda** |
| Terreno neutro (rótulo) | **Campo Aberto Verdejante** |

Convenções:

- Ids técnicos em `snake_case` ASCII. Rótulos exibidos em pt-BR.
- Campo de energia de item: `energy_bonus`. O nome legado `energy_restore` só existe na leitura de seeds antigos.
- Instância de item: `item_instance_id`, `name`, `slot_type`, `quality`, `power_bonus`, `energy_bonus`, `terrain_mitigation`, `charges`, `max_charges`, `market_value_base`, `branch`.
- Termos proibidos em texto de jogo: gol, gramado, estádio, escanteio, bilheteria, "Brasfoot". Jargão tecnológico moderno também.
- A API mantém todos os endpoints e chaves atuais. Novas chaves são aditivas. `day` e `week` coexistem até a Onda 2.

## 3. Escalas e fórmulas

- Atributos: inteiros de 1 a 100. Poder do herói: inteiro de 1 a 100.
- O Poder é derivado, nunca gerado primeiro.

```
Poder_Herói = clamp( round( Σ (peso_i × atributo_i) × multiplicador_de_encaixe ), 1, 100 )
```

- Os pesos vêm da **especialização** e somam 1,0. O multiplicador de encaixe (habilidades × especialização) fica entre 0,85 e 1,10 **[provisório]** e só entra na Onda 3.
- **Potencial (estrelas) e idade não entram direto no Poder.** Eles governam os atributos:
  - o potencial define o teto de crescimento;
  - novatos crescem com XP de expedição;
  - a partir dos ~31 anos os atributos declinam até a aposentadoria ou morte.
- Um "Valor" separado, usado em contrato e mercado, combina Poder, potencial e idade (Onda 3).
- Fadiga reduz o Poder efetivo do herói: `Poder × (1 − power_penalty_max × fadiga/100)`, com `power_penalty_max = 0,30` **[provisório]**.

## 4. Expedição

```
Poder_Base_Equipe = Σ Poder_efetivo(titulares) / 6        (vaga vazia conta 0)
Bônus_Slots       = min( Σ power_bonus × slot_bonus_factor , slot_bonus_cap )
Poder_Efetivo     = (Poder_Base_Equipe + Bônus_Slots) × (1 − penalidade_terreno_pct)
```

- **A expedição é uma partida de duração variável, governada pelos Suprimentos.** A masmorra tem até `max_rooms` salas, e a última é o Boss Final. As duas guildas percorrem a mesma sequência de salas em paralelo, cada uma com a própria energia. A incursão de uma guilda termina quando os Suprimentos zeram, e a partida termina quando as duas encerram ou o Boss é resolvido.
- Suprimentos: começam em 100 + bônus do Consumível. Cada sala custa `base × variação_da_sala × (1 − redução_AGI) + extra_terreno`. A `base` é 10 **[provisório]**, a variação da sala é sorteada em ±25%, e a AGI média da party reduz o custo em até 20%. Uma guilda só entra numa sala se tiver energia acima de 0. Ao zerar, ela encerra a incursão ("Suprimentos esgotados") e deixa de pontuar.
- Cada sala tem um encontro com probabilidade `room_encounter_probability` (0,65 **[provisório]**). Sem encontro, a sala é vazia: nada acontece e ninguém pontua.
- Encontro com as duas guildas presentes: disputa por razão de Poder Efetivo (+1 Ponto de Expedição ao vencedor, com margem de empate, regra atual). Encontro com uma guilda só: ela abate com probabilidade `clamp(solo_clear_base × PoderEfetivo / recommended_power, 0.05, 0.95)`, com `solo_clear_base = 0,6` **[provisório]**.
- Boss Final com as duas presentes: diferença relativa ao **maior** Poder Efetivo. Se for `> 15%`, o mais forte leva +2. Caso contrário, Abate Conjunto: +1 para cada. Se só uma guilda chegar, ela enfrenta o Boss sozinha e leva +2 quando o Poder Efetivo for ao menos o `recommended_power` da masmorra. Caso contrário, não pontua.
- Quem chega ao Boss depende de competência, terreno e preparo: AGI, mitigação de terreno e Consumível. Com o custo base de 10, chegar às 10 salas exige poupar Suprimentos.
- Meta de calibração **[provisório, Onda 4 ajusta]**, medida em simulação em massa: 0x0 em 5–15% das partidas, partidas com 8 ou mais Pontos de Expedição no total (estilo 5x4) em 2–8%, e pelo menos uma guilda chegando ao Boss em 30–60%.
- Terreno sem mitigação aplica `power_penalty_pct` (12% **[provisório]**). Qualquer item equipado com a `terrain_mitigation` exigida anula penalidade e custo extra.
- Bônus de slots: `slot_bonus_factor = 0,15` e `slot_bonus_cap = 15` **[provisório]**. Um loadout Lendário completo fica próximo do teto.
- Rivais usam a mesma regra (mesmo `MatchEngine`), com bônus de slots abstrato vindo do seed.

## 5. Balcão e oficina

- A qualidade sai de sorteio, mas **determinado só pelo nível da oficina**. Os materiais nunca influenciam. As tabelas de probabilidade vivem em `workshops_seed.json`.
- O nível de oficina é por ramo. O ramo usado é sempre o da receita.
- Preço de referência = `market_value_base` do item (já com o multiplicador de qualidade). O cliente nunca envia preço.
- Preço pedido = referência × taxa da margem × demanda do Boletim (1,0 sem Boletim).
- Taxas: Promoção 0,8, Preço Justo 1,0 e Preço Abusivo 1,35 **[provisório]**.
- Cada anúncio sorteia uma tolerância oculta do comprador, uniforme entre 1,00 e 1,50:
  - `taxa ≤ tolerância`: vende ao preço pedido;
  - `taxa ≤ tolerância + 0,15`: contraproposta ao preço `referência × demanda × tolerância`;
  - acima disso: não vende.
- Item equipado no loadout não pode ser vendido.
- Limitação conhecida: um item não vendido volta ao estoque sem custo. O temporizador do Balcão (backlog) fecha essa brecha na Onda 3.

## 6. Save

- Formato JSON versionado (`save_version`), em `data/saves/`. Slots 1–3 e `autosave`.
- Escrita atômica (arquivo temporário + rename).
- Os seeds são só modelo de "novo jogo" e nunca são gravados de volta.
- O save nunca guarda `match_log` nem `room_events`. Para partidas passadas guarda apenas o placar.
- Todo atributo novo de `GameState` precisa entrar em `SERIALIZED_FIELDS` (ou `TRANSIENT_FIELDS`). Um teste falha se houver atributo não classificado.

## 7. Log de decisões

| # | Decisão | Status |
|---|---|---|
| D1 | Atributos primeiro, Poder derivado (1–100) | fechado |
| D2 | Potencial e idade governam atributos, não o Poder | fechado |
| D3 | Party de 6, Reserva de 3, Guilda sem limite | fechado (limite a descobrir por simulação) |
| D4 | 4 classes: Guerreiro (Berserker, Espadachim), Ladino (Arqueiro, Assassino), Mago (Piromante), Clérigo (Suporte) | fechado por ora |
| D5 | Mundo povoado por ligas com divisões; ligas iniciantes têm heróis piores | fechado (Onda 2) |
| D6 | Partida de duração variável: roda até os Suprimentos zerarem. O Boss só é resolvido para quem chega até ele | fechado |
| D7 | Bônus de slots limitado a +15; terreno em percentual | provisório |
| D8 | Preço do Balcão calculado no servidor; Boletim multiplica a demanda | fechado |
| D9 | Save em JSON: 3 slots + autosave | fechado |
| D10 | Balanceamento econômico via simulação em massa | adiado (Onda 4) |
| D11 | `workshops_seed.json` substitui o antigo `specializations_seed.json` (que confundia com especialização de herói) | proposto |
