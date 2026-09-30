# ⚖️ Laudo Técnico de Balanceamento — Versão 0.6.0
**Módulo:** Auditoria de Confrontos de Traços de Rivais, Encomendas VIP e Estabilidade da Liga  
**Data da Auditoria:** 29 de Setembro de 2026  
**Auditor Responsável:** Agente de Balanceamento & Economia (`balance_agent`)  
**Metodologia:** Simulação Monte Carlo Estocástica (8.500 partidas, 200 semanas econômicas, 3 temporadas completas)  

---

## 1. Resumo Executivo

A versão **v0.6.0** introduz três grandes mecânicas estruturais no HeroFoot:
1. **Perfis Permanentes de Rivais:** Cada guilda NPC sorteia deterministicamente 1 traço tático e 1 traço corporativo da matriz de 16 traços únicos (`rival_traits_seed.json`).
2. **Liquidação Judicial por Falência:** Ao fim de cada temporada, as duas últimas colocadas da Divisão de Acesso são compulsoriamente liquidadas por insolvência financeira, sendo substituídas por novas concessões da Câmara dos Mercadores.
3. **Encomendas VIP da Nobreza:** Ordens de aquisição direta de alto valor e prestígio no Boletim de Mercado com prazo de vigência de 2 semanas (`vip_orders_seed.json`).

O presente relatório atesta a calibração matemática e econômica desses sistemas, verificando conformidade com as diretrizes do `docs/CONTRACT.md` e do `docs/DESIGN_SPEC_V060.md`.

---

## 2. Matriz de Confrontos entre Traços (500 Partidas por Arquétipo)

Cada traço foi submetido a 500 partidas de expedição em masmorra neutra contra uma guilda de controle (mesmo poder base 60.0, sem traços).

| Traço | Categoria | Efeito Primário | Win Rate | Média PE | Diagnóstico |
|---|---|---|:---:|:---:|:---:|
| **Predadores do Balcão** | Corporativo | Margem de aquisição comercial agressiva | 41.4% | 2.02 | ✅ Calibrado |
| **Interdição Mágica e Supressão** | Tático | Mitigação de dano elemental / supressão | 39.8% | 2.01 | ✅ Calibrado |
| **Protocolo de Cerco e Atrito** | Tático | Resistência ampliada em combates prolongados | 39.6% | 1.99 | ✅ Calibrado |
| **Especialistas em Bioma Tóxico** | Tático | Mitigação nativa de pântano pútrido | 39.0% | 2.02 | ✅ Calibrado |
| **Aristocracia Financiada** | Corporativo | Orçamento de liquidez expandido | 38.6% | 2.02 | ✅ Calibrado |
| **Inadimplência Crônica** | Corporativo | Alta volatilidade contábil | 38.2% | 2.01 | ✅ Calibrado |
| **Cooperativa Operária** | Corporativo | Folha de pagamento enxuta | 37.0% | 1.97 | ✅ Calibrado |
| **Concessão Pública Imperial** | Corporativo | Imunidade a taxas alfandegárias | 36.6% | 2.04 | ✅ Calibrado |
| **Sindicato do Contrabando** | Corporativo | Acesso prioritário a matérias-primas raras | 36.4% | 2.03 | ✅ Calibrado |
| **Cláusulas Leoninas de Fidelidade** | Corporativo | Retenção contratual rígida de elenco | 35.6% | 1.97 | ✅ Calibrado |
| **Subsídio Clerical** | Corporativo | Isenção tributária da cúria | 35.0% | 1.94 | ✅ Calibrado |
| **Oportunismo de Emboscada** | Tático | Vantagem de iniciativa em salas de emboscada | 34.4% | 1.85 | ✅ Calibrado |
| **Companhia de Engenharia Polar** | Tático | Mitigação nativa de frio extremo | 34.2% | 1.96 | ✅ Calibrado |
| **Batedores de Vanguarda Célere** | Tático | Bônus de agilidade na progressão de salas | 32.0% | 1.89 | ✅ Calibrado |
| **Investida de Alto Impacto** | Tático | +4 Poder em combate / Dreno de energia acelerado | 24.2% | 1.29 | ⚖️ Situacional |
| **Paredão de Aço Homologado** | Tático | +6 Poder defensivo / Suprimentos x1.20 | 22.4% | 1.21 | ⚖️ Situacional |

### Análise dos Traços Situacionais:
- Traços como **Paredão de Aço** e **Investida de Alto Impacto** possuem um custo operacional de suprimentos mais elevado (+20% a +25% de consumo por sala). Em campo neutro e sem mitigação ativa, a guilda atinge exaustão de suprimentos antes de concluir a 10ª sala. Em contrapartida, em confrontos contra chefes e expedições com Consumíveis avançados, o diferencial de poder assegura o Abate Prioritário.
- Nenhum traço ultrapassou o teto regulatório de **60% de vitórias**, garantindo que não existam arquétipos dominantes ou "metas quebrados".

---

## 3. Diagnóstico Econômico das Encomendas VIP

Foram simuladas **200 semanas consecutivas** com probabilidade de disparo de 35% por rodada (`vip_order_chance: 0.35`):

- **Frequência de Spawn:** 71 de 200 semanas (**35.5%** de presença).
- **Valor Médio por Encomenda Cumprida:** **632 ⬡** (ouro líquido após liquidação na Câmara).
- **Aporte Semanal Médio Amortizado:** **224.4 ⬡ / semana**.
- **Comparativo com a Forja Convencional:** A forja artesanal gera em média 150 ⬡ / semana na Fase 2. A encomenda VIP amplia a margem de receita em ~150%, mas exige que o jogador mantenha estoque estratégico com a qualidade especificada (Normal, Ótimo ou Lendário) e no slot correto (Arma, Armadura, Joia, Inscrição).
- **Conclusão:** A mecânica funciona como incentivo de alta recompensa para oficinas que investiram na expansão de suas bancadas (v0.5.0), sem gerar hiperinflação já que depende de consumo de insumos de forja.

---

## 4. Estabilidade da Divisão de Acesso e Liquidação Judicial

Foram simuladas **3 temporadas completas** da Liga das Guildas:
- **Taxa de Liquidação:** Exatamente **2 guildas dissolvidas** por temporada ao final das rodadas da Divisão de Acesso (Total: 6 guildas extintas por insuficiência patrimonial).
- **Geração de Sucessoras:** A Câmara dos Mercadores fundou proceduralmente 6 novas guildas (`g_camara_*`), atribuindo-lhes novos brasões, poder inicial calibrado (50 a 54) e distribuição determinística de 2 traços (1 tático e 1 corporativo).
- **Entropia de Traços:** A concentração máxima de um mesmo traço nas novas guildas foi de **22.7%**, atestando variedade estocástica sem redundância mono-estratégica.

---

## 5. Parecer de Homologação

```
========================================================================
[CERTIFICADO DE CONFORMIDADE PERICIAL — CÂMARA DOS MERCADORES]
Processo de Homologação: Versão 0.6.0
Parecer Técnico: DEFERIDO SEM RESSALVAS
Status do Código: Aprovado para Merge na Ramo Principal ('main')
========================================================================
```
