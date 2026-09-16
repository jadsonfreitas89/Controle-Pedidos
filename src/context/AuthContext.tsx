import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Usuario } from '../types/solicitacao';
import { api } from '../services/api';
import { Loader2, Package } from 'lucide-react';

interface AuthContextType {
  currentUser: Usuario | null;
  isAdmin: boolean;
  isLoading: boolean;
  isFirstAccess: boolean;
  setIsFirstAccess: (val: boolean) => void;
  checkFirstAccess: () => Promise<boolean>;
  login: (usuario: string, senha?: string) => Promise<{ success: boolean; error?: string; precisaCadastrarSenha?: boolean; usuario?: any }>;
  definirSenhaPrimeiroAcesso: (usuario: string, senhaInput: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  activeUsers: Usuario[];
  refreshUsersList: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFirstAccess, setIsFirstAccess] = useState<boolean>(false);
  const [activeUsers, setActiveUsers] = useState<Usuario[]>([]);

  const checkFirstAccess = async (): Promise<boolean> => {
    try {
      const res = await api.verificarPrimeiroAcesso();
      if (res.success && typeof res.primeiroAcesso === 'boolean') {
        setIsFirstAccess(res.primeiroAcesso);
        return res.primeiroAcesso;
      }
    } catch (e) {
      // Default to false on error
    }
    setIsFirstAccess(false);
    return false;
  };

  const refreshUsersList = async () => {
    try {
      const res = await api.listarUsuarios();
      if (res.success && Array.isArray(res.data)) {
        setActiveUsers(res.data);
      }
    } catch (e) {
      // Ignore if not admin or unauthenticated
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('auth_token');
      const storedUser = localStorage.getItem('usuario_logado');

      if (!storedToken || !storedUser) {
        if (isMounted) {
          setCurrentUser(null);
          try {
            const fa = await api.verificarPrimeiroAcesso();
            if (isMounted) {
              setIsFirstAccess(!!fa.primeiroAcesso);
            }
          } catch (e) {
            if (isMounted) setIsFirstAccess(false);
          }
          if (isMounted) setIsLoading(false);
        }
        return;
      }

      try {
        let parsedUser: Usuario | null = null;
        try {
          parsedUser = JSON.parse(storedUser);
        } catch (e) {
          parsedUser = null;
        }

        if (!parsedUser) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('usuario_logado');
          if (isMounted) {
            setCurrentUser(null);
            try {
              const fa = await api.verificarPrimeiroAcesso();
              if (isMounted) setIsFirstAccess(!!fa.primeiroAcesso);
            } catch (e) {
              if (isMounted) setIsFirstAccess(false);
            }
            setIsLoading(false);
          }
          return;
        }

        // Test session validity with backend
        const testRes = await api.listarSolicitacoes();
        if (testRes.success) {
          if (isMounted) {
            setCurrentUser(parsedUser);
            setIsFirstAccess(false);
          }
          // Fetch user list if available
          try {
            const usersRes = await api.listarUsuarios();
            if (usersRes.success && Array.isArray(usersRes.data)) {
              if (isMounted) setActiveUsers(usersRes.data);
            }
          } catch (e) {
            // Ignore non-admin
          }
        } else {
          // Token expired or invalid session
          localStorage.removeItem('auth_token');
          localStorage.removeItem('usuario_logado');
          if (isMounted) {
            setCurrentUser(null);
            try {
              const fa = await api.verificarPrimeiroAcesso();
              if (isMounted) setIsFirstAccess(!!fa.primeiroAcesso);
            } catch (e) {
              if (isMounted) setIsFirstAccess(false);
            }
          }
        }
      } catch (err) {
        // Network or authentication error
        localStorage.removeItem('auth_token');
        localStorage.removeItem('usuario_logado');
        if (isMounted) {
          setCurrentUser(null);
          try {
            const fa = await api.verificarPrimeiroAcesso();
            if (isMounted) setIsFirstAccess(!!fa.primeiroAcesso);
          } catch (e) {
            if (isMounted) setIsFirstAccess(false);
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (usuarioInput: string, senhaInput?: string) => {
    try {
      const res = await api.login(usuarioInput, senhaInput);
      
      if (res.precisaCadastrarSenha) {
        return { success: true, precisaCadastrarSenha: true, usuario: res.usuario };
      }

      if (res.success) {
        const userData = res.usuario || res.data || res.dados || res;
        const token = res.token || userData.token || res.data?.token || res.usuario?.token;
        
        // Clean user object (never store plain password or hash)
        const cleanUser: Usuario = {
          idUsuario: userData.idUsuario || userData.id_usuario || '',
          nome: userData.nome || '',
          email: userData.email || '',
          usuario: userData.usuario || '',
          perfil: userData.perfil || 'USUARIO',
          ativo: userData.ativo || 'SIM',
          token: token
        };

        if (token) {
          localStorage.setItem('auth_token', token);
        }
        localStorage.setItem('usuario_logado', JSON.stringify(cleanUser));
        setCurrentUser(cleanUser);
        setIsFirstAccess(false);

        // Fetch active users list asynchronously
        refreshUsersList();

        return { success: true };
      }

      if (res.error || res.mensagem) {
        return { success: false, error: res.error || res.mensagem };
      }
      
      return { success: false, error: 'Usuário ou senha inválidos.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao realizar login.' };
    }
  };

  const definirSenhaPrimeiroAcesso = async (usuarioInput: string, senhaInput: string) => {
    try {
      const res = await api.definirSenhaPrimeiroAcesso({ usuario: usuarioInput, senha: senhaInput });
      if (res.success) {
        const userData = res.usuario || res.data || res.dados || res;
        const token = res.token || userData.token || res.data?.token || res.usuario?.token;
        
        const cleanUser: Usuario = {
          idUsuario: userData.idUsuario || userData.id_usuario || '',
          nome: userData.nome || '',
          email: userData.email || '',
          usuario: userData.usuario || '',
          perfil: userData.perfil || 'USUARIO',
          ativo: userData.ativo || 'SIM',
          token: token
        };

        if (token) {
          localStorage.setItem('auth_token', token);
        }
        localStorage.setItem('usuario_logado', JSON.stringify(cleanUser));
        setCurrentUser(cleanUser);
        setIsFirstAccess(false);

        refreshUsersList();

        return { success: true };
      }
      return { success: false, error: res.error || res.message || 'Erro ao cadastrar senha.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao cadastrar senha.' };
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      setCurrentUser(null);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('usuario_logado');
    }
  };

  const isAdmin = (currentUser?.perfil || '').toUpperCase() === 'ADM';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-white">
        <div className="p-4 rounded-2xl bg-blue-600 text-white shadow-xl mb-4">
          <Package size={36} />
        </div>
        <div className="flex items-center gap-3 text-sm font-semibold text-slate-300">
          <Loader2 size={20} className="animate-spin text-blue-500" />
          <span>Validando sessão...</span>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAdmin,
        isLoading,
        isFirstAccess,
        setIsFirstAccess,
        checkFirstAccess,
        login,
        definirSenhaPrimeiroAcesso,
        logout,
        activeUsers,
        refreshUsersList
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
}

