import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, signOut } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App safely without re-initialization
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);

// Helper to configure Google provider with explicit consent prompt and Drive scope
export const createGoogleAuthProvider = () => {
  const provider = new GoogleAuthProvider();
  // Request Google Drive readonly scope to read files, spreadsheets and documentation
  provider.addScope('https://www.googleapis.com/auth/drive.readonly');
  provider.setCustomParameters({
    prompt: 'consent select_account',
    access_type: 'offline',
  });
  return provider;
};

// Flag to indicate if we are in the middle of a sign-in flow.
let isSigningIn = false;
// Cache the access token in memory only. NEVER store in localStorage or sessionStorage.
let cachedAccessToken: string | null = null;

// Initialize auth state listener. Call this on app load.
export const initAuth = (
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // User is authenticated in Firebase Auth, but in-memory access token requires sign-in popup to renew
        if (onAuthSuccess) onAuthSuccess(user, null);
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Must be called from a button click or user interaction
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const provider = createGoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Não foi possível obter o token de acesso da conta Google.');
    }

    cachedAccessToken = credential.accessToken;

    // Verify whether the issued token actually contains the drive scope
    try {
      const tokenCheck = await fetch(
        `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${cachedAccessToken}`
      );
      if (tokenCheck.ok) {
        const info = await tokenCheck.json();
        const grantedScopes = info.scope || '';
        if (!grantedScopes.includes('drive')) {
          console.warn('Escopo do Google Drive ausente no token:', grantedScopes);
          throw new Error(
            'A permissão para o Google Drive não foi selecionada na janela do Google. Por favor, clique novamente e marque a caixa de seleção autorizando o acesso aos arquivos.'
          );
        }
      }
    } catch (checkErr: any) {
      if (checkErr.message?.includes('Google Drive')) {
        throw checkErr;
      }
    }

    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Erro na autenticação com Google:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const setAccessTokenInMemory = (token: string | null) => {
  cachedAccessToken = token;
};

export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};
