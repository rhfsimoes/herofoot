# Game Design Spec - v0.5.0

## 1. XP de Forja e Progressão de Bancada

A progressão das bancadas de forja (Ferragem, Alquimia, Joalheria, Culinária) é um elemento central para garantir que o jogador sinta uma curva de aprendizado corporativo sem resvalar no *grinding* excessivo. 

### Tabela de Progressão de Nível e Custo de Modernização

A fórmula de XP para o próximo nível segue o padrão logístico de expansão comercial: $XP_{req} = 100 \times 1.5^{nível-1}$.
Os custos de modernização sobem exponencialmente para refletir o custo das aprovações da Guilda dos Artesãos.

| Nível Atual | XP para Próximo Nível | Custo de Modernização (Ouro) |
| :---: | :---: | :---: |
| 1 | 100 | - |
| 2 | 150 | 500 |
| 3 | 225 | 1000 |
| 4 | 338 | 2000 |
| 5 | 506 | 4000 |
| 6 | Mestre (N/A) | 8000 |

### XP por Item Forjado

| Tier da Receita | XP Recebida | Justificativa de Design |
| :--- | :--- | :--- |
| Tier 1 | 10 XP | Representa a prática diária. Subir para o Nível 2 exige 10 criações, factível nas primeiras 4 semanas. |
| Tier 2 | 25 XP | Risco maior (Tinkering ou receitas médias). Recompensa moderada para evitar estagnação no mid-game. |
| Tier 3 | 60 XP | Projetos de engenharia arcana. Acelera os níveis finais (4→6) para manter a cadência no endgame corporativo. |

### Balanceamento de Insumos

Para garantir que o Nível 3 da bancada seja atingido num prazo razoável (8 a 12 semanas) por jogadores que adotem uma postura de forja ativa, propõe-se a seguinte tabela-alvo de insumos (que será integrada na base de receitas em um patch futuro):

| Tier da Receita | Preço Base Atual | Preço de Insumo Proposto (Novo Padrão) |
| :--- | :--- | :--- |
| Tier 1 | ~120 - 250 Ouro | 30 - 60 Ouro |
| Tier 2 | Não existe | 150 - 250 Ouro |
| Tier 3 | Não existe | 400 - 800 Ouro |

Isso cria margem para produção em volume de Tiers baixos no início, sustentando o acúmulo de XP sem falir a Guilda.

---

## 2. Tinkering — Forja Experimental

A inovação exige riscos. O sistema de Tinkering permite que artesãos da guilda tentem confeccionar projetos acima de seu nível de homologação.

**Fórmula de Sucesso:**
`success_chance = max(0.05, 1 - (recipe_tier - workshop_level) * 0.35)`

### Cenários de Tinkering

| Nível Bancada | Tentando Tier | Chance Sucesso | Efeito na Falha | Efeito no Sucesso |
| :---: | :---: | :---: | :--- | :--- |
| 1 | 2 | 65% | Gororoba + 5 XP + Receita homologada | Item Normal + XP 1.5x |
| 1 | 3 | 30% | Gororoba + 5 XP + Receita homologada | Item Normal + XP 1.5x |
| 2 | 3 | 65% | Gororoba + 5 XP + Receita homologada | Item Normal + XP 1.5x |

**Penalidades e Ganhos:**
- Falha na manufatura resulta no produto "Gororoba Experimental", passível de descarte ou venda cômica no balcão por irrisórios 20 Ouro.
- O bônus corporativo: Mesmo que falhe, a receita fica homologada no catálogo da guilda para produção futura (assim que os níveis permitirem segurança).
- Sucesso concede o item com as qualidades normais dos pesos da bancada no momento e oferece 1.5x do XP nominal.

---

## 3. Eventos Corporativos — Revisão de Impacto

Os eventos que compõem o tecido institucional da rotina de administração heroica foram revistos para manter dilemas contundentes.
Foram ajustados valores em eventos menores (ex: _evt_counter_customer_complaint_, onde a opção de compensação que era irrisória subiu para patamar palpável).

### Novos Eventos Inseridos

1. **Desvio de Verba no Fundo de Pensão Clerical (`evt_clerical_pension_fraud`)**
   - *Fase:* `phase_5`
   - *Dilema:* O cofre descobre um furo causado por consultorias esotéricas. Assumir o prejuízo, repassar aos heróis, ou usar advogados sujos para maquiar o déficit.

2. **Crise de Relações Públicas do Paladino Caído (`evt_fallen_paladin_pr_crisis`)**
   - *Fase:* `weekly_start`
   - *Dilema:* Um dos paladinos patrocinados da guilda foi flagrado apostando ouro em rinhas de goblins.

3. **Gargalo Logístico na Forja de Inverno (`evt_winter_forge_bottleneck`)**
   - *Fase:* `phase_3`
   - *Dilema:* As nevascas atrasaram o carvão, e a oficina vai parar. Pagar um absurdo aos contrabandistas ou obrigar os ferreiros a trabalharem a frio (com sérios prejuízos morais e de fadiga).

Estas mudanças inserem um peso maior nas decisões administrativas semanais e alinham-se ao tom de burocracia opressiva.
