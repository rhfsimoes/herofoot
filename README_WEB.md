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
3. O jogo estará 100% funcional com navegação entre as 5 fases:
   - **Dashboard**: Visão geral da semana, caixa em moedas de ouro e atalhos rápidos.
   - **Fase I (RH & Cura)**: Acompanhe os atestados médicos, níveis de fadiga e autorize os encaminhamentos.
   - **Fase II (Oficina & Balcão)**: Forje itens combinando insumos e qualidades (Fraco, Normal, Ótimo, Lendário) e faça vendas no balcão recebendo contrapropostas interativas.
   - **Fase III (Escalação)**: Selecione os 5 titulares e equipe os 5 Slots de Expedição (Arma, Armadura, Joia, Inscrição, Consumível).
   - **Fase IV (Expedição)**: Simule a exploração das câmaras da Dungeon em tempo real com barra animada de Suprimentos.
   - **Fase V (Resultados)**: Balanço financeiro com receitas, folha de pagamento e atualização da Tabela da Liga.

---

### Opção 2: Conectar ao Backend Python Local

Se quiser que os dados venham diretamente da lógica do `controller.py` e `match_engine.py`:

1. No terminal raiz do projeto (`herofoot`):
   ```bash
   python server.py
   ```
2. Em outro terminal, na pasta `frontend`:
   ```bash
   npm run dev
   ```
3. O frontend se comunica via REST API em `http://localhost:8000/api/state`.

---

### Próximos Passos:
- Integração da camada **Tauri** para empacotar este mesmo frontend em um executável nativo leve (.exe para Windows).
