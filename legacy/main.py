import sys
import os

# Garantir que o diretório atual está no path para os imports locais funcionarem
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from controller import GameController
from ui import HeroFootUI

def main():
    print("Inicializando o motor do HeroFoot...")
    
    # 1. Instanciar o Controller (Coração Lógico e Estado Global)
    controller = GameController()
    
    # 2. Instanciar a UI (Coração Visual), injetando o GameState do Controller
    app_ui = HeroFootUI(game_state=controller.state)
    
    # Nota do Tech Lead: Por enquanto a UI tem seus próprios mocks de fluxo no `main_menu`.
    # A integração profunda (UI chamando os métodos do Controller em cada fase) 
    # será o próximo passo da evolução do MVP. Mas já podemos rodar!
    
    app_ui.main_menu()

if __name__ == "__main__":
    main()
