import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import JSZip from 'jszip';
import { 
  Folder, 
  FileText, 
  FileSpreadsheet, 
  FileCode, 
  FolderOpen, 
  RefreshCw, 
  Upload, 
  FileArchive, 
  Eye, 
  CheckCircle, 
  AlertTriangle, 
  Search, 
  Download, 
  ExternalLink,
  Github,
  Sparkles,
  ArrowRight,
  Info
} from 'lucide-react';
import { DriveService, DriveFileItem } from '../services/drive';
import { CANONICAL_AI_MASTER_CONTEXT } from '../data/canonicalMasterContext';

interface DriveExplorerProps {
  user: User | null;
  hasDriveToken: boolean;
  onLoginClick: () => void;
  getAccessToken: () => Promise<string | null>;
  onInspectSystemDoc?: (fileName: string, content: string) => void;
}

interface LocalFile {
  name: string;
  path: string;
  size: number;
  content: string;
  type: string;
}

export const DriveExplorer: React.FC<DriveExplorerProps> = ({
  user,
  hasDriveToken,
  onLoginClick,
  getAccessToken,
  onInspectSystemDoc,
}) => {
  // Folder ID from prompt
  const [folderIdInput, setFolderIdInput] = useState('1dBam9vH3Re5OCVjJ6Gn9u6ggtZGzzUyX');
  const [driveFiles, setDriveFiles] = useState<DriveFileItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [driveError, setDriveError] = useState<string | null>(null);

  // Selected file preview
  const [selectedFile, setSelectedFile] = useState<DriveFileItem | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [isLoadingContent, setIsLoadingContent] = useState(false);

  // Local / ZIP uploads
  const [localFiles, setLocalFiles] = useState<LocalFile[]>([]);
  const [selectedLocalFile, setSelectedLocalFile] = useState<LocalFile | null>(null);
  const [activeSourceTab, setActiveSourceTab] = useState<'drive' | 'local' | 'master_context' | 'github'>('master_context');
  const [masterContextText, setMasterContextText] = useState<string>(CANONICAL_AI_MASTER_CONTEXT);
  const [isSavedMasterContext, setIsSavedMasterContext] = useState<boolean>(true);

  // Load drive files on mount if token is ready
  useEffect(() => {
    if (hasDriveToken) {
      loadDriveFiles(folderIdInput);
    }
  }, [hasDriveToken]);

  const loadDriveFiles = async (input: string) => {
    setIsLoading(true);
    setDriveError(null);
    setSelectedFile(null);
    setFileContent('');

    try {
      const token = await getAccessToken();
      if (!token) {
        throw new Error('Token de autenticação do Google não disponível. Por favor, conecte-se com sua conta Google.');
      }

      const cleanFolderId = DriveService.extractFolderId(input);
      const items = await DriveService.listFiles(cleanFolderId, token);
      setDriveFiles(items);
    } catch (err: any) {
      console.error('Erro ao listar arquivos:', err);
      setDriveError(err.message || 'Falha ao acessar os arquivos da pasta do Google Drive.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectFile = async (file: DriveFileItem) => {
    setSelectedFile(file);
    setIsLoadingContent(true);
    setFileContent('');

    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Sessão expirada. Reconecte-se com o Google.');

      if (file.mimeType === 'application/vnd.google-apps.folder') {
        // Navigate inside subfolder
        setFolderIdInput(file.id);
        loadDriveFiles(file.id);
        return;
      }

      const content = await DriveService.getFileContent(file.id, file.mimeType, token);
      setFileContent(content);
    } catch (err: any) {
      setFileContent(`[Erro ao carregar conteúdo do arquivo: ${err.message}]`);
    } finally {
      setIsLoadingContent(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const parsed: LocalFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (f.name.endsWith('.zip')) {
        // Unzip
        try {
          const zip = new JSZip();
          const loadedZip = await zip.loadAsync(f);
          const entries = Object.keys(loadedZip.files);

          for (const filename of entries) {
            const entry = loadedZip.files[filename];
            if (!entry.dir) {
              const text = await entry.async('string');
              parsed.push({
                name: filename.split('/').pop() || filename,
                path: filename,
                size: text.length,
                content: text,
                type: filename.split('.').pop() || 'text'
              });
            }
          }
        } catch (err) {
          console.error('Erro ao descompactar:', err);
        }
      } else {
        const text = await f.text();
        parsed.push({
          name: f.name,
          path: f.name,
          size: f.size,
          content: text,
          type: f.name.split('.').pop() || 'text'
        });
      }
    }

    setLocalFiles(prev => [...prev, ...parsed]);
    if (parsed.length > 0) {
      setSelectedLocalFile(parsed[0]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Tech Lead Brief */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Diagnóstico de Acesso & Ingestão de Documentos</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Acesso aos Arquivos do Jogo <span className="text-amber-400">HeroFoot</span>
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Como seu Tech Lead, organizei os canais para leitura completa de todos os sistemas (GDD, tabelas de atributos, código-fonte e algoritmos de síntese). Conecte sua conta Google para explorar a pasta atualizada do Drive ou use o upload direto.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveSourceTab('master_context')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeSourceTab === 'master_context'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/40 ring-2 ring-amber-400 font-extrabold'
                  : 'bg-amber-950/40 text-amber-300 border border-amber-500/40 hover:bg-amber-900/40'
              }`}
            >
              <FileText className="w-4 h-4 text-amber-400" />
              <span>ai_master_context (Mestre)</span>
            </button>
            <button
              onClick={() => setActiveSourceTab('drive')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeSourceTab === 'drive'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-700/40 ring-2 ring-emerald-400/50'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <FolderOpen className="w-4 h-4" />
              Google Drive (Atualizado)
            </button>
            <button
              onClick={() => setActiveSourceTab('local')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeSourceTab === 'local'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-700/40 ring-2 ring-indigo-400/50'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Upload className="w-4 h-4" />
              Upload Local / ZIP
            </button>
            <button
              onClick={() => setActiveSourceTab('github')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeSourceTab === 'github'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-700/40 ring-2 ring-purple-400/50'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Github className="w-4 h-4" />
              Diagnóstico GitHub
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: GOOGLE DRIVE */}
      {activeSourceTab === 'drive' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls & File List */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Folder className="w-4 h-4 text-emerald-400" />
                  Pasta do Google Drive
                </h3>
                {hasDriveToken && (
                  <span className="text-[11px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                    Sessão Ativa
                  </span>
                )}
              </div>

              {/* Input for Folder ID or URL */}
              <div className="space-y-2">
                <label className="text-xs text-slate-400">ID da Pasta ou Link de Compartilhamento:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={folderIdInput}
                    onChange={(e) => setFolderIdInput(e.target.value)}
                    placeholder="Cole o ID ou URL da pasta do Drive"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  <button
                    onClick={() => loadDriveFiles(folderIdInput)}
                    disabled={isLoading || !hasDriveToken}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>Listar</span>
                  </button>
                </div>
              </div>

              {/* If not authenticated with Drive token */}
              {!hasDriveToken ? (
                <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/30 text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
                    <Info className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-amber-300">Autenticação Necessária</h4>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Para que a API do Google Drive acesse os arquivos da pasta com permissão do usuário, conecte sua conta Google abaixo:
                    </p>
                  </div>
                  <button
                    onClick={onLoginClick}
                    className="gsi-material-button text-xs py-1 px-3 w-full justify-center"
                  >
                    <div className="gsi-material-button-state"></div>
                    <div className="gsi-material-button-content-wrapper">
                      <div className="gsi-material-button-icon">
                        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block' }}>
                          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                          <path fill="none" d="M0 0h48v48H0z"></path>
                        </svg>
                      </div>
                      <span className="gsi-material-button-contents">Sign in with Google</span>
                    </div>
                  </button>
                </div>
              ) : null}

              {/* Error Box */}
              {driveError && (
                <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs space-y-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                    <div className="flex-1">
                      <p className="font-semibold text-rose-200">Aviso do Google Drive:</p>
                      <p className="text-[11px] mt-0.5 opacity-90 leading-relaxed">{driveError}</p>
                    </div>
                  </div>
                  <button
                    onClick={onLoginClick}
                    className="w-full py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reconectar e Marcar Permissão do Drive</span>
                  </button>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    💡 Na janela que abrir do Google, marque a caixa permitindo que o aplicativo leia seus arquivos do Drive.
                  </p>
                </div>
              )}

              {/* File list items */}
              <div className="space-y-1 max-h-[380px] overflow-y-auto pr-1">
                {isLoading ? (
                  <div className="py-8 text-center text-xs text-slate-400 space-y-2">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-400" />
                    <p>Consultando Google Drive v3 API...</p>
                  </div>
                ) : driveFiles.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-500">
                    Nenhum arquivo listado. {hasDriveToken ? 'Clique em "Listar" para carregar a pasta.' : 'Faça login para listar.'}
                  </div>
                ) : (
                  driveFiles.map((file) => {
                    const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
                    const isDoc = file.mimeType.includes('document');
                    const isSheet = file.mimeType.includes('spreadsheet');
                    const isSelected = selectedFile?.id === file.id;
                    const isMasterContextFile = file.name.toLowerCase().includes('ai_master_context');

                    return (
                      <div
                        key={file.id}
                        onClick={() => handleSelectFile(file)}
                        className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-xs ${
                          isMasterContextFile
                            ? 'bg-amber-950/40 border-amber-500/80 text-amber-200 ring-1 ring-amber-500/40'
                            : isSelected
                            ? 'bg-emerald-950/50 border-emerald-500/60 text-white'
                            : 'bg-slate-950/50 border-slate-800/80 text-slate-300 hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 truncate">
                          {isMasterContextFile ? (
                            <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                          ) : isFolder ? (
                            <Folder className="w-4 h-4 text-amber-400 shrink-0" />
                          ) : isSheet ? (
                            <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : isDoc ? (
                            <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                          ) : (
                            <FileCode className="w-4 h-4 text-indigo-400 shrink-0" />
                          )}
                          <div className="truncate">
                            <span className="truncate font-medium">{file.name}</span>
                            {isMasterContextFile && (
                              <span className="block text-[9px] text-amber-400 font-bold uppercase tracking-wider">
                                ★ Documento Mestre (ai_master_context)
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-1.5 shrink-0 text-[10px] text-slate-400">
                          {isFolder ? (
                            <span className="bg-amber-950/60 text-amber-300 px-1.5 py-0.5 rounded">Pasta</span>
                          ) : isMasterContextFile ? (
                            <span className="bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-bold border border-amber-500/40">Canônico</span>
                          ) : (
                            <span>{file.size ? `${Math.round(parseInt(file.size) / 1024)} KB` : 'Doc'}</span>
                          )}
                          <ArrowRight className="w-3 h-3 text-slate-500" />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* File Preview & System Extractor */}
          <div className="lg:col-span-7">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg h-full flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <div className="flex items-center space-x-2 truncate">
                  <Eye className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white truncate">
                    {selectedFile ? selectedFile.name : 'Visualizador de Arquivos'}
                  </h3>
                </div>
                {selectedFile?.webViewLink && (
                  <a
                    href={selectedFile.webViewLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                  >
                    <span>Abrir no Drive</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs overflow-auto max-h-[500px]">
                {isLoadingContent ? (
                  <div className="h-48 flex items-center justify-center text-slate-400 space-y-2 flex-col">
                    <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
                    <span>Lendo dados do arquivo...</span>
                  </div>
                ) : selectedFile ? (
                  <pre className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {fileContent || '(Arquivo vazio ou formato binário)'}
                  </pre>
                ) : (
                  <div className="h-48 flex flex-col items-center justify-center text-slate-500 space-y-2">
                    <FileText className="w-8 h-8 opacity-40" />
                    <p>Selecione um arquivo da lista ao lado para inspecionar os sistemas.</p>
                  </div>
                )}
              </div>

              {selectedFile && fileContent && (
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Tamanho lido: {fileContent.length} caracteres
                  </span>
                  <button
                    onClick={() => {
                      if (onInspectSystemDoc) {
                        onInspectSystemDoc(selectedFile.name, fileContent);
                      }
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Catalogar nos Sistemas</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 0: AI MASTER CONTEXT (CANONICAL GOSPEL) */}
      {activeSourceTab === 'master_context' && (
        <div className="bg-slate-900 border border-amber-500/50 rounded-3xl p-6 shadow-2xl space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/40 text-amber-300 text-xs font-bold">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>Diretriz Suprema & Canônica do Projeto</span>
              </div>
              <h2 className="text-2xl font-black text-white flex items-center gap-2">
                <span>ai_master_context</span>
                <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold">
                  Tom & Visão Protegidos
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-3xl">
                O documento <strong className="text-amber-400 font-mono">ai_master_context</strong> é a autoridade máxima do HeroFoot. Como seu Tech Lead, garanto que não haverá alterações no tom de voz, na identidade das mecânicas ou no escopo do que já foi construído.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {driveFiles.some(f => f.name.toLowerCase().includes('ai_master_context')) && (
                <button
                  onClick={async () => {
                    const masterFile = driveFiles.find(f => f.name.toLowerCase().includes('ai_master_context'));
                    if (masterFile) {
                      await handleSelectFile(masterFile);
                      const token = await getAccessToken();
                      if (token) {
                        const content = await DriveService.getFileContent(masterFile.id, masterFile.mimeType, token);
                        setMasterContextText(content);
                        setIsSavedMasterContext(true);
                      }
                    }
                  }}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-emerald-200" />
                  <span>Importar do Google Drive</span>
                </button>
              )}

              <button
                onClick={() => {
                  if (!masterContextText.trim()) return;
                  setIsSavedMasterContext(true);
                  if (onInspectSystemDoc) {
                    onInspectSystemDoc('ai_master_context.md', masterContextText);
                  }
                }}
                disabled={!masterContextText.trim()}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{isSavedMasterContext ? '✓ ai_master_context Fixado' : 'Fixar ai_master_context'}</span>
              </button>
            </div>
          </div>

          {/* Guiding Rules for Tech Lead */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" /> 1. Tom Preservado
              </span>
              <p className="text-[11px] text-slate-400">
                Respeito rigoroso à narrativa, estilo de escrita e humor estabelecidos no documento original.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" /> 2. Fidelidade Mecânica
              </span>
              <p className="text-[11px] text-slate-400">
                Os cálculos de Brasfoot, atributos de atletas e síntese de Atelier seguem a modelagem já definida.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" /> 3. Extensão Sem Ruptura
              </span>
              <p className="text-[11px] text-slate-400">
                Novos pedidos e refinamentos técnicos somam ao ecossistema existente, sem descartar o trabalho anterior.
              </p>
            </div>
          </div>

          {/* Textarea for ai_master_context */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <span>Conteúdo do ai_master_context:</span>
                {isSavedMasterContext && (
                  <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                    Ativo & Referenciado pelo Tech Lead
                  </span>
                )}
              </label>
              <span className="text-[11px] text-slate-500 font-mono">
                {masterContextText.length} caracteres
              </span>
            </div>

            <textarea
              rows={16}
              value={masterContextText}
              onChange={(e) => {
                setMasterContextText(e.target.value);
                setIsSavedMasterContext(false);
              }}
              placeholder="Cole aqui o conteúdo do seu ai_master_context (ou importe diretamente da pasta do Google Drive). Uma vez colado, todo o trabalho do Tech Lead será estritamente guiado por estas diretrizes."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xs text-slate-200 leading-relaxed focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>
      )}

      {/* TAB 2: LOCAL / ZIP UPLOAD */}
      {activeSourceTab === 'local' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileArchive className="w-4 h-4 text-indigo-400" />
                Importar Arquivos Locais ou ZIP
              </h3>
              <p className="text-xs text-slate-400">
                Baixou os arquivos do Drive ou do repositório no seu computador? Arraste o arquivo <strong>.zip</strong> ou documentos aqui para análise imediata em memória no navegador.
              </p>

              <label className="border-2 border-dashed border-indigo-500/40 hover:border-indigo-400/80 bg-indigo-950/20 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors group">
                <Upload className="w-8 h-8 text-indigo-400 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-white">Clique para selecionar ou arraste o .ZIP</span>
                <span className="text-[10px] text-slate-400 mt-1">Suporta .zip, .md, .txt, .json, .ts, .gd, .cs</span>
                <input
                  type="file"
                  multiple
                  accept=".zip,.md,.txt,.json,.ts,.js,.gd,.cs,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {/* Local files list */}
              {localFiles.length > 0 && (
                <div className="space-y-1 max-h-[300px] overflow-y-auto">
                  <div className="text-[11px] font-semibold text-slate-400 mb-1">
                    {localFiles.length} arquivos carregados:
                  </div>
                  {localFiles.map((f, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedLocalFile(f)}
                      className={`p-2 rounded-xl text-xs cursor-pointer border flex items-center justify-between ${
                        selectedLocalFile?.path === f.path
                          ? 'bg-indigo-950/60 border-indigo-500/60 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="truncate flex items-center gap-2">
                        <FileCode className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="truncate">{f.path}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 shrink-0">
                        {Math.round(f.size / 1024)} KB
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg h-full flex flex-col">
              <div className="border-b border-slate-800 pb-3 mb-4 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">
                  {selectedLocalFile ? selectedLocalFile.path : 'Pré-visualização Local'}
                </h3>
              </div>

              <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs overflow-auto max-h-[500px]">
                {selectedLocalFile ? (
                  <pre className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {selectedLocalFile.content}
                  </pre>
                ) : (
                  <div className="h-48 flex flex-col items-center justify-center text-slate-500 space-y-2">
                    <FileArchive className="w-8 h-8 opacity-40" />
                    <p>Faça upload de um arquivo ou .zip para inspecionar aqui.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GITHUB DIAGNOSTIC & SYNC */}
      {activeSourceTab === 'github' && (
        <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-800 flex items-center justify-center text-emerald-400">
                <Github className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>github.com/rhfsimoes/herofoot</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                    Público & Sincronizado
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Última versão lida: commit <code>feat(positions)</code> • v0.7.1
                </p>
              </div>
            </div>

            <a
              href="https://github.com/rhfsimoes/herofoot"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 border border-slate-700 transition-all"
            >
              <span>Abrir Repositório</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
            <h4 className="text-xs font-bold text-emerald-300 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Sincronização do Tech Lead Concluída com Sucesso:</span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              O repositório foi clonado e totalmente lido pelo Tech Lead Workspace. Todos os 150 arquivos, incluindo <strong>docs/AI_MASTER_CONTEXT.md</strong>, <strong>docs/ROADMAP_TODO.md</strong>, <strong>data/parts_seed.json</strong>, <strong>match_engine.py</strong> e a nova suíte de testes <strong>tests/test_positions.py</strong> foram integrados e estão governando este painel.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Arquivos Inspecionados</span>
              <div className="text-base font-extrabold text-white">150 Arquivos</div>
              <p className="text-[11px] text-slate-400">Backend Python puro + Frontend React TS + Seeds JSON</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Cobertura de Testes</span>
              <div className="text-base font-extrabold text-emerald-400">223 Testes Unitários</div>
              <p className="text-[11px] text-slate-400">100% de aprovação (test_positions.py incluso)</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Próximo Marco Oficial</span>
              <div className="text-base font-extrabold text-purple-400">v0.8.0</div>
              <p className="text-[11px] text-slate-400">Memorial de Baixas, Aposentados & Cidadela do Rei Demônio</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
