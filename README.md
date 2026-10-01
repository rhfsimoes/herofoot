# 🛡️ HeroFoot — Simulador de Gestão Corporativa de Guildas

> **"A profecia se cumpriu. O Rei Demônio despertou. E o Herói Prometido virou garçom porque não conseguiu pagar as custas processuais."**

[![Status dos Testes](https://img.shields.io/badge/Testes%20Unitários-223%20Aprovados%20(100%25)-brightgreen.svg)](#-executar-a-suíte-de-testes)
[![Frontend](https://img.shields.io/badge/Frontend-React%20%7C%20TypeScript%20%7C%20Vite%20%7C%20Tailwind-blue.svg)](#-iniciar-o-frontend-react--vite)
[![Backend](https://img.shields.io/badge/Backend-Python%203.10%2B%20Puro-yellow.svg)](#-iniciar-o-backend-python)
[![Versão](https://img.shields.io/badge/Versão-v0.7.1%20B2B%20Industrial-orange.svg)](#-o-ciclo-semanal-de-gestão-as-5-fases)

---

## 📜 Premissa & Universo (Fantasia Corporativa 7/10)

Quando o Rei Demônio despertou, o lendário Herói Prometido (*Arthus Valente*) atendeu ao chamado sagrado e derrotou o primeiro arauto das trevas. Contudo, em vez de glória e terras, recebeu uma enxurrada de execuções fiscais: a Associação dos Taberneiros o processou em 45.000 moedas por danos aos vitrais históricos, o Consórcio Clerical negou cobertura hospitalar para perfuração pulmonar com base na falta de EPI homologado, e a Fazenda Real leiloou sua espada mística para abater tributos não declarados sobre espólios.

Falido e exausto do sistema, Arthus largou o manto heroico e hoje bate ponto das 07h às 16h com carteira assinada no *Bistrô & Taberna do Javali Cansado*, sob estrito plano de recuperação judicial.

Sem salvador profético e com os monstros ameaçando as rotas mercantis, a **Câmara dos Mercadores** viu a maior oportunidade comercial da história: **privatizou a salvação do reino e transformou a caçada a monstros em um esporte contábil de alta liquidez**. 

Nascia a **Liga das Guildas da Coroa**, onde superintendentes corporativos contratam atletas-aventureiros, celebram convênios B2B com siderúrgicas e cartórios, operam linhas de montagem modulares, gerenciam a queima de rações em masmorras concedidas pelo Estado e disputam o cobiçado **Alvará de Incursão à Cidadela do Rei Demônio** — concedido exclusivamente ao Campeão da temporada.

---

## 🔄 O Ciclo Semanal de Gestão (As 5 Fases)

O jogo opera em um loop contínuo semanal estruturado em 5 fases operacionais:

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    FASE I    │ ──> │   FASE II    │ ──> │   FASE III   │ ──> │   FASE IV    │ ──> │    FASE V    │
│  RH & Saúde  │     │ Complexo B2B │     │ Tática/Carga │     │  Expedição   │     │ DRE & Coroa  │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

### 1. Fase I — Recursos Humanos, Medicina Ocupacional & Contratos
* **Contratos Plurianuais:** Aventureiros assinam vínculos de 1 a 3 temporadas. Salários são fixos na vigência, mas sofrem pressões de inflação e luvas de assinatura ao final do contrato.
* **Departamento Médico:** Upgrades da sede (da precária Tenda de Curativos à luxuosa Casa de Banhos Termais) reduzem a taxa de lesões e aceleram a recuperação de fadiga do plantel.
* **Fadiga Real com Rotação Tática:** Titulares sofrem desgaste em combate. Para recuperar a plenitude física, é necessário dar folga na reserva ou financiar procedimentos de fisioterapia.
* **Academia de Aprendizes & Mercado:** Formação de jovens talentos (custo operacional de 40 ouro/semana) e captação de veteranos em leilões sindicais.
* **Incidentes Corporativos:** Sorteio semanal de dilemas administrativos com opções que impactam a tesouraria, a fadiga e a Confiança da Contratante.

### 2. Fase II — Complexo Industrial B2B, Montagem Modular & Linha de Automação
* **Parcerias com 11 Corporações Industriais:** Acordos comerciais nos 5 papéis funcionais com marcas consagradas (ex: *Siderúrgica Aethelgard*, *Consórcio Élfico*, *Cartório Arcano Mercurius*, *Intendência de Provisões da Coroa*).
* **Progressão por Nível de Marca (Brand Level):**
  - **Bronze (Nv. 1):** Livre celebração; confere remessas periódicas de peças Tier 1 e 10% de desconto no mercado spot.
  - **Prata (Nv. 3 / 100 Brand XP):** Requer Bronze prévio e confiança >= 55; desbloqueia remessas e compras spot de peças Tier 2.
  - **Ouro (Nv. 7 / 300 Brand XP):** Requer Prata prévio e confiança >= 75; desbloqueia componentes supremos Tier 3.
* **Montagem Modular de 3 Componentes:** Combinação de 1 Prefixo (Entrada) + 1 Base (Chassi) + 1 Sufixo (Núcleo) respeitando gabarito de fábrica e regra de concisão (máximo 1-2 palavras por parte).
* **Tinkering Inter-Marcas:** Mistura de patentes rivais traz risco estocástico de refugo fabril (*Ativo Não-Conforme*) vs. bônus de *Overclock Não-Autorizado* (+15% de poder de combate).
* **Linha de Montagem Automatizada:** Operários fabris contratados produzem lotes seriais *White-label* autonomamente a cada ciclo, gerando faturamento automático no DRE.
* **Mercado Spot com Cotas:** Aquisição avulsa de componentes com cota regulatória anti-exploit (máximo 5 un./peça/semana) e ágio alfandegário de +50% para não-conveniados.

### 3. Fase III — Engenharia Tática & Alocação de Ativos
* **Plantel de Incursão (6 Titulares + Reservas):** Seleção do grupo baseada em Poder Efetivo e limiar de fadiga (bloqueio para atletas acima de 70% de exaustão).
* **5 Compartimentos Canônicos de Equipamento (Loadout):**
  1. `Arsenal Ofensivo` (Armas de impacto, canhões, artilharia).
  2. `Blindagem Operacional` (Couraças, mantos reforçados, chapas de absorção).
  3. `Dispositivo Tático` (Gemas arcanas, relógios de precisão, anéis de foco).
  4. `Alvará de Risco` (Licenças burocráticas de incursão e autorizações ambientais).
  5. `Provisão Logística` (Rações balanceadas, elixires de campo, kits de marcha).
* **Mitigação Tática Ativa:** Neutralização de penalidades severas de terreno (pântano, cripta glacial, magma) e sobrecargas climáticas antes do despacho da expedição.

### 4. Fase IV — Incursão em Masmorras Modulares (A Partida)
* **Desacoplamento Bioma × Clima Semanal:** 8 biomas canônicos combinados proceduralmente com 6 condições climáticas semanais.
* **Gestão dos 100 Suprimentos:** Marcha câmara por câmara (1 a 10) consumindo energia conforme terreno, clima e agilidade do grupo. Se os suprimentos zerarem, a marcha encerra imediatamente.
* **Combate e Resolução de Chefes:**
  - *Mini-Bosses Intermediários:* Disputa resolvida pela proporção de poder, concedendo +1 Ponto de Expedição (PE).
  - *Boss da Masmorra (Câmara 10):* Disputa pelo Abate Exclusivo (+2 PE se a margem for > 15%) ou Abate Conjunto (+1 PE para cada se margem $\le 15\%$).
* **Telemetria e Placar 100% Sincronizados:** Geração e leitura direta de `score_t1` e `score_t2` da simulação do motor, garantindo total fidelidade entre a animação visual e a pontuação final da rodada.

### 5. Fase V — DRE Contábil, Liga das Guildas & Auditoria da Coroa
* **DRE Semanal Dinâmico:** Extrato financeiro atualizado em tempo real ao fim da Fase 4, detalhando receitas de expedição, vendas no balcão, vendas da linha de montagem, folha salarial, manutenções (Base + Médica + Academia), royalties B2B e despesas spot.
* **Liga das Guildas (Divisão Nobre & Divisão de Acesso):** 8 guildas por divisão em 28 rodadas, com 2 vagas de acesso e 2 de rebaixamento.
* **Condições de Vitória, Derrota e Falência:**
  - *Falência Imediata:* 2 ciclos consecutivos com tesouro em saldo negativo resultam em liquidação judicial compulsória (*Game Over*).
  - *Dissolução de Lanternas:* As duas últimas colocadas da Divisão de Acesso são dissolvidas por insolvência e substituídas por novas guildas fundadas pela Câmara.
  - *Cidadela do Rei Demônio:* O Campeão da Divisão Nobre recebe a Autorização Régia para o confronto supremo de fim de temporada.

---

## 🏛️ Arquitetura & Stack Tecnológico

```
herofoot/
├── data/                         # Seeds canônicos em JSON (Zero regras hardcoded em Python)
│   ├── corporations_seed.json    # 11 corporações B2B especializadas nos 5 papéis funcionais
│   ├── parts_seed.json           # 107 peças modulares com nomes concisos de 1-2 palavras
│   ├── b2b_contracts_seed.json   # 33 convênios B2B com progressão Bronze, Prata e Ouro
│   ├── assembly_workers_seed.json# 6 operários assalariados da linha de montagem automatizada
│   ├── balance_seed.json         # Constantes de economia, fadiga, combate e expedição
│   ├── dungeons_seed.json        # 8 biomas canônicos de expedição
│   ├── climates_seed.json        # 6 condições climáticas dinâmicas
│   ├── classes_seed.json         # Classes, especializações e habilidades de heróis
│   ├── rival_traits_seed.json    # Matriz com 16 traços permanentes de guildas rivais
│   ├── vip_orders_seed.json      # Catálogo com 10 encomendas VIP da nobreza
│   ├── events_seed.json          # Banco de eventos corporativos interativos
│   └── workshops_seed.json       # Tabela de multiplicadores de qualidade e staff
├── services/                     # Lógica de negócio pura desacoplada por domínio
│   ├── phase_service.py          # Ciclo das 5 fases, fadiga e apuração de DRE em tempo real
│   ├── hero_service.py           # Gestão de heróis, salários, desenvolvimento e contratos
│   ├── crafting_service.py       # Montagem modular, linha de montagem e Tinkering
│   ├── sales_service.py          # Balcão comercial, precificação e encomendas VIP
│   ├── crown_service.py          # Metas da Coroa e auditorias fiscais trimestrais
│   ├── academy_service.py        # Academia de base e progressão de aprendizes
│   └── medical_service.py        # Enfermarias e tratamentos de fadiga
├── match_engine.py               # Motor de simulação de incursão por suprimentos com placar síncrono
├── league_engine.py              # Motor de ligas, divisões, confrontos e refundação de guildas
├── market_engine.py              # Motor de mercado spot, boletim, VIP e atacado
├── b2b.py                        # Carregador cacheado de corporações, peças e contratos B2B
├── game_state.py                 # Modelo GameState com serialização reflexiva estrita
├── server.py                     # Servidor HTTP REST leve em Python puro
└── frontend/                     # Interface do Jogador (Vite + React 18/19 + TypeScript + Tailwind)
    ├── src/components/art/       # Brasões heráldicos, selo imperial e banners SVG
    ├── src/pages/                # As 5 fases operacionais + Dashboard analítico
    └── src/mockData.ts           # Interfaces TypeScript canônicas do ecossistema
```

---

## 🚀 Como Executar o Jogo

### 1. Iniciar o Backend (Python)
Requer **Python 3.10+**. Nenhuma dependência externa necessária (executado exclusivamente sobre a biblioteca padrão do Python).
```bash
python server.py
# Servidor ativo em http://localhost:8000
```

### 2. Iniciar o Frontend (React / Vite)
Requer **Node.js 18+**.
```bash
cd frontend
npm install
npm run dev
# Interface ativa em http://localhost:5173
```

### 3. Executar a Suíte Completa de Testes
```bash
python -m unittest discover tests
# 223 testes unitários executados com 100% de aprovação (OK)
```

---

## ⚖️ Diretrizes Éticas & Regulatórias do Projeto
1. **Zero Valores de Regra Hardcoded em Código:** 100% dos parâmetros numéricos, probabilidades e textos vivem nos arquivos `data/*.json`.
2. **Aleatoriedade Determinística:** Nenhum `random` global solto. Todo sorteio utiliza sementes derivadas de `world_seed` + semana + domínio.
3. **Terminologia Canônica:** Proibição estrita de termos esportivos crus (*gol, gramado, estádio, escanteio, bilheteria, Brasfoot*). O tom é sempre **Fantasia Corporativa 7/10**.
