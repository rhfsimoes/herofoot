import time
import random
import os

def clear_screen():
    os.system('cls' if os.name == 'nt' else 'clear')

def print_header(title):
    print("=" * 70)
    print(f"{title.center(70)}")
    print("=" * 70)

class HeroFootUI:
    def __init__(self, game_state=None):
        self.game_state = game_state

    def main_menu(self):
        while True:
            clear_screen()
            print_header("HEROFOOT — GESTÃO CORPORATIVA DE GUILDAS")
            print("1. Iniciar Ciclo Semanal (Loop de 5 Fases)")
            print("2. Consultar Boletins Pendentes")
            print("3. Encerrar Expediente")
            choice = input("\nSelecione uma diretriz: ")

            if choice == '1':
                self.run_loop()
            elif choice == '2':
                self.trigger_news()
            elif choice == '3':
                print("Expediente encerrado. Que os deuses da contabilidade sejam gratos.")
                break

    def run_loop(self):
        self.phase_1_team_care()
        self.phase_2_market()
        self.phase_3_tactics()
        self.phase_4_dungeon()
        self.phase_5_results()

    def phase_1_team_care(self):
        clear_screen()
        print_header("FASE 1 — SAÚDE, FADIGA E PROMOÇÕES INTERNAS")
        print("Processando ocorrências da semana anterior...\n")
        print("  [ ] Atestado médico — Queimadura de Dragão (Grau II): Thorian, Guerreiro.")
        print("  [ ] Pedido de adicional de insalubridade — Contato com Veneno de Aranha Colossal.")
        print("  [ ] Relatório de fadiga — Redução de carga após expedição de alta intensidade.")
        print("  [ ] Promoção interna — Aprendiz Reva avançada a Aventureira Júnior (Nível 2).")
        input("\nAssinar encaminhamentos e aprovar relatórios? (ENTER para confirmar)")

    def phase_2_market(self):
        while True:
            clear_screen()
            print_header("FASE 2 — OFICINA, MERCADO E BALCÃO DE VENDAS")
            print("Painel de Operações da Semana:\n")
            print("  1. Produzir item na Oficina (Craft Interno)")
            print("  2. Adquirir insumos no Mercado — [Rota temporariamente interditada]")
            print("  3. Liquidar ativo no Balcão de Vendas")
            print("  4. Encerrar operações e prosseguir")

            choice = input("\nInforme o procedimento: ")

            if choice == '1':
                self.crafting_menu()
            elif choice == '3':
                self.liquidation_menu()
            elif choice == '4':
                print("\nBalancete semanal gerado. Seguindo para a Fase de Tática.")
                time.sleep(1)
                break
            else:
                print("\nProcedimento não reconhecido. Consulte o manual operacional.")
                time.sleep(1.5)

    def liquidation_menu(self):
        clear_screen()
        print_header("BALCÃO DE VENDAS — LIQUIDAÇÃO DE ATIVOS")
        print("Consultando itens disponíveis para venda...\n")

        itens_para_vender = []
        if hasattr(self, 'game_state') and self.game_state is not None and hasattr(self.game_state, 'inventory'):
            itens_para_vender = self.game_state.inventory

        if not itens_para_vender:
            # Mocks no nível 7: itens medievais com terminologia contábil
            itens_para_vender = [
                "Adaga de Aço Carbônico (Ativo — Slot Arma)",
                "Poção de Cura Menor (Ativo — Slot Consumível)"
            ]

        for idx, item in enumerate(itens_para_vender, 1):
            print(f"  {idx}. {item}")
        print("  0. Cancelar e retornar")

        choice = input("\nSelecione o ativo para liquidar: ")
        if choice == '0':
            return

        try:
            choice_idx = int(choice) - 1
            if 0 <= choice_idx < len(itens_para_vender):
                item_escolhido = itens_para_vender[choice_idx]
                print(f"\nRegistrando '{item_escolhido}' no Balcão de Negócios...")
                time.sleep(1)

                status_venda = random.choice(['vendido', 'contraproposta'])
                valor_oferecido = random.randint(15, 100)

                if hasattr(self, 'game_state') and self.game_state is not None:
                    if hasattr(self.game_state, 'controller') and hasattr(self.game_state.controller, 'sell_item'):
                        resultado = self.game_state.controller.sell_item(item_escolhido)
                        status_venda = resultado.get('status', 'vendido')
                        valor_oferecido = resultado.get('valor', valor_oferecido)

                if status_venda == 'contraproposta':
                    print("\n[ALERTA DE NEGOCIAÇÃO]")
                    print("O comprador considerou o valor acima da tabela de referência do mercado.")
                    print(f"Proposta recebida: {valor_oferecido} Moedas de Ouro.")
                    aceite = input("Aceitar proposta e finalizar contrato? (s/n): ").strip().lower()

                    if aceite == 's':
                        print("\nContrato selado. Transação registrada no livro-caixa.")
                        print(f"+{valor_oferecido} Moedas de Ouro creditadas.")
                        if hasattr(self, 'game_state') and self.game_state is not None:
                            if hasattr(self.game_state, 'controller') and hasattr(self.game_state.controller, 'confirm_sale'):
                                self.game_state.controller.confirm_sale(item_escolhido, valor_oferecido)
                    else:
                        print("\nNegociação encerrada. Ativo retorna ao inventário até nova oportunidade.")
                else:
                    print("\nVenda concluída a preço de tabela.")
                    print(f"+{valor_oferecido} Moedas de Ouro creditadas.")
            else:
                print("\nSeleção inválida. Nenhuma ação registrada.")
        except ValueError:
            print("\nEntrada inválida. Utilize apenas numerais.")

        input("\nPressione ENTER para retornar ao painel...")

    def crafting_menu(self):
        clear_screen()
        print_header("OFICINA — ORDENS DE PRODUÇÃO")
        print("Receitas disponíveis para fabricação:\n")

        receitas = [
            "Espada Longa de Aço (Slot: Arma)",
            "Cota de Malha Reforçada (Slot: Armadura)",
            "Amuleto de Guarda-Alma (Slot: Joia)"
        ]
        if hasattr(self.game_state, 'available_recipes'):
            receitas = self.game_state.available_recipes

        for idx, receita in enumerate(receitas, 1):
            print(f"  {idx}. {receita}")
        print("  0. Cancelar e retornar")

        choice = input("\nAutorizar produção (número): ")

        if choice == '0':
            return

        try:
            choice_idx = int(choice) - 1
            if 0 <= choice_idx < len(receitas):
                receita_escolhida = receitas[choice_idx]
                print("\nOrdem de produção enviada à Oficina. Processando...")
                time.sleep(1)

                item = None
                if hasattr(self, 'game_state') and self.game_state is not None:
                    if hasattr(self.game_state, 'controller') and hasattr(self.game_state.controller, 'craft_item'):
                        item = self.game_state.controller.craft_item(receita_escolhida)
                    elif hasattr(self.game_state, 'craft_item'):
                        item = self.game_state.craft_item(receita_escolhida)

                if item is None:
                    qualidades = ["Fraco", "Normal", "Ótimo", "Lendário"]
                    item = {
                        "name": receita_escolhida.split("(")[0].strip(),
                        "quality": random.choice(qualidades)
                    }

                qualidade_labels = {
                    "Fraco":    "Fraco    — Abaixo do padrão mínimo. Sujeito a retrabalho.",
                    "Normal":   "Normal   — Dentro da especificação. Aprovado para uso.",
                    "Ótimo":    "Ótimo    — Acima da especificação. Alta margem de revenda.",
                    "Lendário": "Lendário — Peça excepcional. Registro no Livro de Patentes recomendado."
                }
                qualidade_str = qualidades_labels = qualidade_labels.get(
                    item.get('quality'), item.get('quality')
                )

                print("\n>> LAUDO DE INSPEÇÃO DE QUALIDADE <<")
                print(f"  Item Produzido : {item.get('name')}")
                print(f"  Classificação  : {qualidade_str}")
                print("\nItem registrado e adicionado ao inventário da guilda.")
            else:
                print("\nOrdem inválida. Nenhuma produção iniciada.")
        except ValueError:
            print("\nEntrada inválida. Utilize apenas numerais.")

        input("\nPressione ENTER para arquivar o laudo...")

    def phase_3_tactics(self):
        clear_screen()
        print_header("FASE 3 — ESCALAÇÃO E PREPARAÇÃO DA EXPEDIÇÃO")
        print("Designando os membros da força-tarefa para a expedição desta semana...\n")
        print("  Titulares escalados: 5 aventureiros confirmados.")
        print("  Reservas designadas: 1 aventureiro em standby.\n")
        print("Verificando os 5 Slots de Equipamento da Expedição (EPIs obrigatórios):")
        print("  [Slot 1 — Arma      ] Espada Longa de Aço             | Status: Equipado")
        print("  [Slot 2 — Armadura  ] Cota de Malha Reforçada         | Status: Equipado")
        print("  [Slot 3 — Joia      ] Amuleto de Guarda-Alma          | Status: Equipado")
        print("  [Slot 4 — Inscrição ] Runa de Contenção de Sangramento | Status: Equipado")
        print("  [Slot 5 — Consumível] Ração de Campanha (3 dias)      | Status: Equipado")
        input("\nAssinar memorando de escalação e autorizar despacho da equipe? (ENTER)")

    def phase_4_dungeon(self):
        clear_screen()
        print_header("FASE 4 — EXECUÇÃO DA EXPEDIÇÃO")
        print("Acompanhamento em tempo real — Relatório de Ocorrências:\n")

        energy = 100
        sala_labels = [
            "Corredor de Entrada",
            "Câmara de Guarda",
            "Depósito Infestado",
            "Santuário Profanado",
            "Câmara do Chefe"
        ]
        events = [
            "Combate concluído. Orc Bárbaro neutralizado (+1 Abate registrado).",
            "Emboscada Goblin registrada como Desvio de Rota. Equipe reagiu sem baixas.",
            "Herói Valdris sofreu lesão perfurocortante. Relatório de acidente a ser preenchido.",
            "Baú de espólio selado localizado e assegurado pela equipe de reconhecimento.",
            "Queda de Suprimentos abaixo do limiar operacional. Equipe manteve posição.",
        ]

        for i, sala in enumerate(sala_labels):
            print(f"  [{sala}]")
            energy -= random.randint(10, 20)
            energy = max(0, energy)
            filled = energy // 10
            bar = '█' * filled + '░' * (10 - filled)
            print(f"  Suprimentos: [{bar}] {energy}%")
            print(f"  >> {events[i]}\n")
            time.sleep(1.5)

        print("Expedição concluída. Equipe retornou à sede da guilda.")
        input("\nPressione ENTER para registrar os resultados e encerrar a expedição...")

    def phase_5_results(self):
        clear_screen()
        print_header("FASE 5 — RESULTADOS E BALANÇO SEMANAL")
        print("Consolidando dados para a Tabela da Liga das Guildas...\n")
        print("  Pontos de Expedição (PE) conquistados esta semana : 3")
        print("  Posição atual na Liga                             : 4º lugar\n")

        print("Distribuição de Espólio (Loot):")
        print("  - 500 Moedas de Ouro")
        print("  - 3x Fragmentos de Mana Cristalizado")
        print("  - 1x Pergaminho de Receita Rara (Alquimia)\n")

        print("Balanço Financeiro — Semana:")
        print("  Receita bruta (Expedição + Vendas) :  500 Ouro")
        print("  Folha de salários (5 aventureiros) : -300 Ouro")
        print("  Manutenção e reparos da sede       :  -50 Ouro")
        print("  ─────────────────────────────────────────────")
        print("  Saldo líquido da semana            : +150 Ouro")
        input("\nPressione ENTER para arquivar o relatório e iniciar o próximo ciclo...")

    def trigger_news(self):
        clear_screen()
        print_header("BOLETIM CORPORATIVO — AVISO URGENTE")
        news = random.choice([
            (
                "SURTO DE DOENÇA CONFIRMADO\n"
                "A 'Febre dos Pântanos do Norte' atingiu 3 membros da guilda.\n"
                "Recomenda-se revisão do plano de saúde e dos EPIs para expedições em regiões alagadas."
            ),
            (
                "ALERTA CLIMÁTICO — DUNGEON DO PICO GLACIAL\n"
                "Temperatura interna da Dungeon caiu 40%. Expedições sem Cota Térmica\n"
                "sofrerão penalidade de -20% nos Suprimentos iniciais."
            ),
            (
                "BOLETIM DE MERCADO — ESPECULAÇÃO DE INSUMOS\n"
                "Ruptura na rota de abastecimento do Vale de Cedro elevou o preço de\n"
                "Poções de Cura em 30%. Itens de Alquimia com alta valorização esta semana."
            ),
            (
                "AVISO REAL — CONVOCAÇÃO ESPECIAL\n"
                "O Conselho das Guildas solicita participação na Jornada Anual da Coroa.\n"
                "Recusa implica penalidade de reputação junto à Câmara Nobre."
            ),
        ])
        print(f"Assunto: CIRCULAR INTERNA\n\n{news}\n")
        input("Pressione ENTER para marcar como lido e arquivar...")

if __name__ == '__main__':
    ui = HeroFootUI()
    ui.main_menu()
