import { 
  GameSystem, 
  HeroAthlete, 
  ModularPart, 
  AssembledItem, 
  BacklogTask 
} from '../types/game';

export const INITIAL_GAME_SYSTEMS: GameSystem[] = [
  // FASE 1
  {
    id: 'sys-01',
    name: 'Fase 1: RH, Medicina Ocupacional & Contratos Plurianuais',
    pillar: 'phase1_hr',
    status: 'implemented',
    complexity: 'Alta',
    version: 'v0.7.1',
    description: 'Gestão da guilda com vínculos de 1 a 3 temporadas, departamento médico progressivo e recuperação de fadiga (5 pts passivos para titulares, 20 pts de folga na reserva).',
    architectureDetails: [
      'Contratos plurianuais com reajuste por inflação no término',
      'Departamento Médico (Tenda de Curativos -> Casa de Banhos Termais)',
      'Status ocupacionais: Apto, Fatigado, Afastado por Lesão Ocupacional'
    ],
    dependencies: [],
    techLeadNotes: 'Total conformidade com AI_MASTER_CONTEXT.md. Fadiga > 70% bloqueia escalação na Fase 3.'
  },
  {
    id: 'sys-02',
    name: 'Fase 1: Posições Operacionais & Ciclo RPS',
    pillar: 'phase1_hr',
    status: 'implemented',
    complexity: 'Alta',
    version: 'v0.7.1',
    description: '5 funções táticas de combate: Vanguarda, Flanqueador, Retaguarda, Suporte e Batedor, com ciclo de vantagens triangulares no combate.',
    architectureDetails: [
      'Vanguarda vence Flanqueador, Flanqueador vence Retaguarda, Retaguarda vence Vanguarda',
      'Suporte mitiga dreno de suprimentos e Batedor antecipa encontros',
      'Atributos primários: str, agi, vit, int, wis, lck ponderados no Poder (1-100)'
    ],
    dependencies: ['sys-01'],
    techLeadNotes: 'Validado em tests/test_positions.py com 100% de aprovação.'
  },
  {
    id: 'sys-03',
    name: 'Fase 1: Academia de Base & Mercado com Potencial Oculto [???]',
    pillar: 'phase1_hr',
    status: 'implemented',
    complexity: 'Média',
    version: 'v0.7.1',
    description: 'Captação de aprendizes com potencial de 1 a 5 estrelas revelado na Academia, contra leilões de veteranos com potencial oculto [???] no mercado livre.',
    architectureDetails: [
      'Academia custa 40 ouro/semana para manutenção de aprendizes',
      'Mercado de transferências gera assimetria de informação proposital',
      'Idade de declínio aos ~31 anos governa aposentadoria gradual'
    ],
    dependencies: ['sys-01'],
    techLeadNotes: 'Trade-off clássico de gestão corporativa.'
  },

  // FASE 2
  {
    id: 'sys-04',
    name: 'Fase 2: Complexo Industrial B2B & 11 Corporações Parceiras',
    pillar: 'phase2_workshop',
    status: 'implemented',
    complexity: 'Crítica',
    version: 'v0.7.1',
    description: 'Cadeia de suprimentos corporativa com 11 fornecedoras (Fundição Ferro Negro, Boticários Arcanos, Lapidações Celestes, Consórcio Mercurius, Ração Real, etc.) e níveis de convênio Bronze, Prata e Ouro.',
    architectureDetails: [
      'Convênio Bronze (Nv. 1): peças Tier 1 e 10% desconto spot',
      'Convênio Prata (Nv. 3 / 100 Brand XP): peças Tier 2 e confiança >= 55',
      'Convênio Ouro (Nv. 7 / 300 Brand XP): peças Tier 3 e componentes lendários'
    ],
    dependencies: [],
    techLeadNotes: 'Expansão concluída na v0.7.1 incluindo corp_mercurius (alvarás) e corp_crown_rations (rações).'
  },
  {
    id: 'sys-05',
    name: 'Fase 2: Montagem Modular de 3 Componentes & Tinkering',
    pillar: 'phase2_workshop',
    status: 'implemented',
    complexity: 'Crítica',
    version: 'v0.7.1',
    description: 'Montagem física integrando 1 Modificador de Entrada (Prefixo) + 1 Chassi Principal (Base) + 1 Núcleo de Ajuste (Sufixo). Nomes concisos (1-2 palavras).',
    architectureDetails: [
      'Regra de concisão estrita: peças com 1-2 palavras geram nomes elegantes (ex: Pesado Canhão de Aço)',
      'Tinkering Inter-Marcas: risco de falha Gororoba vs chance de Overclock Não-Autorizado (+15% PE)',
      'Qualidades canônicas: Fraco, Normal, Ótimo, Lendário'
    ],
    dependencies: ['sys-04'],
    techLeadNotes: 'Testado em test_b2b_assembly.py garantindo que peças de marcas rivais geram tensão de montagem.'
  },
  {
    id: 'sys-06',
    name: 'Fase 2: Linha de Montagem Automatizada com Operários',
    pillar: 'phase2_workshop',
    status: 'implemented',
    complexity: 'Alta',
    version: 'v0.7.1',
    description: 'Operários fabris assalariados produzem lotes de equipamentos White-label automaticamente a cada ciclo, creditando receita limpa no DRE.',
    architectureDetails: [
      'Salários de operários debitados no DRE semanal da guilda',
      'Produção seriada sem necessidade de intervenção manual rodada a rodada',
      'Escalabilidade fabril vinculada ao nível das filiais corporativas'
    ],
    dependencies: ['sys-04', 'sys-05'],
    techLeadNotes: 'O componente Factorio/Recettear do HeroFoot em pleno funcionamento.'
  },
  {
    id: 'sys-07',
    name: 'Fase 2: Mercado Spot com Cotas Semanais & Ágio +50%',
    pillar: 'phase2_workshop',
    status: 'implemented',
    complexity: 'Média',
    version: 'v0.7.1',
    description: 'Compra avulsa de componentes no mercado atacadista da Câmara, com cota anti-exploit de 5 unidades/peça/semana e ágio de +50% para quem não possui convênio.',
    architectureDetails: [
      'Cota de 5 un./peça/semana para evitar acúmulo desproporcional',
      'Ágio de +50% sem convênio estimula avanço nos níveis de marca',
      'Estoque semanal recalibrado no início da Fase 2'
    ],
    dependencies: ['sys-04'],
    techLeadNotes: 'Impede atalhos fáceis e força o jogador a administrar sua cadeia de fornecimento.'
  },
  {
    id: 'sys-08',
    name: 'Fase 2: Encomendas VIP da Nobreza & Boletim de Mercado',
    pillar: 'phase2_workshop',
    status: 'implemented',
    complexity: 'Média',
    version: 'v0.7.1',
    description: 'Ordens de serviço de alto valor e prestígio no Boletim com prazo de 2 semanas e despacho direto no balcão para nobres e autoridades.',
    architectureDetails: [
      'Pagamento de 2.5x o valor de tabela + pontos de Confiança',
      'Margens de Balcão: Promoção (0.8x), Preço Justo (1.0x), Preço Abusivo (1.35x com taxa 8%)',
      'Despacho direto pela interface sem fricção'
    ],
    dependencies: ['sys-05'],
    techLeadNotes: 'Validado em test_vip_orders.py com 100% de cobertura.'
  },

  // FASE 3
  {
    id: 'sys-09',
    name: 'Fase 3: Engenharia Tática, Party de 6 & Mitigação de Terreno',
    pillar: 'phase3_tactics',
    status: 'implemented',
    complexity: 'Alta',
    version: 'v0.7.1',
    description: 'Escalação da Party de 6 combatentes e 3 apoios, mitigando penalidades de 12% em biomas hostis (Pântano Tóxico, Cripta Glacial, Mina Instável).',
    architectureDetails: [
      'Exatamente 6 titulares: vagas abertas geram penalidade severa',
      'Auto-lineup com algoritmo guloso para melhor escalação',
      'Indicadores visuais de mitigação de terreno ativos na HUD'
    ],
    dependencies: ['sys-01', 'sys-02'],
    techLeadNotes: 'Total conformidade com DESIGN_SPEC_V070_B2B.md.'
  },
  {
    id: 'sys-10',
    name: 'Fase 3: Os 5 Compartimentos Canônicos de Loadout da Expedição',
    pillar: 'phase3_tactics',
    status: 'implemented',
    complexity: 'Média',
    version: 'v0.7.1',
    description: 'Loadout coletivo da Party dividido nos 5 slots: Arsenal Ofensivo, Blindagem Operacional, Dispositivo Tático, Alvará de Risco e Provisão Logística.',
    architectureDetails: [
      '1. Arsenal Ofensivo: Armas, canhões e lâminas (bônus primário de Poder)',
      '2. Blindagem Operacional: Armaduras e couraças (defesa e mitigação)',
      '3. Dispositivo Tático: Joias e anéis cinéticos (agilidade e precisão)',
      '4. Alvará de Risco: Inscrições cartorárias (licenças de bioma e imunidades)',
      '5. Provisão Logística: Rações e kits (energia e suprimentos extras)'
    ],
    dependencies: ['sys-05'],
    techLeadNotes: 'O bônus de slots é limitado por slot_bonus_cap = 15 para preservar equilíbrio estocástico.'
  },

  // FASE 4
  {
    id: 'sys-11',
    name: 'Fase 4: Motor de Incursão em 10 Câmaras & Barra de 100 Suprimentos',
    pillar: 'phase4_dungeon',
    status: 'implemented',
    complexity: 'Crítica',
    version: 'v0.7.1',
    description: 'Simulação paralela onde duas guildas percorrem 10 câmaras com 100 de Suprimento base. Dreno por AGI média, terreno e clima. Se suprimentos zeram, a marcha encerra.',
    architectureDetails: [
      '10 Câmaras sequenciais com probabilidade de encontro de 65%',
      'Custo de sala: base 10 ± 25% reduzido em até 20% pela AGI média da Party',
      'Disputa de encontro resolvida pela razão de Poder Efetivo (+1 PE)'
    ],
    dependencies: ['sys-09', 'sys-10'],
    techLeadNotes: 'Partidas com duração variável simulando a tensão de Darkest Dungeon.'
  },
  {
    id: 'sys-12',
    name: 'Fase 4: Resolução de Mini-Bosses e Boss Final (Câmara 10)',
    pillar: 'phase4_dungeon',
    status: 'implemented',
    complexity: 'Alta',
    version: 'v0.7.1',
    description: 'A Câmara 10 guarda o Boss da Masmorra: se a diferença de Poder Efetivo for >15%, abate exclusivo (+2 PE); se <=15%, abate conjunto (+1 PE para cada).',
    architectureDetails: [
      'Apenas quem chega à Câmara 10 com suprimentos disputa o Boss',
      'Abate Solo rende +2 Pontos de Expedição (PE)',
      'Abate Conjunto rende +1 Ponto de Expedição (PE) para cada guilda'
    ],
    dependencies: ['sys-11'],
    techLeadNotes: 'Calibrado no Monte Carlo para 30% a 60% de chegadas ao Boss.'
  },
  {
    id: 'sys-13',
    name: 'Fase 4: Sincronização 100% Determinística de Placar',
    pillar: 'phase4_dungeon',
    status: 'implemented',
    complexity: 'Média',
    version: 'v0.7.1',
    description: 'Emissão e leitura direta de score_t1 e score_t2 emitidos pelo match_engine.py, eliminando qualquer discrepância entre a tela visual e a tabela da liga.',
    architectureDetails: [
      'Determinismo estrito ancorado em hash((world_seed, week, entity_id))',
      'Frontend consome diretamente os inteiros de placar sem recalcular strings',
      'Logs detalhados de combate são descartados da memória pós-incursão'
    ],
    dependencies: ['sys-11'],
    techLeadNotes: 'Entregue na v0.7.1 para resolver divergências de placar.'
  },

  // FASE 5
  {
    id: 'sys-14',
    name: 'Fase 5: DRE Dinâmico em Tempo Real & Liquidação Semanal',
    pillar: 'phase5_results',
    status: 'implemented',
    complexity: 'Alta',
    version: 'v0.7.1',
    description: 'Extrato financeiro semanal transparente apurando receitas de incursão, balcão, linha B2B, salários, manutenção e reconciliação contábil.',
    architectureDetails: [
      'Apuração contábil no encerramento da Fase 4 sem duplicação de saldo',
      'Discriminação exata de despesas operacionais fixas e variáveis',
      'Reconciliação direta com a tesouraria da guilda'
    ],
    dependencies: ['sys-01', 'sys-06'],
    techLeadNotes: 'Validado em balance_audit_v070_b2b.py.'
  },
  {
    id: 'sys-15',
    name: 'Fase 5: Liga das Guildas, Dissolução por Falência & Auditorias',
    pillar: 'phase5_results',
    status: 'implemented',
    complexity: 'Crítica',
    version: 'v0.7.1',
    description: 'Divisão Nobre e Divisão de Acesso (8 guildas cada, 28 rodadas, 2 acessos e 2 rebaixamentos). As 2 lanternas da Acesso são dissolvidas judicialmente.',
    architectureDetails: [
      '2 ciclos negativos consecutivos decretam falência judicial (Game Over)',
      'Dissolução de lanternas da Acesso com fundação de novas guildas pela Câmara',
      'Auditorias Trimestrais com metas de solvência e subsídios régios'
    ],
    dependencies: ['sys-14'],
    techLeadNotes: 'O Campeão da Divisão Nobre conquista o Alvará de Incursão à Cidadela do Rei Demônio.'
  },
  {
    id: 'sys-16',
    name: 'Perfis Permanentes de Rivais (16 Traços Únicos)',
    pillar: 'phase5_results',
    status: 'implemented',
    complexity: 'Média',
    version: 'v0.7.1',
    description: 'Matriz genética atribuída às guildas rivais via seed mundial (Paredão de Aço, Ofensiva Imprudente, Cooperativa Operária, Predadores do Balcão).',
    architectureDetails: [
      '16 Traços combinam filosofias táticas e comerciais',
      'Persistência determinística ao longo das temporadas',
      'Comportamento no mercado e nas expedições adaptado ao perfil genético'
    ],
    dependencies: ['sys-15'],
    techLeadNotes: 'Testado em test_rival_traits.py com 100% de conformidade.'
  }
];

export const INITIAL_HEROES: HeroAthlete[] = [
  {
    id: 'hero-1',
    name: 'Valdris, o Predatório',
    position: 'Vanguarda',
    level: 16,
    power: 84,
    attributes: { str: 86, agi: 78, vit: 82, int: 50, wis: 60, lck: 72 },
    stamina: 88,
    maxStamina: 100,
    morale: 95,
    wage: 1400,
    contractYears: 2,
    status: 'Apto',
    potentialStars: 4
  },
  {
    id: 'hero-2',
    name: 'Lyra Alchemis',
    position: 'Suporte',
    level: 15,
    power: 88,
    attributes: { str: 55, agi: 72, vit: 70, int: 94, wis: 92, lck: 80 },
    stamina: 82,
    maxStamina: 100,
    morale: 90,
    wage: 1350,
    contractYears: 3,
    status: 'Apto',
    potentialStars: 5
  },
  {
    id: 'hero-3',
    name: 'Gromm Muralha de Rocha',
    position: 'Vanguarda',
    level: 17,
    power: 89,
    attributes: { str: 94, agi: 52, vit: 95, int: 45, wis: 65, lck: 60 },
    stamina: 85,
    maxStamina: 100,
    morale: 88,
    wage: 1500,
    contractYears: 1,
    status: 'Apto',
    potentialStars: 4
  },
  {
    id: 'hero-4',
    name: 'Eldrin Vigia de Quartzo',
    position: 'Retaguarda',
    level: 16,
    power: 83,
    attributes: { str: 75, agi: 80, vit: 76, int: 82, wis: 85, lck: 78 },
    stamina: 94,
    maxStamina: 100,
    morale: 92,
    wage: 1450,
    contractYears: 2,
    status: 'Apto',
    potentialStars: 4
  },
  {
    id: 'hero-5',
    name: 'Kaelen Flecha-Sombria',
    position: 'Batedor',
    level: 15,
    power: 81,
    attributes: { str: 68, agi: 92, vit: 65, int: 70, wis: 78, lck: 85 },
    stamina: 90,
    maxStamina: 100,
    morale: 89,
    wage: 1300,
    contractYears: 3,
    status: 'Apto',
    potentialStars: 5
  },
  {
    id: 'hero-6',
    name: 'Darius Corta-Ventos',
    position: 'Flanqueador',
    level: 16,
    power: 85,
    attributes: { str: 84, agi: 88, vit: 72, int: 58, wis: 62, lck: 76 },
    stamina: 86,
    maxStamina: 100,
    morale: 94,
    wage: 1420,
    contractYears: 2,
    status: 'Apto',
    potentialStars: 4
  }
];

export const INITIAL_MODULAR_PARTS: ModularPart[] = [
  {
    id: 'part-01',
    name: 'Pesado',
    type: 'prefix',
    slot: 'Arsenal Ofensivo',
    corporation: 'corp_iron_foundry',
    tier: 2,
    powerBonus: 6,
    energyBonus: 0,
    terrainMitigation: 'unstable_mine',
    description: 'Modificador de liga reforçada com cromo vulcânico.'
  },
  {
    id: 'part-02',
    name: 'Canhão',
    type: 'base',
    slot: 'Arsenal Ofensivo',
    corporation: 'corp_iron_foundry',
    tier: 2,
    powerBonus: 12,
    energyBonus: 0,
    description: 'Chassi balístico de combate para romper couraças de mini-bosses.'
  },
  {
    id: 'part-03',
    name: 'de Aço',
    type: 'suffix',
    slot: 'Arsenal Ofensivo',
    corporation: 'corp_iron_foundry',
    tier: 2,
    powerBonus: 4,
    energyBonus: 0,
    description: 'Núcleo de ajuste temperado com padrão cartorário.'
  },
  {
    id: 'part-04',
    name: 'Concentrada',
    type: 'prefix',
    slot: 'Provisão Logística',
    corporation: 'corp_crown_rations',
    tier: 1,
    powerBonus: 0,
    energyBonus: 15,
    description: 'Ração desidratada que poupa queima de suprimentos na marcha.'
  },
  {
    id: 'part-05',
    name: 'Ração',
    type: 'base',
    slot: 'Provisão Logística',
    corporation: 'corp_crown_rations',
    tier: 1,
    powerBonus: 0,
    energyBonus: 25,
    description: 'Fardo de provisões básicas com certificado de inspeção real.'
  },
  {
    id: 'part-06',
    name: 'da Intendência',
    type: 'suffix',
    slot: 'Provisão Logística',
    corporation: 'corp_crown_rations',
    tier: 1,
    powerBonus: 0,
    energyBonus: 10,
    description: 'Carimbo de despacho prioritário da Coroa.'
  }
];

export const INITIAL_BACKLOG: BacklogTask[] = [
  // PROXIMO MARCO: v0.8.0
  {
    id: 'TASK-801',
    title: 'Mural da Glória & Memorial Corporativo de Baixas em Serviço',
    pillar: 'phase1_hr',
    priority: 'P0 - Crítica',
    status: 'done',
    versionTarget: 'v0.8.0',
    description: 'Registro histórico solene dos aventureiros condecorados e dos tombados em combate em masmorras de alto risco. Prontuário com expedições completadas, PE conquistados e causa jurídica da baixa ("Sinistro em Incursão sem Cobertura Securitária").',
    acceptanceCriteria: [
      'Tela ou aba no Dashboard exibindo heróis no Quadro de Honra e no Memorial',
      'Cálculo e persistência do histórico perpétuo de heróis caídos sem impacto no save',
      'Geração de epitáfio corporativo conforme LORE_BIBLE.md (7/10)'
    ],
    estimatedPoints: 8
  },
  {
    id: 'TASK-802',
    title: 'Contratação de Veteranos Aposentados (34+ anos) como Instrutores da Academia',
    pillar: 'phase1_hr',
    priority: 'P1 - Alta',
    status: 'backlog',
    versionTarget: 'v0.8.0',
    description: 'Atletas que atingem 34+ anos e encerram contratos podem ser recontratados pela guilda como Instrutores da Academia de Base, transferindo bônus passivo para as novas gerações de aprendizes.',
    acceptanceCriteria: [
      'Opção "Contratar como Instrutor" na rescisão/aposentadoria de heróis com 34+ anos',
      'Bônus passivo de +5 a +15% no crescimento de atributos de jovens aprendizes',
      'Salário reduzido de instrutor debitado na linha de Academia do DRE'
    ],
    estimatedPoints: 5
  },
  {
    id: 'TASK-803',
    title: 'A Incursão à Cidadela do Rei Demônio (Endgame do Campeão)',
    pillar: 'phase4_dungeon',
    priority: 'P2 - Média',
    status: 'backlog',
    versionTarget: 'v0.9.0',
    description: 'O campeão da Divisão Nobre da Coroa desbloqueia a autorização régia para a Incursão à Cidadela do Rei Demônio: mega-masmorra de 15 câmaras com condições climáticas extremas e contrato régio milionário.',
    acceptanceCriteria: [
      'Condição de vitória de campeonato desbloqueia evento da Cidadela no encerramento da temporada',
      'Mega-masmorra com 15 salas, 3 mini-bosses arautos e o Rei Demônio no ápice',
      'Recompensa de Certificado Imperial da Coroa, troféu perpétuo e premiação de fomento'
    ],
    estimatedPoints: 13
  },

  // EPIC: AJUSTES DE BALANCEAMENTO GERAL, REFATORAÇÃO AMBIENTAL E ATUALIZAÇÃO DO MOTOR DE LOGS
  {
    id: 'TASK-804',
    title: 'TO-DO 1: Atualização do Motor de Narração de Logs (Fase 4)',
    pillar: 'phase4_dungeon',
    priority: 'P0 - Crítica',
    status: 'done',
    versionTarget: 'v0.8.0',
    description: 'Substituir o gerador de texto genérico no fallback da simulação (Phase4Dungeon.tsx e match_engine.py) por matrizes dinâmicas de Fantasia Corporativa: Trânsito Livre (emptyLogs), Disputa Mini-boss Jogador/Rival, Boss Final (playerBossLogs e jointBossLogs), Falência Logística, Acidente de Trabalho e Espólios B2B Lendários.',
    acceptanceCriteria: [
      'Implementação de 4 variações de Trânsito Livre (emptyLogs)',
      'Matrizes de Mini-boss com +1 PE para Jogador e Rival',
      'Matrizes de Boss Final com +2 PE exclusivo ou +1 PE conjunto',
      'Eventos Críticos: Falência Logística (player/rival), Lesão/Morte (Acidente de Trabalho) e Espólios B2B Lendários'
    ],
    estimatedPoints: 5
  },
  {
    id: 'TASK-805',
    title: 'TO-DO 2: Balanceamento da Academia de Base (Fase 1)',
    pillar: 'phase1_hr',
    priority: 'P1 - Alta',
    status: 'backlog',
    versionTarget: 'v0.8.0',
    description: 'Revisão do ciclo da Academia de Base em balance_seed.json e academy_service.py para evitar inflação de poder e desacelerar a maturação de jovens talentos.',
    acceptanceCriteria: [
      'Tempo de Treinamento: Alterar em balance_seed.json a variável de maturação de aprendizes de 4 para 10 semanas',
      'Auditoria de Escalonamento de Força: Revisar gerador de atributos no academy_service.py',
      'Ajustar RNG base para respeitar nerf global das classes',
      'Garantir que os novatos saiam estritamente como Tier 1 (Nível 1)'
    ],
    estimatedPoints: 5
  },
  {
    id: 'TASK-806',
    title: 'TO-DO 3: Desacoplamento da Dupla Penalidade (Cenário vs. Clima)',
    pillar: 'phase4_dungeon',
    priority: 'P0 - Crítica',
    status: 'done',
    versionTarget: 'v0.8.0',
    description: 'Eliminação da dupla punição no match_engine.py. O Bioma (Terreno) torna-se o único vetor de impacto em PE e Consumo Extra de Suprimentos. O Clima passa a ser modificador de Drops de Espólios B2B (ex: chuva = +15% Provisões), com Catalisadores Climáticos amplificando o bônus de drop de 15% para 30%.',
    acceptanceCriteria: [
      'Modificadores de Bioma (Terreno) mantidos como único vetor de PE e dreno de rações',
      'Modificadores de Clima convertidos em bônus de drop de peças B2B em climates_seed.json',
      'Equipamentos de Proteção de Clima convertidos em Catalisadores Climáticos (amplificam drop de 15% para 30%)',
      'Interface Phase4Dungeon.tsx atualizada: card de Clima exibe "Tendência de Mercado/Drop" com categoria em alta'
    ],
    estimatedPoints: 8
  },
  {
    id: 'TASK-807',
    title: 'TO-DO 4: Implementação de Fatalidade Ocupacional (Permadeath Opcional)',
    pillar: 'phase1_hr',
    priority: 'P0 - Crítica',
    status: 'done',
    versionTarget: 'v0.8.0',
    description: 'Garantir que a "Morte Direta" exista no sistema como agravante de lesão. Quando um herói falha no RNG de Afastamento Médico, rola dado secundário para falecimento. Vanguardas com alta chance de lesão e ~0% de morte direta; Suporte Logístico com baixa chance de ser alvejado com Vanguarda viva, mas maior fatal_injury_chance do jogo.',
    acceptanceCriteria: [
      'Criação do atributo fatal_injury_chance em classes_seed.json / balance_seed.json',
      'Lógica do motor em match_engine.py / medical_service.py disparando dado secundário pós-lesão',
      'Transição de status de Afastado para Falecido/Dissolvido com notificação cartorária',
      'Balanceamento assimétrico por posição: Vanguarda tanque vs Suporte Logístico Glass Cannon'
    ],
    estimatedPoints: 8
  },
  {
    id: 'TASK-808',
    title: 'Validação Matemática dos Sistemas & Simulação Massiva de Curvas',
    pillar: 'phase4_dungeon',
    priority: 'P0 - Crítica',
    status: 'backlog',
    versionTarget: 'v0.8.0',
    description: 'Execução de sessão de simulação massiva (10.000+ partidas e 50+ temporadas) para auditar curvas matemáticas de economia, progressão de atletas, taxa de empates (0x0), frequência de lesões e distribuição de vitórias, identificando gargalos e desvios de balanceamento.',
    acceptanceCriteria: [
      'Script de simulação estocástica em lote para 10.000 partidas e 50 temporadas completas',
      'Auditoria de curvas de inflação de ouro no DRE e acúmulo de patrimônio',
      'Mapeamento de desvios padrão em taxas de vitória por arquétipo tático e bioma',
      'Relatório analítico com recomendações numéricas de balanceamento para os parâmetros de balance_seed.json'
    ],
    estimatedPoints: 8
  },
  {
    id: 'TASK-809',
    title: 'Redução da Cota Semanal de Partes no Balcão B2B (5 para 3)',
    pillar: 'phase2_workshop',
    priority: 'P1 - Alta',
    status: 'backlog',
    versionTarget: 'v0.8.0',
    description: 'Reduzir de 5 para 3 o limite de peças modulares disponíveis para aquisição imediata no mercado spot (weekly_spot_quota_per_part) em balance_seed.json e no serviço da Oficina, estimulando a manufatura interna e valorizando os contratos corporativos.',
    acceptanceCriteria: [
      'Ajuste da variável weekly_spot_quota_per_part de 5 para 3 em balance_seed.json',
      'Sincronização das regras de restrição no workshop_service.py e componentes de interface',
      'Validação de mensagens de esgotamento de lote ao atingir o teto de 3 unidades'
    ],
    estimatedPoints: 3
  },
  {
    id: 'TASK-810',
    title: 'Espólios de Itens Completos em Masmorras com Taxa Rara de Drop',
    pillar: 'phase4_dungeon',
    priority: 'P1 - Alta',
    status: 'backlog',
    versionTarget: 'v0.8.0',
    description: 'Permitir que as incursões a masmorras concedam itens manufaturados completos (armas, armaduras, joias, alvarás) em vez de exclusivamente peças modulares brutas, operando sob uma taxa estocástica reduzida (drop raro por câmara e mini-boss).',
    acceptanceCriteria: [
      'Extensão da lógica de _generate_dungeon_loot em phase_service.py para sortear itens completos equipáveis',
      'Calibração de taxa de drop raro (ex: 5% a 10% nas câmaras intermediárias e 25% no Boss Final)',
      'Registro formal no log de expedição e inserção direta no inventário da guilda'
    ],
    estimatedPoints: 5
  },
  {
    id: 'TASK-811',
    title: 'Implementação de Drenos Financeiros Temáticos (Money Sinks)',
    pillar: 'phase5_results',
    priority: 'P1 - Alta',
    status: 'backlog',
    versionTarget: 'v0.8.0',
    description: 'Adição de drenos financeiros estratégicos coerentes com o lore corporativo para conter a superinflação de ouro da guilda: emolumentos de averbação cartorária, apólices de seguro corporativo de risco, taxas de manutenção de estande da oficina e banquetes de moral e integração da equipe.',
    acceptanceCriteria: [
      'Taxas de Averbação Cartorial na contratação e rescisão de atletas',
      'Apólice Preventiva de Seguro de Incursão (atenua custo de reabilitação e indenizações)',
      'Custos de Manutenção e Modernização Periódica dos 4 ramos da Oficina',
      'Banquete de Confraternização Corporativa na Fase 1 (recupera moral e reduz fadiga por ouro)',
      'Discriminação exata de todas as novas rubricas na DRE da Fase 5'
    ],
    estimatedPoints: 8
  },
  {
    id: 'TASK-812',
    title: 'Suíte de Otimizações de UX/UI & Ergonomia de Fluxo de Fases',
    pillar: 'phase3_tactics',
    priority: 'P1 - Alta',
    status: 'backlog',
    versionTarget: 'v0.8.0',
    description: 'Refinamento geral da interface do usuário em todo o ciclo de 5 fases: badges de status mais legíveis, transições táteis entre rodadas, tooltips com impacto numérico explícito em cada decisão, filtros rápidos no inventário e melhoria na densidade de informação.',
    acceptanceCriteria: [
      'Melhoria na ergonomia visual da transição entre Fases I a V com feedback de ação pendente',
      'Tooltips explicativos em todos os atributos e bônus de peças/itens',
      'Filtros rápidos por posição e aptidão física na tela de escalação tática (Fase 3)',
      'Indicadores visuais claros para estados críticos (fadiga alta, alvará ausente, risco de falência)',
      'Responsividade refinada para painéis compactos e telas widescreen'
    ],
    estimatedPoints: 5
  },

  // ENTREGAS CONCLUÍDAS NA v0.7.1
  {
    id: 'TASK-710',
    title: 'Sincronização 100% de Placar Visual e Tabela (score_t1/score_t2)',
    pillar: 'phase4_dungeon',
    priority: 'P0 - Crítica',
    status: 'done',
    versionTarget: 'v0.7.1',
    description: 'Registro e leitura direta dos inteiros de placar emitidos pelo match_engine.py, eliminando discrepâncias entre Fase 4 e Fase 5.',
    acceptanceCriteria: ['Testes de contrato e sincronização aprovados (100% OK)'],
    estimatedPoints: 5
  },
  {
    id: 'TASK-711',
    title: 'DRE Dinâmico em Tempo Real com Reconciliação Contábil',
    pillar: 'phase5_results',
    priority: 'P0 - Crítica',
    status: 'done',
    versionTarget: 'v0.7.1',
    description: 'Apuração no encerramento da Fase 4 com discriminação exata de despesas e sem duplicação de caixa.',
    acceptanceCriteria: ['Reconciliação validada em balance_audit_v070_b2b.py'],
    estimatedPoints: 5
  },
  {
    id: 'TASK-712',
    title: 'Expansão de Fornecedoras B2B (corp_mercurius & corp_crown_rations)',
    pillar: 'phase2_workshop',
    priority: 'P1 - Alta',
    status: 'done',
    versionTarget: 'v0.7.1',
    description: 'Inclusão de parceiras de Alvarás de Risco e Provisões Logísticas, expandindo para 107 peças e 33 convênios.',
    acceptanceCriteria: ['107 peças e 33 convênios integrados nas seeds'],
    estimatedPoints: 8
  }
];
