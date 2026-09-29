# 📋 Registro de Atualizações (Changelog) — HeroFoot

Todas as alterações notáveis deste projeto serão documentadas neste arquivo.  
O formato baseia-se em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/), e este projeto adere ao versionamento semântico.

---

## [0.5.0] — 2026-09-29

### ⚒️ Forja v3: Progressão de Bancada por XP & Bônus de Nível
- **Acúmulo de Experiência Fabril:** Inserção do campo serializado `workshop_xp` em `game_state.py` para as quatro filiais (`Ferragem`, `Alquimia`, `Joalheria`, `Culinária`).
- **Ganho Dinâmico por Complexidade:** Itens forjados concedem XP lido de `data/workshops_seed.json["xp_progression"]` (Tier 1: 10 XP, Tier 2: 25 XP, Tier 3: 60 XP).
- **Modernização com Consumo de XP:** Expansão de filiais (`upgrade_workshop`) agora consome a meta acumulada de XP necessária (`xp_to_next_level`), além de debitar o ouro tabelado pela Câmara dos Mercadores.
- **Interface da Oficina (Fase 2):** Barras animadas de progresso de XP em gradiente dourado, quadro de homologação com os benefícios do próximo nível e trava de dupla chave (XP + Ouro).

### 🧪 Forja Experimental (*Tinkering*) & Homologação de Receitas
- **Manufatura de Alto Risco:** Capacidade de forjar receitas de nível técnico superior ao da filial (`is_tinkering=True`).
- **Cálculo de Risco Estocástico:** Probabilidade de sucesso $P = \max(0.05, 1 - \text{gap} \times 0.35)$, com sorteio via RNG injetável.
  - **Em caso de Sucesso:** Produção normal do artefato com qualidade de bancada, ganho de 1.5x XP e homologação imediata da receita em `known_recipes`.
  - **Em caso de Falha:** Produção de *Gororoba Experimental* (item de refugo, valor base 20 ouro, slot correspondente à receita), concessão de 5 XP de aprendizado e **homologação permanente da receita no catálogo da guilda**.
- **Painel de Risco na UI:** Exibição dinâmica de probabilidade de êxito em cores corporativas e botão *"Assumir Risco e Forjar Experimentalmente"*.

### 📜 Sistema de Eventos Corporativos Interativos
- **Motor de Incidentes Semanais (`services/event_service.py`):** Sorteio determinístico (`roll_weekly_event`) de incidentes catalogados em `data/events_seed.json` no início da semana, priorizando eventos inéditos na temporada.
- **Resolução de Pareceres:** Homologação de decisões executivas impactando tesouraria (ouro), desgaste do plantel (fadiga), reputação institucional (`contractor_confidence`) e bônus operacional temporário de suprimentos.
- **Componente `CorporateEventModal.tsx`:** Modal notarial imersivo com selo imperial `CrownSeal`, classificação administrativa e pílulas visuais de impacto orçamentário.
- **Novos Endpoints:** `GET /api/events/active` e `POST /api/events/resolve`.

### 🏰 Fundações da v0.6.0 Antecipadas
- **Matriz de Rivais (`data/rival_traits_seed.json`):** 16 traços únicos (8 táticos e 8 corporativos com rigorosos trade-offs).
- **Catálogo VIP (`data/vip_orders_seed.json`):** 10 encomendas especiais da nobreza e câmara com validade de 2 semanas e bônus de ouro/confiança.
- **Especificação de Liquidação Judicial (`docs/DESIGN_SPEC_V060.md`):** Regras para dissolução de guildas rebaixadas, liberação de atletas e refundação procedural.

### 🤖 Novos Agentes & Expansão de Estrutura de Desenvolvimento
- **Cobertura de Funções de Indústria:** Criação formal e inclusão no roadmap de 4 novos agentes especializados:
  - `balance_agent` (QA & Balance Engineer — Alta Prioridade)
  - `gamedesign_agent` (Game Designer & Balance Designer — Alta Prioridade)
  - `ux_agent` (UX Designer — Média Prioridade)
  - `sound_agent` (Sound Designer — Média Prioridade)

### 📐 Especificação & Design Sistêmico (`docs/DESIGN_SPEC_V050.md`)
- **Progressão com XP de Bancada:** Definição da tabela exponencial de evolução ($XP_{req} = 100 \times 1.5^{nível-1}$) e dos custos de modernização em ouro por nível em `data/workshops_seed.json["xp_progression"]`.
- **Forja Experimental (Tinkering):** Especificação da fórmula probabilística `success_chance = max(0.05, 1 - (recipe_tier - workshop_level) * 0.35)`, com ganho permanente de homologação de receita mesmo em falha com refugo 'Gororoba Experimental' e seção `crafting.tinkering` em `data/balance_seed.json`.

### ⚖️ Auditoria Econômica & Simulações (`docs/BALANCE_REPORT_V050.md`)
- **Simulação em 3 Estratégias (50 semanas, `scripts/balance_audit_v050.py`):**
  - Casual (1-2 itens forjados/sem): 100% solvente, +⬡ 3.763 ouro final, atingiu Nível 3 na Semana 8 (dentro da meta de 8-12 semanas).
  - Intensiva (4 itens forjados/sem com Boletim): +⬡ 3.660 ouro final, atingiu Nível 3 na Semana 6.
  - Sem Forja (dependência de cotas): Falência acumulada com -⬡ 7.950, comprovando matematicamente o pilar Tycoon de que a guilda vive de sua manufatura bélica.

### 🖥️ UX & Onboarding no Frontend (`docs/UX_AUDIT_V050.md`)
- **Stepper de Progresso de Fases (`PhaseProgress.tsx`):** Indicador visual `Semana X — Fase Y/5` no topo do Header, com mini-badges de etapas concluídas, ativa e futuras.
- **Glossário & Tooltips Contextuais (`Tooltip.tsx`):** Termos corporativos essenciais (*Fadiga*, *Confiança da Contratante*, *Boletim de Mercado*, *Suprimentos*, *Pontos de Expedição*) agora possuem tooltips flutuantes com definições de cartório medieval.
- **Banners de Onboarding (`OnboardingBanner.tsx`):** Mensagens introdutórias por fase, com persistência local em `localStorage`.
- **Estados Vazios Educativos (`EmptyState.tsx`):** Orientação proativa quando o inventário está vazio ou nenhum combatente foi selecionado na escalação.

### 🔊 Identidade Sonora & Áudio (`docs/SOUND_IDENTITY.md`)
- **Documento Canônico de Sonoplastia:** Catálogo priorizado de 15 efeitos obrigatórios (P1) e 10 secundários (P2) combinando diegese medieval (bigorna, óleo, cascalho) e burocracia satírica (carimbos pesados, sinos de cartório, folhear de razão contábil).
- **Scaffold de Hook React (`useSound.ts`):** Interface tipada pronta para plugar na biblioteca Howler.js.

### 📜 Narrativa & Eventos Corporativos Aprofundados (`data/events_seed.json`)
- **Expansão Satírica:** Revisão integral dos eventos existentes e adição de dilemas de alto impacto envolvendo o ex-herói Arthus Valente, aliciamento de titulares por guildas nobres rivais e auditorias surpresa com suborno ou revistas de pijamas.

---

## [0.4.1] — 2026-09-29

### 👑 Metas da Contratante & Auditorias Não Punitivas
- **Meta de Confiança da Contratante:** Reformulação do sistema de auditorias trimestrais periciais para focar exclusivamente na confiança institucional. Auditorias não atingidas não debitam mais ouro (`delta_gold = 0` e `penalty_tax = 0`), eliminando espirais punitivas de falência e aplicando apenas variação percentual na `contractor_confidence` (-15% se reprovada, +15% se aprovada).
- **Exibição de Confiança na Interface:** Integrado o indicador de `contractor_confidence` no card das Metas da Coroa na Fase 5 e no estado serializado do jogo.

### 🐛 Correções Críticas de Engenharia
- **Desativação de Gatilho de Temporada em Loop:** Corrigido bug em `phase_service.py` onde `self.league_engine.season_summary` não era limpo após a apuração da Fase 5, evitando o reprocessamento errôneo semanal de contratos e envelhecimento anual a cada rodada subsequente.
- **Promoção de Aprendizes na Academia:** Normalizada chamada de método para `promote_youth_apprentice` e saneada a recuperação de registros da base.

### 📈 Prova de Viabilidade Econômica (Stress Test de 100 Rodadas)
- **Simulação com Maximização de Lucro e Sobrevivência Competitiva:**
  - **Tesouraria Inicial vs Final:** De ⬡ 1.000 para **⬡ 57.689 de Ouro** (saldo 100% solvente durante todo o percurso, com superávit patrimonial líquido de +56.689 moedas).
  - **Forja Modular & Vendas no Balcão:** 312 artefatos de alto valor produzidos (120 Lendários e 104 Ótimos) e 312 vendas concretizadas a Preço Justo e multiplicadores de Boletim de Mercado (100% de conversão comercial).
  - **Auditorias da Coroa / Contratante:** 12 aprovações em 12 auditorias (100% de taxa de sucesso), com ⬡ 4.800 em subsídios de fomento régio recebidos e 0 multas.
  - **Competitividade na Liga:** 42 vitórias e 16 empates, garantindo acesso e consolidação na **Divisão Nobre da Coroa**.

---

## [0.4.0] — 2026-09-29

### 🏰 Identidade Visual & Arte
- **Fundo Atmosférico de Salão de Guilda:** Substituição do preto sólido pela classe `.guild-hall-atmosphere`, combinando textura sutil de cantaria de pedra medieval polida, luz âmbar difusa de tochas nos cantos superiores e luz de braseiro na base.
- **Componentes Heráldicos em SVG (`src/components/art/`):**
  - `CrownSeal`: Selo imperial de cera carmesim derretida com filigrana dourada, relevo de leão e rubis lapidados, com pulsação luminosa em semanas de auditoria da Coroa.
  - `GuildCrest`: Brasão oficial da guilda esquartelado em carmesim e ardósia com a Pena Contábil de Ouro cruzada com espada sobre montante e alabarda.
  - `DivisionEmblems`: Insígnias da Divisão Nobre da Coroa (ouro e louros) e Divisão de Acesso (ferro forjado e bigorna).
  - `BiomeBanners`: Banners ilustrados em SVG para todos os biomas de masmorra.

### 📜 Narrativa & Lore
- **Bíblia Oficial de Lore (`docs/LORE_BIBLE.md`):** Formalização do mito de Arthus Valente (o Herói Prometido que virou garçom no *Javali Cansado* por endividamento processual), a privatização da caça a monstros pela Câmara dos Mercadores e o Rei Demônio como Supercopa de encerramento da temporada.
- **Catálogo de 14 Eventos Corporativos Vivos (`data/events_seed.json`):** Incidentes com escolhas executivas ramificadas para a diretoria da guilda.

### ⚡ Dungeons Modulares & Habilidades
- **Desacoplamento Bioma × Clima Semanal:** 8 biomas canônicos em `data/dungeons_seed.json` combinados dinamicamente com 6 condições climáticas em `data/climates_seed.json`.
- **Árvore Formal de Habilidades de Combate (`data/classes_seed.json`):** Batedor (Arqueiro), Sobrevivência (Berserker), Parede de Escudos (Espadachim), Execução Fria (Assassino), Prece de Sustentação (Clérigo) e Canalização Concentrada (Piromante) integrados ao cálculo de combate em `match_engine.py`.

### ⚒️ Forja, Materiais & Balcão Comercial
- **28 Materiais de Fantasia:** Catálogo completo em `data/materials_seed.json` (Minérios, Madeiras, Espólios de Monstros e Arcanos) divididos em 4 faixas de raridade (*Comum, Raro, Épico, Lendário*).
- **Tabelas Agregadas:** População de `material_values_seed.json`, `material_sources_seed.json` e `material_affixes_seed.json`.
- **Afixos PoE & Munchkin Corporativo:** Prefixos sérios táticos e sufixos de humor contido de escritório (*"do Risco Calculado", "da Eficiência Tributária", "da Rescisão Imediata"*).
- **Risco no Preço Abusivo:** Cobrança de Taxa de Vitrine da Câmara dos Mercadores (8% do valor base) e risco de encalhe de inventário em caso de recusa pelo comprador.
- **Filtros no Almoxarifado Atacadista:** Abas por bancada da oficina, seletor de raridade e busca textual rápida no atacado de matérias-primas.

### 🩹 Correções & Ajustes Críticos
- **Extirpação de "Nível" de Herói:** Removida a menção a níveis em aventureiros e aprendizes, preservando a identidade canônica de Idade, Poder Derivado e Potencial em Estrelas.
- **Fadiga Real e Rotatividade Tática:** Titulares sofrem desgaste integral (+25) e recuperam apenas 5 pontos passivos na virada da semana; reservas que descansam recuperam 20 pontos cheios.
- **Geração e Registro Real de Espólios:** Salas e chefes vencidos na masmorra sorteiam materiais de verdade baseados no bioma e creditam no inventário da guilda.
- **DRE Semanal 100% Dinâmico:** Extrato da Fase 5 conectado a valores reais apurados pelo backend (salários reais, receitas reais de balcão e manutenção detalhada).

---

## [0.3.0] — 2026-09-28

### Adicionado
- **Sistema de Ligas da Coroa:** Divisão Nobre e Divisão de Acesso, com 8 guildas por divisão, temporadas de 28 rodadas com promoção e rebaixamento.
- **Departamento Médico & Money Sinks:** 5 níveis de aprimoramento de instalações de saúde, sessões avulsas de massagem e banhos termais para alívio imediato de fadiga.
- **Contratos Plurianuais de Temporada:** Duração de contratos, salários congelados durante vigência e leilões de renovação com luvas de assinatura.
- **Metas da Coroa & Auditorias Trimestrais:** Auditorias financeiras e militares com crédito de subsídios régios ou sanções fiscais com retenção de ouro.

---

## [0.2.0] — 2026-09-28

### Adicionado
- **Forja Modular v2:** Catálogo com materiais, prefixos e sufixos modulares nas 4 bancadas da oficina.
- **Motor de Incursão por Suprimentos:** Partidas de duração variável governadas por 100 Suprimentos base, com salas dinâmicas, mitigação de terreno e embates de chefe.
- **Balcão Comercial com Margens:** Margens de Promoção (0.8x), Preço Justo (1.0x) e Preço Abusivo (1.35x) com tolerância oculta de compradores.

---

## [0.1.0] — 2026-09-28

### Adicionado
- **Fundação Arquitetural do HeroFoot:** Backend modular em Python padrão (`services/`) e frontend em React 19 + TypeScript + Vite + Tailwind CSS.
- **Sistema de Salvamento Atômico:** Gravação segura em 3 compartimentos com suporte a *autosave* e migração de versão.
- **Bateria de Testes Unitários:** Suíte de testes com conformidade contratual estrita.
