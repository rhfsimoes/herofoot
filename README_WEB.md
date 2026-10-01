# HeroFoot — Como Testar a Interface Web (React)

Para testar o HeroFoot no navegador com interface visual moderna, botões interativos e tema medieval corporativo:

---

### Opção 1: Rodar o Frontend com Vite (Recomendado para Testes Visuais Imediatos)

1. Abra um terminal na pasta `frontend`:
   ```bash
   cd frontend
   npm run dev
   ```
2. Abra seu navegador em:
   ```
   http://localhost:5173
   ```
3. O jogo estará 100% funcional com navegação entre as 5 fases operacionais:
   - **Dashboard**: Visão geral da semana, caixa da guilda em moedas de ouro, status do elenco e atalhos rápidos.
   - **Fase I (RH & Saúde)**: Acompanhe atestados médicos, níveis de fadiga, gerencie a Academia de Base e contrate reforços no Mercado de Transferências.
   - **Fase II (Complexo B2B & Oficina)**: Celebre convênios corporativos (Bronze, Prata e Ouro), opere a Linha de Montagem automatizada com operários assalariados, monte artefatos modulares com nomes concisos de 1-2 palavras e compre componentes no Mercado Spot respeitando cotas e tarifas.
   - **Fase III (Escalação Tática)**: Selecione os 6 titulares da incursão, ative o botão de escalação rápida dos melhores aptos e equipe os 5 slots de carga (`Arsenal Ofensivo`, `Blindagem Operacional`, `Dispositivo Tático`, `Alvará de Risco`, `Provisão Logística`) para mitigar biomas e climas adversos.
   - **Fase IV (Expedição em Masmorra)**: Acompanhe a marcha câmara a câmara com telemetria e pontuação em tempo real sincronizadas estritamente com a simulação da engine.
   - **Fase V (Resultados & DRE)**: Balanço financeiro dinâmico e em tempo real apurado no fechamento da expedição, demonstrativo de receitas e obrigações fixas, tabela atualizada das divisões e condições de falência ou avanço de temporada.

---

### Opção 2: Conectar ao Backend Python Local

Para que todas as ações e transações sejam salvas e validadas pela regra de negócio canônica do backend:

1. No terminal raiz do projeto (`herofoot`):
   ```bash
   python server.py
   ```
2. Em outro terminal, na pasta `frontend`:
   ```bash
   npm run dev
   ```
3. O frontend se comunica via REST API em `http://localhost:8000/api`.

---

### Suíte de Testes & Verificação de Integridade
Para executar a bateria de validações automatizadas:
```bash
python -m unittest discover tests
# 223 testes unitários aprovados com 100% de sucesso
```
E para validação de compilação TypeScript no frontend:
```bash
cd frontend
npm run build
# Compilação limpa com 0 erros de tipagem
```
