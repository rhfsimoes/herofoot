import React from 'react';
import { User } from 'firebase/auth';
import { 
  FolderGit2, 
  Layers, 
  Gamepad2, 
  KanbanSquare, 
  Code2, 
  Sparkles,
  LogOut,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';

export type ActiveTab = 'drive' | 'systems' | 'simulator' | 'backlog' | 'architecture';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  user: User | null;
  hasDriveToken: boolean;
  onLoginClick: () => void;
  onLogoutClick: () => void;
  isLoggingIn: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  user,
  hasDriveToken,
  onLoginClick,
  onLogoutClick,
  isLoggingIn,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onTabChange('systems')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-amber-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-emerald-900/30">
              <span className="text-xl">⚔️📜</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-emerald-400 via-amber-300 to-indigo-300 bg-clip-text text-transparent">
                  HeroFoot
                </span>
                <span className="bg-amber-950 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-700/50 uppercase tracking-wider">
                  v0.7.1 Homologado
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Fantasia Corporativa 7/10 • Complexo Industrial B2B & Liga
              </p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="hidden md:flex space-x-1">
            <button
              onClick={() => onTabChange('backlog')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                activeTab === 'backlog'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <KanbanSquare className="w-4 h-4" />
              <span>Board do Tech Lead</span>
            </button>

            <button
              onClick={() => onTabChange('systems')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                activeTab === 'systems'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>As 5 Fases Canônicas</span>
            </button>

            <button
              onClick={() => onTabChange('simulator')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                activeTab === 'simulator'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Gamepad2 className="w-4 h-4" />
              <span>Simulador B2B & Câmaras</span>
            </button>

            <button
              onClick={() => onTabChange('architecture')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                activeTab === 'architecture'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Code2 className="w-4 h-4" />
              <span>DRE & Arquitetura</span>
            </button>

            <button
              onClick={() => onTabChange('drive')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                activeTab === 'drive'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <FolderGit2 className="w-4 h-4" />
              <span>Documentos & Git</span>
            </button>
          </nav>

          {/* Auth & Drive Status */}
          <div className="flex items-center space-x-3">
            {user && hasDriveToken ? (
              <div className="flex items-center space-x-2">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-medium text-slate-200 truncate max-w-[120px]">
                    {user.displayName || user.email?.split('@')[0]}
                  </span>
                  <span className="text-[10px] text-emerald-400 flex items-center justify-end gap-1">
                    <ShieldCheck className="w-3 h-3 inline" /> Drive Conectado
                  </span>
                </div>
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="Avatar"
                    className="w-8 h-8 rounded-full border border-emerald-500/50"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center text-xs font-bold">
                    {user.email?.[0].toUpperCase() || 'U'}
                  </div>
                )}
                <button
                  onClick={onLogoutClick}
                  title="Desconectar"
                  className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onLoginClick}
                disabled={isLoggingIn}
                className="gsi-material-button text-xs py-1 px-3 h-9"
              >
                <div className="gsi-material-button-state"></div>
                <div className="gsi-material-button-content-wrapper">
                  <div className="gsi-material-button-icon">
                    <svg
                      version="1.1"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 48 48"
                      style={{ display: 'block' }}
                    >
                      <path
                        fill="#EA4335"
                        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                      ></path>
                      <path
                        fill="#4285F4"
                        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                      ></path>
                      <path
                        fill="#FBBC05"
                        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                      ></path>
                      <path
                        fill="#34A853"
                        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                      ></path>
                      <path fill="none" d="M0 0h48v48H0z"></path>
                    </svg>
                  </div>
                  <span className="gsi-material-button-contents">
                    {isLoggingIn ? 'Conectando...' : 'Conectar Google Drive'}
                  </span>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden overflow-x-auto py-2 border-t border-slate-800 space-x-2 scrollbar-none">
          <button
            onClick={() => onTabChange('drive')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
              activeTab === 'drive' ? 'bg-emerald-600 text-white' : 'text-slate-400'
            }`}
          >
            Arquivos & Drive
          </button>
          <button
            onClick={() => onTabChange('systems')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
              activeTab === 'systems' ? 'bg-amber-600 text-white' : 'text-slate-400'
            }`}
          >
            Pilares & Sistemas
          </button>
          <button
            onClick={() => onTabChange('simulator')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
              activeTab === 'simulator' ? 'bg-indigo-600 text-white' : 'text-slate-400'
            }`}
          >
            Simulador
          </button>
          <button
            onClick={() => onTabChange('backlog')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
              activeTab === 'backlog' ? 'bg-purple-600 text-white' : 'text-slate-400'
            }`}
          >
            Backlog
          </button>
          <button
            onClick={() => onTabChange('architecture')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
              activeTab === 'architecture' ? 'bg-cyan-600 text-white' : 'text-slate-400'
            }`}
          >
            Arquitetura
          </button>
        </div>
      </div>
    </header>
  );
};
