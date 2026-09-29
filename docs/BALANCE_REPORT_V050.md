# ⚖️ HeroFoot — Relatório de Auditoria de Balanceamento Econômico v0.5.0

> **Classificação:** Auditoria Quantitativa, Simulação em Massa & Análise de Solvência  
> **Versão Base:** v0.5.0-dev  
> **Autoridade:** QA & Balance Engineering (`balance_agent`)  
> **Data:** Setembro de 2026  
> **Conformidade:** [CONTRACT.md](file:///c:/Users/Rafael/Documents/herofoot/docs/CONTRACT.md) & [DESIGN_SPEC_V050.md](file:///c:/Users/Rafael/Documents/herofoot/docs/DESIGN_SPEC_V050.md)  

---

## 1. Visão Geral da Simulação

Para validar a integridade econômica da v0.5.0 e a transição para o novo modelo de progressão por XP de bancada e forja, foram simuladas 3 estratégias de gestão patrimonial ao longo de 50 rodadas (semanas) completas sob a mesma semente mundial determinística (`world_seed = 42`).

### Metodologia de Teste (`scripts/balance_audit_v050.py`)
- **Estratégia A (Casual):** Produção controlada de 1 a 2 itens forjados por semana, com venda no balcão a Preço Justo (1.0x).
- **Estratégia B (Intensiva):** Produção acelerada de 4 itens semanais priorizando a demanda do Boletim da Câmara, visando rápida evolução de bancada.
- **Estratégia C (Sem Forja):** Gestão passiva dependente exclusivamente da verba fixa de expedição (⬡ 250/sem) sem atividades manufatureiras.

---

## 2. Comparativo de Desempenho (50 Semanas)

| Métrica Contábil / Esportiva | Estratégia A (Casual) | Estratégia B (Intensiva) | Estratégia C (Sem Forja) | Benchmark Alvo |
| :--- | :---: | :---: | :---: | :---: |
| **Ouro Final** | **⬡ 3.763** | **⬡ 3.660** | **⬡ -7.950** (Falência) | Solvente (> ⬡ 0) |
| **Ouro Mínimo na Trajetória** | ⬡ 891 | ⬡ 1.000 | ⬡ -7.715 | Sem insolvência |
| **Semanas com Saldo Negativo** | **0 semanas (0%)** | **0 semanas (0%)** | **45 semanas (90%)** | 0 semanas |
| **Risco de Falência (Saldo < ⬡ 200)** | **0%** | **0%** | **92%** | < 10% |
| **Pontos de Expedição na Liga** | 83 PE | 83 PE | 78 PE | Competitivo |
| **Auditorias da Coroa (Aprovadas / Reprovadas)** | 6 / 0 | 6 / 0 | 5 / 1 | ≥ 80% aprovação |
| **Receita Média por Item Comercializado** | ⬡ 360,20 | ⬡ 234,80 | ⬡ 0,00 | > Custo de insumos |
| **Lucro Líquido Semanal Médio** | **+⬡ 55,30** | **+⬡ 53,20** | **-⬡ 179,00** | Positivo |
| **Semana de Alcance do Nível 3 de Bancada** | **Semana 8** | **Semana 6** | Não Alcançado | 8 a 12 semanas |
| **Tempo de Breakeven Consistente** | Semana 13 | Semana 2 | Inviável | < 15 semanas |

---

## 3. Diagnóstico Técnico de Equilíbrio

1. **A Forja é o Coração Solvente da Guilda:**
   - Como comprovado pela Estratégia C, depender unicamente das cotas de expedição (⬡ 250) com uma folha salarial de ~⬡ 300 e manutenção predial de ~⬡ 110 gera um déficit semanal constante de ~⬡ 160 a ⬡ 180, conduzindo inevitavelmente à insolvência.
   - Isso valida a fantasia de **Tycoon Medieval**: a guilda não sobrevive como um clube romântico de heróis; ela prospera como um entreposto comercial e bélico.

2. **Ritmo de Progressão do Nível 3 de Bancada:**
   - A meta estipulada em roadmap era atingir o Nível 3 entre 8 e 12 semanas.
   - A Estratégia Casual atingiu precisamente na **Semana 8**, e a Intensiva na **Semana 6**.
   - Isso demonstra que os custos de upgrade (`500` para Nível 2 e `1.000` para Nível 3) e o consumo de insumos estão calibrados harmonicamente com a liquidez do jogador.

3. **Margens e Absorção de Custos:**
   - Mesmo reinvestindo ouro em upgrades de bancada e taxas de anúncio, a guilda manteve reserva de segurança superior a ⬡ 890 em todas as rodadas em ambas as estratégias ativas.
   - Nenhuma penalidade de auditoria foi aplicada nas estratégias A e B, conservando a Confiança da Contratante em patamar de prestígio.

---

## 4. Recomendações para a Implementação de Código (v0.5.0)

1. **Injeção de XP na Forja:**
   - Integrar `xp_to_next_level` e `xp_per_craft` nos métodos `craft_item()` em `services/crafting_service.py` consumindo os valores de `workshops_seed.json["xp_progression"]`.
2. **Homologação Permanente em Tinkering:**
   - Quando o artesão falha na forja experimental, homologar a receita no estado `known_recipes` para preservar o valor do insumo investido.
3. **Consistência do Boletim:**
   - Manter a sinergia entre o slot em alta do Boletim e os bônus de XP de receitas afins.
