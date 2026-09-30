# Catálogo Geral de Equipamentos, Peças Modulares, Bases e Afixos — HeroFoot

Este documento consolida todo o inventário de itens, chassis base, peças modulares (prefixos, bases e sufixos) e afixos arcanos para balanceamento e expansão da cadeia de forja.

---

## Sumário
1. [Estrutura da Forja Modular (Prefixo + Base + Sufixo)](#1-estrutura-da-forja-modular)
2. [Peças Modulares por Corporação (85 Peças)](#2-peças-modulares-por-corporação)
3. [Peças Modulares Agrupadas por Papel (Prefixos, Bases e Sufixos)](#3-peças-modulares-agrupadas-por-papel)
4. [Receitas e Templates de Itens Prontos](#4-receitas-e-templates-de-itens-prontos)
5. [Catálogo de Afixos Gerais (41 Afixos)](#5-catálogo-de-afixos-gerais)

---

## 1. Estrutura da Forja Modular

Na versão v0.7.0, a força-tarefa corporativa gerencia **5 Slots de Ativos B2B**:
- **Arsenal Ofensivo (`offensive_asset`):** Lote de armamento padronizado para a equipe (Lotes de Lâminas, Arsenais de Vanguarda).
- **Blindagem Operacional (`defensive_asset`):** Equipamentos de Proteção Coletiva e placas (Kits de Blindagem, Fardamento Reforçado).
- **Ativo de Performance (`performance_asset`):** Incentivos arcanos e facetamento óptico (Amuletos, Selos de Performance).
- **Alvará de Risco (`terrain_license`):** Licenças notariais, atestados e laudos periciais de mitigação ambiental (Selos Notariais, Pergaminhos de Risco).
- **Provisão Logística (`logistical_provision`):** Catering militar, farmácia e ampolas de sustentação operacional.

Cada ativo modular é construído combinando **3 componentes fabris**:
- **Prefixo (Modificador Superior):** Empunhadura, guarda articulada, bocal, broche, filtro decantador, alvará específico.
- **Base / Chassi (Núcleo Principal):** Lote de lâminas, chassi de armadura, gema lapidada, selo/pergaminho notarial.
- **Sufixo (Catalisador / Fixador):** Núcleo arcano, rebite térmico, catalisador bioalquímico, apólice de seguro.

### Bônus e Riscos:
- **Sintonia Monomarca (+5% PE):** Usar 3 peças da mesma corporação.
- **Tinkering Inter-Marcas:** Misturar marcas rivais exige teste pericial: 60% Overclock (+15% PE) vs. 40% Falha (Refugo Comercializável).

---

## 2. Peças Modulares por Corporação

### Siderúrgica Aethelgard & Cia. (`corp_aethelgard`) — Filial: Ferragem
*Especialidade:* Lâminas temperadas, chapas prensadas e engrenagens de alto impacto.

| ID da Peça | Nome | Papel | Tipo | Tier | Custo Base | Bônus PE | Efeitos |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| `part_aethelgard_blade` | **Lâmina Forjada Aethelgard** | Base (Chassi) | `blade` | T1 | ⬡ 50 | +25 PE | power_flat: 5 |
| `part_aethelgard_hilt` | **Empunhadura Padrão Aethelgard** | Prefixo | `hilt` | T1 | ⬡ 40 | +10 PE | power_flat: 2 |
| `part_aethelgard_core` | **Rebite de Fixação Aethelgard** | Sufixo | `core` | T1 | ⬡ 60 | +8 PE | power_flat: 8 |
| `part_aethelgard_blade_t2` | **Lâmina Prensada Aethelgard** | Base (Chassi) | `blade` | T2 | ⬡ 110 | +50 PE | power_flat: 12 |
| `part_aethelgard_hilt_t2` | **Empunhadura Reforçada Aethelgard** | Prefixo | `hilt` | T2 | ⬡ 95 | +40 PE | mitigation_flat: 8 |
| `part_aethelgard_core_t2` | **Rebite Temperado Aethelgard** | Sufixo | `core` | T2 | ⬡ 100 | +45 PE | power_flat: 10 |
| `part_aethelgard_blade_t3` | **Lâmina de Mithril Aethelgard** | Base (Chassi) | `blade` | T3 | ⬡ 220 | +90 PE | power_flat: 25 |
| `part_aethelgard_hilt_t3` | **Empunhadura Nobre Aethelgard** | Prefixo | `hilt` | T3 | ⬡ 200 | +80 PE | mitigation_flat: 18 |
| `part_aethelgard_core_t3` | **Núcleo de Forja Aethelgard** | Sufixo | `core` | T3 | ⬡ 210 | +85 PE | power_flat: 22 |

### Lapidação Imperial Chanceler & Filhos (`corp_chancellor`) — Filial: Joalheria
*Especialidade:* Amuletos com facetamento óptico, engastes de platina e núcleos prismáticos.

| ID da Peça | Nome | Papel | Tipo | Tier | Custo Base | Bônus PE | Efeitos |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| `part_chancellor_gem_t1` | **Ágata Notarial Lapidada** | Base (Chassi) | `gem` | T1 | ⬡ 55 | +26 PE | power_flat: 6 |
| `part_chancellor_pin` | **Broche de Fixação Imperial** | Prefixo | `hilt` | T1 | ⬡ 80 | +8 PE | power_flat: 8 |
| `part_chancellor_frame` | **Armação de Ouro Chanceler** | Base (Chassi) | `plating` | T2 | ⬡ 180 | +14 PE | power_flat: 14 |
| `part_chancellor_pin_t2` | **Broche de Platina Chanceler** | Prefixo | `hilt` | T2 | ⬡ 110 | +46 PE | mitigation_flat: 10 |
| `part_chancellor_core` | **Núcleo de Safira Imperial** | Sufixo | `gem` | T2 | ⬡ 110 | +18 PE | power_flat: 4 |
| `part_chancellor_gem_t3` | **Diamante Imperial Chanceler** | Base (Chassi) | `gem` | T3 | ⬡ 240 | +98 PE | power_flat: 30 |
| `part_chancellor_frame_t3` | **Armação de Adamante Chanceler** | Prefixo | `plating` | T3 | ⬡ 225 | +90 PE | mitigation_flat: 22 |
| `part_chancellor_core_t3` | **Prisma Solar Chanceler** | Sufixo | `core` | T3 | ⬡ 230 | +94 PE | power_flat: 26 |

### Manufatura Notarial da Coroa (`corp_crown_notarial`) — Filial: Ferragem
*Especialidade:* Peças genéricas de linha branca (white-label), alvarás gravados e armações universais.

| ID da Peça | Nome | Papel | Tipo | Tier | Custo Base | Bônus PE | Efeitos |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| `part_crown_plating_01` | **Couro Escamado Padrão da Fazenda Real** | Base (Chassi) | `plating` | T1 | ⬡ 90 | +None PE | power_pct: 0.15, value_pct: 0.2 |
| `part_crown_hilt_01` | **Pomo Gravado com Termo de Responsabilidade** | Prefixo | `hilt` | T1 | ⬡ 115 | +None PE | power_flat: 3, value_pct: 0.25, power_pct: 0.08 |
| `part_crown_gem_01` | **Ágata Notarial de Vigor Funcional** | Sufixo | `gem` | T1 | ⬡ 110 | +None PE | power_flat: 3, value_pct: 0.25 |
| `part_crown_core_01` | **Inscrição Ígnea de Calefação Regulatória** | Sufixo | `core` | T1 | ⬡ 130 | +None PE | terrain_mitigation: glacier_frost, value_pct: 0.2 |
| `part_crown_hilt_02` | **Guarda-Mão de Cláusula Rescisória** | Prefixo | `hilt` | T2 | ⬡ 185 | +None PE | power_pct: 0.12, value_pct: 0.15, power_pct: 0.12 |
| `part_crown_plating_02` | **Braçadeira Chancelada por Laudo Pericial** | Prefixo | `plating` | T2 | ⬡ 200 | +None PE | power_flat: 4, value_pct: 0.2, power_pct: 0.1 |
| `part_crown_gem_02` | **Quartzo de Austeridade Orçamentária** | Sufixo | `gem` | T2 | ⬡ 195 | +None PE | value_pct: 0.45, power_flat: 2 |
| `part_crown_core_02` | **Selo Rúnico de Alvará de Funcionamento** | Sufixo | `core` | T2 | ⬡ 220 | +None PE | power_flat: 5, value_pct: 0.35, power_pct: 0.1 |
| `part_crown_core_03` | **Condutor Térmico de Prevenção à Hipotermia** | Sufixo | `core` | T2 | ⬡ 190 | +None PE | power_flat: 3, value_pct: 0.2, power_pct: 0.1 |
| `part_crown_blade_t3` | **Lâmina Imperial Notarial** | Base (Chassi) | `blade` | T3 | ⬡ 200 | +84 PE | power_flat: 22 |
| `part_crown_gem_t3` | **Rubi Imperial Selado** | Sufixo | `gem` | T3 | ⬡ 215 | +88 PE | power_flat: 25 |
| `part_crown_seal_t1` | **Selo Notarial de Risco** | Base (Chassi) | `seal` | T1 | ⬡ 75 | +20 PE | power_flat: 4, value_pct: 0.2 |
| `part_crown_parchment_t2` | **Pergaminho de Alvará Provisório** | Base (Chassi) | `parchment` | T2 | ⬡ 150 | +45 PE | power_flat: 8, value_pct: 0.3 |
| `part_crown_seal_t3` | **Certidão Notarial Chancelada** | Base (Chassi) | `seal` | T3 | ⬡ 280 | +90 PE | power_flat: 20, value_pct: 0.45 |

### Irmãos Anões de Aço Negro & Cia. (`corp_dwarf_steel`) — Filial: Ferragem
*Especialidade:* Blindagens pesadas, chapas maciças de ferro fundido e escudos balísticos.

| ID da Peça | Nome | Papel | Tipo | Tier | Custo Base | Bônus PE | Efeitos |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| `part_dwarf_plating_01` | **Placa Reforçada de Aço Anão** | Base (Chassi) | `plating` | T1 | ⬡ 85 | +None PE | power_pct: 0.1, value_pct: 0.15 |
| `part_dwarf_plating_02` | **Lamelas Robustas de Granito Vulcânico** | Base (Chassi) | `plating` | T1 | ⬡ 95 | +None PE | power_flat: 4, value_pct: 0.2 |
| `part_dwarf_prefix_01` | **Presilha Forjada Anã** | Prefixo | `hilt` | T1 | ⬡ 70 | +8 PE | power_flat: 8 |
| `part_dwarf_core_01` | **Âncora Gravitacional de Minas Instáveis** | Sufixo | `core` | T1 | ⬡ 125 | +None PE | terrain_mitigation: unstable_mine, value_pct: 0.2 |
| `part_dwarf_plating_03` | **Couraça Maciça de Minério Negro** | Base (Chassi) | `plating` | T2 | ⬡ 210 | +None PE | power_flat: 6, value_pct: 0.2 |
| `part_dwarf_plating_06` | **Reforço Torácico com Apólice Integrada** | Prefixo | `plating` | T2 | ⬡ 230 | +None PE | power_flat: 6, value_pct: 0.35, power_pct: 0.12 |
| `part_dwarf_core_02` | **Estrutura de Contenção de Responsabilidade Limitada** | Sufixo | `core` | T2 | ⬡ 220 | +None PE | power_flat: 6, value_pct: 0.3, power_pct: 0.1 |
| `part_dwarf_plating_04` | **Blindagem Impenetrável da Cidadela Subterrânea** | Base (Chassi) | `plating` | T3 | ⬡ 390 | +None PE | power_flat: 8, power_pct: 0.12, value_pct: 0.4 |
| `part_dwarf_plating_05` | **Revestimento Galvanizado Anti-Ácido** | Prefixo | `plating` | T3 | ⬡ 350 | +None PE | power_flat: 5, power_pct: 0.1, value_pct: 0.5 |

### Consórcio Élfico de Alta Precisão (`corp_elf_precision`) — Filial: Joalheria
*Especialidade:* Joias arcanas de fluxo estrito e componentes de lapidação micrométrica.

| ID da Peça | Nome | Papel | Tipo | Tier | Custo Base | Bônus PE | Efeitos |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| `part_elf_gem_01` | **Gema Focalizadora de Cristal Élfico** | Base (Chassi) | `gem` | T1 | ⬡ 130 | +None PE | power_pct: 0.12, value_pct: 0.4 |
| `part_elf_filter_01` | **Refinador Gustativo de Alta Gastronomia** | Prefixo | `filter` | T1 | ⬡ 110 | +None PE | energy_bonus_flat: 10, value_pct: 0.35 |
| `part_elf_core_00` | **Matriz de Ressonância Élfica** | Sufixo | `core` | T1 | ⬡ 75 | +8 PE | power_flat: 8 |
| `part_elf_blade_01` | **Lâmina Temperada a Frio Élfico** | Base (Chassi) | `blade` | T2 | ⬡ 190 | +None PE | power_pct: 0.15, value_pct: 0.15 |
| `part_elf_gem_02` | **Safira Penitencial de Condutividade Alta** | Base (Chassi) | `gem` | T2 | ⬡ 240 | +None PE | power_pct: 0.22, value_pct: 0.4 |
| `part_elf_gem_03` | **Topázio de Compensação de Turno Noturno** | Sufixo | `gem` | T2 | ⬡ 190 | +None PE | power_pct: 0.08, value_pct: 0.25, power_pct: 0.08 |
| `part_elf_core_02` | **Matriz Rúnica de Compliance Arcano** | Sufixo | `core` | T2 | ⬡ 230 | +None PE | power_flat: 5, value_pct: 0.35, power_pct: 0.1 |
| `part_elf_core_01` | **Núcleo Criogênico de Estabilidade Boreal** | Sufixo | `core` | T3 | ⬡ 330 | +None PE | terrain_mitigation: glacier_frost, power_flat: 3, value_pct: 0.3 |
| `part_elf_gem_04` | **Gema Lapidada de Isenção Fiscal** | Sufixo | `gem` | T3 | ⬡ 370 | +None PE | value_pct: 0.5, power_flat: 3, value_pct: 0.3 |

### Sindicato Bioalquímico Flamel & Associados (`corp_flamel`) — Filial: Alquimia
*Especialidade:* Extratos catalisadores, ampolas de vidro reforçado e reativos de regeneração.

| ID da Peça | Nome | Papel | Tipo | Tier | Custo Base | Bônus PE | Efeitos |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| `part_flamel_vial` | **Ampola Reforçada Flamel** | Base (Chassi) | `filter` | T1 | ⬡ 30 | +5 PE | charges_flat: 1 |
| `part_flamel_nozzle` | **Bocal Dosador Flamel** | Prefixo | `filter` | T1 | ⬡ 70 | +8 PE | power_flat: 8 |
| `part_flamel_catalyst` | **Catalisador Bioquímico Flamel** | Sufixo | `core` | T1 | ⬡ 55 | +12 PE | energy_bonus_flat: 10 |
| `part_flamel_reagent_t2` | **Reativo Alcalino Flamel** | Base (Chassi) | `gem` | T2 | ⬡ 115 | +50 PE | power_flat: 12 |
| `part_flamel_vial_t2` | **Ampola Graduada Flamel** | Prefixo | `filter` | T2 | ⬡ 105 | +45 PE | recovery_flat: 10 |
| `part_flamel_core_t2` | **Catalisador Purificado Flamel** | Sufixo | `core` | T2 | ⬡ 110 | +48 PE | power_flat: 10 |
| `part_flamel_reagent_t3` | **Reativo Filosofal Flamel** | Base (Chassi) | `gem` | T3 | ⬡ 235 | +96 PE | power_flat: 28 |
| `part_flamel_vial_t3` | **Ampola de Vidro Dragônico Flamel** | Prefixo | `filter` | T3 | ⬡ 215 | +88 PE | recovery_flat: 25 |
| `part_flamel_core_t3` | **Catalisador Primordial Flamel** | Sufixo | `core` | T3 | ⬡ 225 | +92 PE | power_flat: 24 |

### Engenharia Goblin S.A. (`corp_goblin_eng`) — Filial: Ferragem
*Especialidade:* Peças de corte agressivo, módulos de detonação e propulsores a vapor.

| ID da Peça | Nome | Papel | Tipo | Tier | Custo Base | Bônus PE | Efeitos |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| `part_gob_blade_01` | **Lâmina Dentada de Fricção Rápida** | Base (Chassi) | `blade` | T1 | ⬡ 75 | +None PE | power_pct: 0.1, value_pct: 0.1 |
| `part_gob_core_00` | **Detonador de Atrito Goblin** | Sufixo | `core` | T1 | ⬡ 65 | +7 PE | power_flat: 7 |
| `part_gob_blade_02` | **Lâmina Predatória de Aço Farpado** | Base (Chassi) | `blade` | T2 | ⬡ 180 | +None PE | power_pct: 0.18, value_pct: 0.4 |
| `part_gob_filter_01` | **Compressor de Porções Industriais** | Base (Chassi) | `filter` | T2 | ⬡ 150 | +None PE | charges_flat: 1, value_pct: 0.3 |
| `part_gob_hilt_01` | **Empunhadura Sem Guarda de Risco** | Prefixo | `hilt` | T2 | ⬡ 160 | +None PE | power_flat: 5, value_pct: 0.1, power_pct: 0.1 |
| `part_gob_core_02` | **Disjuntor de Sobrecarga Calculada** | Sufixo | `core` | T2 | ⬡ 210 | +None PE | power_flat: 4, value_pct: 0.2, power_pct: 0.12 |
| `part_gob_blade_03` | **Gume Guilhotina de Demissão Sumária** | Base (Chassi) | `blade` | T3 | ⬡ 380 | +None PE | power_flat: 7, power_pct: 0.2, value_pct: 0.35, power_pct: 0.15 |
| `part_gob_core_01` | **Câmara de Detonação Magmática** | Sufixo | `core` | T3 | ⬡ 320 | +None PE | power_pct: 0.2, power_flat: 4, value_pct: 0.35 |
| `part_gob_core_03` | **Injetor de Adrenalina de Turno Dobrado** | Sufixo | `core` | T3 | ⬡ 340 | +None PE | energy_bonus_flat: 12, charges_flat: 1, value_pct: 0.25, energy_bonus_flat: 15 |

### Sindicato dos Alquimistas de Pântano (`corp_swamp_alchemy`) — Filial: Alquimia
*Especialidade:* Filtros respiratórios contra miasmas, concentrados e dosadores farmacológicos.

| ID da Peça | Nome | Papel | Tipo | Tier | Custo Base | Bônus PE | Efeitos |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| `part_swamp_filter_01` | **Filtro Decantador de Caldo Concentrado** | Base (Chassi) | `filter` | T1 | ⬡ 75 | +None PE | energy_bonus_flat: 8, value_pct: 0.25 |
| `part_swamp_filter_02` | **Prensa de Suplemento de Algas Pútridas** | Base (Chassi) | `filter` | T1 | ⬡ 65 | +None PE | energy_bonus_flat: 5, value_pct: 0.15 |
| `part_swamp_prefix_01` | **Válvula de Lodo Filtrado** | Prefixo | `filter` | T1 | ⬡ 75 | +8 PE | power_flat: 8 |
| `part_swamp_core_01` | **Filtro Neutralizador de Miasma Tóxico** | Sufixo | `core` | T1 | ⬡ 120 | +None PE | terrain_mitigation: toxic_swamp, value_pct: 0.15 |
| `part_swamp_filter_03` | **Dosador Graduado de Prontuário Médico** | Prefixo | `filter` | T2 | ⬡ 175 | +None PE | charges_flat: 1, value_pct: 0.25, energy_bonus_flat: 10 |
| `part_swamp_filter_04` | **Válvula de Infusão de Produtividade Contínua** | Prefixo | `filter` | T2 | ⬡ 165 | +None PE | energy_bonus_flat: 6, value_pct: 0.15, charges_flat: 1 |
| `part_swamp_core_02` | **Injetor Químico de Fuga e Evacuação** | Sufixo | `core` | T2 | ⬡ 185 | +None PE | energy_bonus_flat: 8, value_pct: 0.35, charges_flat: 1 |
| `part_swamp_core_03` | **Difusor Balsâmico de Eucalipto Medicinal** | Sufixo | `core` | T2 | ⬡ 195 | +None PE | power_flat: 3, value_pct: 0.15, power_pct: 0.1 |
| `part_swamp_gem_01` | **Âmbar Fétido de Adicional de Insalubridade** | Sufixo | `gem` | T2 | ⬡ 215 | +None PE | power_flat: 2, value_pct: 0.4, power_pct: 0.08 |
| `part_swamp_gem_t3` | **Esmeralda Pestilenta Polida** | Base (Chassi) | `gem` | T3 | ⬡ 225 | +92 PE | power_flat: 26 |
| `part_swamp_filter_t3` | **Filtro de Bio-Éter do Charco** | Prefixo | `filter` | T3 | ⬡ 210 | +86 PE | mitigation_flat: 20 |
| `part_swamp_core_t3` | **Núcleo Virulento Concentrado** | Sufixo | `core` | T3 | ⬡ 220 | +88 PE | power_flat: 24 |

### Consórcio Bélico Valkyria (`corp_valkyria`) — Filial: Ferragem
*Especialidade:* Ligas estriadas, guardas articuladas e exoesqueletos de proteção.

| ID da Peça | Nome | Papel | Tipo | Tier | Custo Base | Bônus PE | Efeitos |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| `part_valkyria_blade_t1` | **Lâmina Estriada Valkyria** | Base (Chassi) | `blade` | T1 | ⬡ 55 | +28 PE | power_flat: 6 |
| `part_valkyria_guard` | **Guarda Articulada Valkyria** | Prefixo | `guard` | T1 | ⬡ 60 | +15 PE | power_flat: 3 |
| `part_valkyria_core_t1` | **Rebite Balístico Valkyria** | Sufixo | `core` | T1 | ⬡ 50 | +24 PE | mitigation_flat: 5 |
| `part_valkyria_plate` | **Placa Estriada Valkyria** | Base (Chassi) | `plating` | T2 | ⬡ 90 | +20 PE | power_flat: 6 |
| `part_valkyria_blade` | **Chassi de Combate Valkyria** | Base (Chassi) | `blade` | T2 | ⬡ 170 | +15 PE | power_flat: 15 |
| `part_valkyria_core` | **Placa Balística Valkyria** | Sufixo | `core` | T2 | ⬡ 160 | +14 PE | power_flat: 14 |
| `part_valkyria_blade_t3` | **Chassi Exterminador Valkyria** | Base (Chassi) | `blade` | T3 | ⬡ 230 | +95 PE | power_flat: 28 |
| `part_valkyria_guard_t3` | **Guarda de Aço-Titânio Valkyria** | Prefixo | `guard` | T3 | ⬡ 210 | +85 PE | mitigation_flat: 20 |
| `part_valkyria_core_t3` | **Núcleo de Blindagem Valkyria** | Sufixo | `core` | T3 | ⬡ 225 | +88 PE | mitigation_flat: 22 |

---

## 3. Peças Modulares Agrupadas por Papel

### 3.1 Chassis Base (Corpo do Item)

| ID | Nome | Corporação | Filial | Tier | Custo | Bônus PE | Efeito |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| `part_gob_blade_01` | **Lâmina Dentada de Fricção Rápida** | Engenharia Goblin S.A. | None | T1 | ⬡ 75 | +None PE | power_pct: 0.1, value_pct: 0.1 |
| `part_elf_gem_01` | **Gema Focalizadora de Cristal Élfico** | Consórcio Élfico de Alta Precisão | None | T1 | ⬡ 130 | +None PE | power_pct: 0.12, value_pct: 0.4 |
| `part_dwarf_plating_01` | **Placa Reforçada de Aço Anão** | Irmãos Anões de Aço Negro & Cia. | None | T1 | ⬡ 85 | +None PE | power_pct: 0.1, value_pct: 0.15 |
| `part_dwarf_plating_02` | **Lamelas Robustas de Granito Vulcânico** | Irmãos Anões de Aço Negro & Cia. | None | T1 | ⬡ 95 | +None PE | power_flat: 4, value_pct: 0.2 |
| `part_swamp_filter_01` | **Filtro Decantador de Caldo Concentrado** | Sindicato dos Alquimistas de Pântano | None | T1 | ⬡ 75 | +None PE | energy_bonus_flat: 8, value_pct: 0.25 |
| `part_swamp_filter_02` | **Prensa de Suplemento de Algas Pútridas** | Sindicato dos Alquimistas de Pântano | None | T1 | ⬡ 65 | +None PE | energy_bonus_flat: 5, value_pct: 0.15 |
| `part_crown_plating_01` | **Couro Escamado Padrão da Fazenda Real** | Manufatura Notarial da Coroa | None | T1 | ⬡ 90 | +None PE | power_pct: 0.15, value_pct: 0.2 |
| `part_flamel_vial` | **Ampola Reforçada Flamel** | Sindicato Bioalquímico Flamel & Associados | Alquimia | T1 | ⬡ 30 | +5 PE | charges_flat: 1 |
| `part_aethelgard_blade` | **Lâmina Forjada Aethelgard** | Siderúrgica Aethelgard & Cia. | Ferragem | T1 | ⬡ 50 | +25 PE | power_flat: 5 |
| `part_valkyria_blade_t1` | **Lâmina Estriada Valkyria** | Consórcio Bélico Valkyria | Ferragem | T1 | ⬡ 55 | +28 PE | power_flat: 6 |
| `part_chancellor_gem_t1` | **Ágata Notarial Lapidada** | Lapidação Imperial Chanceler & Filhos | Joalheria | T1 | ⬡ 55 | +26 PE | power_flat: 6 |
| `part_gob_blade_02` | **Lâmina Predatória de Aço Farpado** | Engenharia Goblin S.A. | None | T2 | ⬡ 180 | +None PE | power_pct: 0.18, value_pct: 0.4 |
| `part_gob_filter_01` | **Compressor de Porções Industriais** | Engenharia Goblin S.A. | None | T2 | ⬡ 150 | +None PE | charges_flat: 1, value_pct: 0.3 |
| `part_elf_blade_01` | **Lâmina Temperada a Frio Élfico** | Consórcio Élfico de Alta Precisão | None | T2 | ⬡ 190 | +None PE | power_pct: 0.15, value_pct: 0.15 |
| `part_elf_gem_02` | **Safira Penitencial de Condutividade Alta** | Consórcio Élfico de Alta Precisão | None | T2 | ⬡ 240 | +None PE | power_pct: 0.22, value_pct: 0.4 |
| `part_dwarf_plating_03` | **Couraça Maciça de Minério Negro** | Irmãos Anões de Aço Negro & Cia. | None | T2 | ⬡ 210 | +None PE | power_flat: 6, value_pct: 0.2 |
| `part_flamel_reagent_t2` | **Reativo Alcalino Flamel** | Sindicato Bioalquímico Flamel & Associados | Alquimia | T2 | ⬡ 115 | +50 PE | power_flat: 12 |
| `part_valkyria_plate` | **Placa Estriada Valkyria** | Consórcio Bélico Valkyria | Ferragem | T2 | ⬡ 90 | +20 PE | power_flat: 6 |
| `part_valkyria_blade` | **Chassi de Combate Valkyria** | Consórcio Bélico Valkyria | Ferragem | T2 | ⬡ 170 | +15 PE | power_flat: 15 |
| `part_aethelgard_blade_t2` | **Lâmina Prensada Aethelgard** | Siderúrgica Aethelgard & Cia. | Ferragem | T2 | ⬡ 110 | +50 PE | power_flat: 12 |
| `part_chancellor_frame` | **Armação de Ouro Chanceler** | Lapidação Imperial Chanceler & Filhos | Joalheria | T2 | ⬡ 180 | +14 PE | power_flat: 14 |
| `part_gob_blade_03` | **Gume Guilhotina de Demissão Sumária** | Engenharia Goblin S.A. | None | T3 | ⬡ 380 | +None PE | power_flat: 7, power_pct: 0.2, value_pct: 0.35, power_pct: 0.15 |
| `part_dwarf_plating_04` | **Blindagem Impenetrável da Cidadela Subterrânea** | Irmãos Anões de Aço Negro & Cia. | None | T3 | ⬡ 390 | +None PE | power_flat: 8, power_pct: 0.12, value_pct: 0.4 |
| `part_flamel_reagent_t3` | **Reativo Filosofal Flamel** | Sindicato Bioalquímico Flamel & Associados | Alquimia | T3 | ⬡ 235 | +96 PE | power_flat: 28 |
| `part_swamp_gem_t3` | **Esmeralda Pestilenta Polida** | Sindicato dos Alquimistas de Pântano | Alquimia | T3 | ⬡ 225 | +92 PE | power_flat: 26 |
| `part_aethelgard_blade_t3` | **Lâmina de Mithril Aethelgard** | Siderúrgica Aethelgard & Cia. | Ferragem | T3 | ⬡ 220 | +90 PE | power_flat: 25 |
| `part_valkyria_blade_t3` | **Chassi Exterminador Valkyria** | Consórcio Bélico Valkyria | Ferragem | T3 | ⬡ 230 | +95 PE | power_flat: 28 |
| `part_crown_blade_t3` | **Lâmina Imperial Notarial** | Manufatura Notarial da Coroa | Ferragem | T3 | ⬡ 200 | +84 PE | power_flat: 22 |
| `part_chancellor_gem_t3` | **Diamante Imperial Chanceler** | Lapidação Imperial Chanceler & Filhos | Joalheria | T3 | ⬡ 240 | +98 PE | power_flat: 30 |

### 3.2 Modificadores de Prefixo

| ID | Nome | Corporação | Filial | Tier | Custo | Bônus PE | Efeito |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| `part_elf_filter_01` | **Refinador Gustativo de Alta Gastronomia** | Consórcio Élfico de Alta Precisão | None | T1 | ⬡ 110 | +None PE | energy_bonus_flat: 10, value_pct: 0.35 |
| `part_crown_hilt_01` | **Pomo Gravado com Termo de Responsabilidade** | Manufatura Notarial da Coroa | None | T1 | ⬡ 115 | +None PE | power_flat: 3, value_pct: 0.25, power_pct: 0.08 |
| `part_flamel_nozzle` | **Bocal Dosador Flamel** | Sindicato Bioalquímico Flamel & Associados | Alquimia | T1 | ⬡ 70 | +8 PE | power_flat: 8 |
| `part_swamp_prefix_01` | **Válvula de Lodo Filtrado** | Sindicato dos Alquimistas de Pântano | Alquimia | T1 | ⬡ 75 | +8 PE | power_flat: 8 |
| `part_aethelgard_hilt` | **Empunhadura Padrão Aethelgard** | Siderúrgica Aethelgard & Cia. | Ferragem | T1 | ⬡ 40 | +10 PE | power_flat: 2 |
| `part_valkyria_guard` | **Guarda Articulada Valkyria** | Consórcio Bélico Valkyria | Ferragem | T1 | ⬡ 60 | +15 PE | power_flat: 3 |
| `part_dwarf_prefix_01` | **Presilha Forjada Anã** | Irmãos Anões de Aço Negro & Cia. | Ferragem | T1 | ⬡ 70 | +8 PE | power_flat: 8 |
| `part_chancellor_pin` | **Broche de Fixação Imperial** | Lapidação Imperial Chanceler & Filhos | Joalheria | T1 | ⬡ 80 | +8 PE | power_flat: 8 |
| `part_gob_hilt_01` | **Empunhadura Sem Guarda de Risco** | Engenharia Goblin S.A. | None | T2 | ⬡ 160 | +None PE | power_flat: 5, value_pct: 0.1, power_pct: 0.1 |
| `part_dwarf_plating_06` | **Reforço Torácico com Apólice Integrada** | Irmãos Anões de Aço Negro & Cia. | None | T2 | ⬡ 230 | +None PE | power_flat: 6, value_pct: 0.35, power_pct: 0.12 |
| `part_swamp_filter_03` | **Dosador Graduado de Prontuário Médico** | Sindicato dos Alquimistas de Pântano | None | T2 | ⬡ 175 | +None PE | charges_flat: 1, value_pct: 0.25, energy_bonus_flat: 10 |
| `part_swamp_filter_04` | **Válvula de Infusão de Produtividade Contínua** | Sindicato dos Alquimistas de Pântano | None | T2 | ⬡ 165 | +None PE | energy_bonus_flat: 6, value_pct: 0.15, charges_flat: 1 |
| `part_crown_hilt_02` | **Guarda-Mão de Cláusula Rescisória** | Manufatura Notarial da Coroa | None | T2 | ⬡ 185 | +None PE | power_pct: 0.12, value_pct: 0.15, power_pct: 0.12 |
| `part_crown_plating_02` | **Braçadeira Chancelada por Laudo Pericial** | Manufatura Notarial da Coroa | None | T2 | ⬡ 200 | +None PE | power_flat: 4, value_pct: 0.2, power_pct: 0.1 |
| `part_flamel_vial_t2` | **Ampola Graduada Flamel** | Sindicato Bioalquímico Flamel & Associados | Alquimia | T2 | ⬡ 105 | +45 PE | recovery_flat: 10 |
| `part_aethelgard_hilt_t2` | **Empunhadura Reforçada Aethelgard** | Siderúrgica Aethelgard & Cia. | Ferragem | T2 | ⬡ 95 | +40 PE | mitigation_flat: 8 |
| `part_chancellor_pin_t2` | **Broche de Platina Chanceler** | Lapidação Imperial Chanceler & Filhos | Joalheria | T2 | ⬡ 110 | +46 PE | mitigation_flat: 10 |
| `part_dwarf_plating_05` | **Revestimento Galvanizado Anti-Ácido** | Irmãos Anões de Aço Negro & Cia. | None | T3 | ⬡ 350 | +None PE | power_flat: 5, power_pct: 0.1, value_pct: 0.5 |
| `part_flamel_vial_t3` | **Ampola de Vidro Dragônico Flamel** | Sindicato Bioalquímico Flamel & Associados | Alquimia | T3 | ⬡ 215 | +88 PE | recovery_flat: 25 |
| `part_swamp_filter_t3` | **Filtro de Bio-Éter do Charco** | Sindicato dos Alquimistas de Pântano | Alquimia | T3 | ⬡ 210 | +86 PE | mitigation_flat: 20 |
| `part_aethelgard_hilt_t3` | **Empunhadura Nobre Aethelgard** | Siderúrgica Aethelgard & Cia. | Ferragem | T3 | ⬡ 200 | +80 PE | mitigation_flat: 18 |
| `part_valkyria_guard_t3` | **Guarda de Aço-Titânio Valkyria** | Consórcio Bélico Valkyria | Ferragem | T3 | ⬡ 210 | +85 PE | mitigation_flat: 20 |
| `part_chancellor_frame_t3` | **Armação de Adamante Chanceler** | Lapidação Imperial Chanceler & Filhos | Joalheria | T3 | ⬡ 225 | +90 PE | mitigation_flat: 22 |

### 3.3 Modificadores de Sufixo

| ID | Nome | Corporação | Filial | Tier | Custo | Bônus PE | Efeito |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| `part_dwarf_core_01` | **Âncora Gravitacional de Minas Instáveis** | Irmãos Anões de Aço Negro & Cia. | None | T1 | ⬡ 125 | +None PE | terrain_mitigation: unstable_mine, value_pct: 0.2 |
| `part_swamp_core_01` | **Filtro Neutralizador de Miasma Tóxico** | Sindicato dos Alquimistas de Pântano | None | T1 | ⬡ 120 | +None PE | terrain_mitigation: toxic_swamp, value_pct: 0.15 |
| `part_crown_gem_01` | **Ágata Notarial de Vigor Funcional** | Manufatura Notarial da Coroa | None | T1 | ⬡ 110 | +None PE | power_flat: 3, value_pct: 0.25 |
| `part_crown_core_01` | **Inscrição Ígnea de Calefação Regulatória** | Manufatura Notarial da Coroa | None | T1 | ⬡ 130 | +None PE | terrain_mitigation: glacier_frost, value_pct: 0.2 |
| `part_flamel_catalyst` | **Catalisador Bioquímico Flamel** | Sindicato Bioalquímico Flamel & Associados | Alquimia | T1 | ⬡ 55 | +12 PE | energy_bonus_flat: 10 |
| `part_aethelgard_core` | **Rebite de Fixação Aethelgard** | Siderúrgica Aethelgard & Cia. | Ferragem | T1 | ⬡ 60 | +8 PE | power_flat: 8 |
| `part_gob_core_00` | **Detonador de Atrito Goblin** | Engenharia Goblin S.A. | Ferragem | T1 | ⬡ 65 | +7 PE | power_flat: 7 |
| `part_valkyria_core_t1` | **Rebite Balístico Valkyria** | Consórcio Bélico Valkyria | Ferragem | T1 | ⬡ 50 | +24 PE | mitigation_flat: 5 |
| `part_elf_core_00` | **Matriz de Ressonância Élfica** | Consórcio Élfico de Alta Precisão | Joalheria | T1 | ⬡ 75 | +8 PE | power_flat: 8 |
| `part_gob_core_02` | **Disjuntor de Sobrecarga Calculada** | Engenharia Goblin S.A. | None | T2 | ⬡ 210 | +None PE | power_flat: 4, value_pct: 0.2, power_pct: 0.12 |
| `part_elf_gem_03` | **Topázio de Compensação de Turno Noturno** | Consórcio Élfico de Alta Precisão | None | T2 | ⬡ 190 | +None PE | power_pct: 0.08, value_pct: 0.25, power_pct: 0.08 |
| `part_elf_core_02` | **Matriz Rúnica de Compliance Arcano** | Consórcio Élfico de Alta Precisão | None | T2 | ⬡ 230 | +None PE | power_flat: 5, value_pct: 0.35, power_pct: 0.1 |
| `part_dwarf_core_02` | **Estrutura de Contenção de Responsabilidade Limitada** | Irmãos Anões de Aço Negro & Cia. | None | T2 | ⬡ 220 | +None PE | power_flat: 6, value_pct: 0.3, power_pct: 0.1 |
| `part_swamp_core_02` | **Injetor Químico de Fuga e Evacuação** | Sindicato dos Alquimistas de Pântano | None | T2 | ⬡ 185 | +None PE | energy_bonus_flat: 8, value_pct: 0.35, charges_flat: 1 |
| `part_swamp_core_03` | **Difusor Balsâmico de Eucalipto Medicinal** | Sindicato dos Alquimistas de Pântano | None | T2 | ⬡ 195 | +None PE | power_flat: 3, value_pct: 0.15, power_pct: 0.1 |
| `part_swamp_gem_01` | **Âmbar Fétido de Adicional de Insalubridade** | Sindicato dos Alquimistas de Pântano | None | T2 | ⬡ 215 | +None PE | power_flat: 2, value_pct: 0.4, power_pct: 0.08 |
| `part_crown_gem_02` | **Quartzo de Austeridade Orçamentária** | Manufatura Notarial da Coroa | None | T2 | ⬡ 195 | +None PE | value_pct: 0.45, power_flat: 2 |
| `part_crown_core_02` | **Selo Rúnico de Alvará de Funcionamento** | Manufatura Notarial da Coroa | None | T2 | ⬡ 220 | +None PE | power_flat: 5, value_pct: 0.35, power_pct: 0.1 |
| `part_crown_core_03` | **Condutor Térmico de Prevenção à Hipotermia** | Manufatura Notarial da Coroa | None | T2 | ⬡ 190 | +None PE | power_flat: 3, value_pct: 0.2, power_pct: 0.1 |
| `part_flamel_core_t2` | **Catalisador Purificado Flamel** | Sindicato Bioalquímico Flamel & Associados | Alquimia | T2 | ⬡ 110 | +48 PE | power_flat: 10 |
| `part_valkyria_core` | **Placa Balística Valkyria** | Consórcio Bélico Valkyria | Ferragem | T2 | ⬡ 160 | +14 PE | power_flat: 14 |
| `part_aethelgard_core_t2` | **Rebite Temperado Aethelgard** | Siderúrgica Aethelgard & Cia. | Ferragem | T2 | ⬡ 100 | +45 PE | power_flat: 10 |
| `part_chancellor_core` | **Núcleo de Safira Imperial** | Lapidação Imperial Chanceler & Filhos | Joalheria | T2 | ⬡ 110 | +18 PE | power_flat: 4 |
| `part_gob_core_01` | **Câmara de Detonação Magmática** | Engenharia Goblin S.A. | None | T3 | ⬡ 320 | +None PE | power_pct: 0.2, power_flat: 4, value_pct: 0.35 |
| `part_gob_core_03` | **Injetor de Adrenalina de Turno Dobrado** | Engenharia Goblin S.A. | None | T3 | ⬡ 340 | +None PE | energy_bonus_flat: 12, charges_flat: 1, value_pct: 0.25, energy_bonus_flat: 15 |
| `part_elf_core_01` | **Núcleo Criogênico de Estabilidade Boreal** | Consórcio Élfico de Alta Precisão | None | T3 | ⬡ 330 | +None PE | terrain_mitigation: glacier_frost, power_flat: 3, value_pct: 0.3 |
| `part_elf_gem_04` | **Gema Lapidada de Isenção Fiscal** | Consórcio Élfico de Alta Precisão | None | T3 | ⬡ 370 | +None PE | value_pct: 0.5, power_flat: 3, value_pct: 0.3 |
| `part_flamel_core_t3` | **Catalisador Primordial Flamel** | Sindicato Bioalquímico Flamel & Associados | Alquimia | T3 | ⬡ 225 | +92 PE | power_flat: 24 |
| `part_swamp_core_t3` | **Núcleo Virulento Concentrado** | Sindicato dos Alquimistas de Pântano | Alquimia | T3 | ⬡ 220 | +88 PE | power_flat: 24 |
| `part_aethelgard_core_t3` | **Núcleo de Forja Aethelgard** | Siderúrgica Aethelgard & Cia. | Ferragem | T3 | ⬡ 210 | +85 PE | power_flat: 22 |
| `part_valkyria_core_t3` | **Núcleo de Blindagem Valkyria** | Consórcio Bélico Valkyria | Ferragem | T3 | ⬡ 225 | +88 PE | mitigation_flat: 22 |
| `part_chancellor_core_t3` | **Prisma Solar Chanceler** | Lapidação Imperial Chanceler & Filhos | Joalheria | T3 | ⬡ 230 | +94 PE | power_flat: 26 |
| `part_crown_gem_t3` | **Rubi Imperial Selado** | Manufatura Notarial da Coroa | Joalheria | T3 | ⬡ 215 | +88 PE | power_flat: 25 |

---

## 4. Receitas e Templates de Itens Prontos

### 4.1 Receitas de Montagem Padrão (`data/recipes_seed.json`)

| ID | Nome da Receita | Slot | Filial | Requisitos |
| :--- | :--- | :--- | :--- | :--- |
| `rec_01` | **Espada Longa de Aço** | Arma | Ferragem | Padrão da oficina |
| `rec_02` | **Amuleto de Guarda-Alma** | Joia | Joalheria | Padrão da oficina |
| `rec_03` | **Cota de Malha** | Armadura | Ferragem | Padrão da oficina |
| `rec_04` | **Poção de Cura** | Consumível | Alquimia | Padrão da oficina |
| `rec_05` | **Ração de Batalha** | Consumível | Culinária | Padrão da oficina |
| `rec_06` | **Runa de Proteção** | Inscrição | Alquimia | Padrão da oficina |

### 4.2 Templates de Itens Prontos do Balcão (`data/market_templates_seed.json`)

| Nome | Slot | Qualidade | Bônus PE | Mitigação de Terreno | Preço Base |
| :--- | :--- | :---: | :---: | :--- | :---: |
| **Espada de Cavalaria** | Arma | Normal | +18 PE | Nenhuma | ⬡ 220 |
| **Montante de Aço Negro** | Arma | Ótimo | +28 PE | Nenhuma | ⬡ 380 |
| **Armadura de Placas Leve** | Armadura | Normal | +15 PE | Nenhuma | ⬡ 240 |
| **Gibão de Couro Endurecido** | Armadura | Ótimo | +24 PE | Nenhuma | ⬡ 360 |
| **Manto Anti-Tóxico** | Armadura | Normal | +12 PE | toxic_swamp | ⬡ 270 |
| **Anel de Prata Encantado** | Joia | Normal | +10 PE | Nenhuma | ⬡ 180 |
| **Pingente de Guarda-Corpo** | Joia | Ótimo | +18 PE | Nenhuma | ⬡ 300 |
| **Runa de Purificação do Pântano** | Inscrição | Normal | +10 PE | toxic_swamp | ⬡ 220 |
| **Inscrição de Calor Ígneo** | Inscrição | Normal | +10 PE | glacier_frost | ⬡ 230 |
| **Selo de Firmeza Estrutural** | Inscrição | Normal | +12 PE | unstable_mine | ⬡ 220 |
| **Ração Militar Fortificada** | Consumível | Normal | +5 PE | Nenhuma | ⬡ 95 |
| **Tônico de Foco Rápido** | Consumível | Ótimo | +8 PE | Nenhuma | ⬡ 160 |
| **Elixir do Fôlego Ártico** | Consumível | Normal | +0 PE | glacier_frost | ⬡ 130 |

---

## 5. Catálogo de Afixos Gerais (`data/affixes_seed.json` & `affix_effects_seed.json`)

| ID do Afixo | Tipo | Nome Masculino | Nome Feminino | Método de Desbloqueio | Custo | Efeitos Concedidos |
| :--- | :---: | :--- | :--- | :--- | :---: | :--- |
| `pref_afiada` | Prefixo | Afiado | Afiada | start | ⬡ 0 | power_pct: 0.1; value_pct: 0.1 |
| `pref_concentrada` | Prefixo | Concentrado | Concentrada | start | ⬡ 0 | energy_bonus_flat: 8; value_pct: 0.25 |
| `pref_economico` | Prefixo | Econômico | Econômica | start | ⬡ 0 | value_pct: 0.45; power_flat: 2 |
| `pref_encantada` | Prefixo | Encantado | Encantada | start | ⬡ 0 | power_pct: 0.12; value_pct: 0.4 |
| `pref_escamada` | Prefixo | Escamado | Escamada | market | ⬡ 300 | power_pct: 0.15; value_pct: 0.2 |
| `pref_farta` | Prefixo | Farto | Farta | market | ⬡ 350 | charges_flat: 1; value_pct: 0.3 |
| `pref_firme` | Prefixo | Firme | Firme | market | ⬡ 250 | terrain_mitigation: unstable_mine; value_pct: 0.2 |
| `pref_galvanizado` | Prefixo | Galvanizado | Galvanizada | market | ⬡ 300 | power_flat: 5; power_pct: 0.1; value_pct: 0.5 |
| `pref_glacial` | Prefixo | Glacial | Glacial | market | ⬡ 350 | terrain_mitigation: glacier_frost; power_flat: 3; value_pct: 0.3 |
| `pref_ignea` | Prefixo | Ígneo | Ígnea | start | ⬡ 0 | terrain_mitigation: glacier_frost; value_pct: 0.2 |
| `pref_impenetravel` | Prefixo | Impenetrável | Impenetrável | market | ⬡ 450 | power_flat: 8; power_pct: 0.12; value_pct: 0.4 |
| `pref_macico` | Prefixo | Maciço | Maciça | start | ⬡ 0 | power_flat: 6; value_pct: 0.2 |
| `pref_nutritiva` | Prefixo | Nutritivo | Nutritiva | start | ⬡ 0 | energy_bonus_flat: 5; value_pct: 0.15 |
| `pref_penitente` | Prefixo | Penitente | Penitente | loot | ⬡ 0 | power_pct: 0.22; value_pct: 0.4 |
| `pref_predatorio` | Prefixo | Predatório | Predatória | market | ⬡ 350 | power_pct: 0.18; value_pct: 0.4 |
| `pref_purificada` | Prefixo | Purificado | Purificada | start | ⬡ 0 | terrain_mitigation: toxic_swamp; value_pct: 0.15 |
| `pref_reforcada` | Prefixo | Reforçado | Reforçada | start | ⬡ 0 | power_pct: 0.1; value_pct: 0.15 |
| `pref_robusta` | Prefixo | Robusto | Robusta | market | ⬡ 250 | power_flat: 4; value_pct: 0.2 |
| `pref_saborosa` | Prefixo | Saboroso | Saborosa | market | ⬡ 200 | energy_bonus_flat: 10; value_pct: 0.35 |
| `pref_temperada` | Prefixo | Temperado | Temperada | market | ⬡ 300 | power_pct: 0.15; value_pct: 0.15 |
| `pref_vigorosa` | Prefixo | Vigoroso | Vigorosa | loot | ⬡ 0 | power_flat: 3; value_pct: 0.25 |
| `pref_vulcanico` | Prefixo | Vulcânico | Vulcânica | loot | ⬡ 0 | power_pct: 0.2; power_flat: 4; value_pct: 0.35 |
| `suf_acidente_trabalho` | Sufixo | - | - | start | ⬡ 0 | power_flat: 5; value_pct: 0.1; power_pct: 0.1 |
| `suf_adicional_noturno` | Sufixo | - | - | market | ⬡ 350 | power_pct: 0.08; value_pct: 0.25; power_pct: 0.08 |
| `suf_alvara` | Sufixo | - | - | start | ⬡ 0 | power_flat: 5; value_pct: 0.35; power_pct: 0.1 |
| `suf_antidoto_eucalipto` | Sufixo | - | - | start | ⬡ 0 | power_flat: 3; value_pct: 0.15; power_pct: 0.1 |
| `suf_compliance_magico` | Sufixo | - | - | market | ⬡ 380 | power_flat: 5; value_pct: 0.35; power_pct: 0.1 |
| `suf_eficiencia_tributaria` | Sufixo | - | - | market | ⬡ 400 | value_pct: 0.5; power_flat: 3; value_pct: 0.3 |
| `suf_evacuacao` | Sufixo | - | - | loot | ⬡ 0 | energy_bonus_flat: 8; value_pct: 0.35; charges_flat: 1 |
| `suf_insalubridade` | Sufixo | - | - | start | ⬡ 0 | power_flat: 2; value_pct: 0.4; power_pct: 0.08 |
| `suf_laudo_pericial` | Sufixo | - | - | start | ⬡ 0 | power_flat: 4; value_pct: 0.2; power_pct: 0.1 |
| `suf_prevencao_hipotermia` | Sufixo | - | - | start | ⬡ 0 | power_flat: 3; value_pct: 0.2; power_pct: 0.1 |
| `suf_produtividade` | Sufixo | - | - | start | ⬡ 0 | energy_bonus_flat: 6; value_pct: 0.15; charges_flat: 1 |
| `suf_prontuario` | Sufixo | - | - | start | ⬡ 0 | charges_flat: 1; value_pct: 0.25; energy_bonus_flat: 10 |
| `suf_rescisao` | Sufixo | - | - | loot | ⬡ 0 | power_pct: 0.12; value_pct: 0.15; power_pct: 0.12 |
| `suf_rescisao_imediata` | Sufixo | - | - | loot | ⬡ 0 | power_flat: 7; power_pct: 0.2; value_pct: 0.35; power_pct: 0.15 |
| `suf_responsabilidade_limitada` | Sufixo | - | - | start | ⬡ 0 | power_flat: 6; value_pct: 0.3; power_pct: 0.1 |
| `suf_risco_calculado` | Sufixo | - | - | start | ⬡ 0 | power_flat: 4; value_pct: 0.2; power_pct: 0.12 |
| `suf_seguro_vida` | Sufixo | - | - | market | ⬡ 300 | power_flat: 6; value_pct: 0.35; power_pct: 0.12 |
| `suf_termo_responsabilidade` | Sufixo | - | - | market | ⬡ 250 | power_flat: 3; value_pct: 0.25; power_pct: 0.08 |
| `suf_turno_extraordinario` | Sufixo | - | - | market | ⬡ 350 | energy_bonus_flat: 12; charges_flat: 1; value_pct: 0.25; energy_bonus_flat: 15 |