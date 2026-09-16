import { ReactNode } from 'react';
import { LayoutDashboard, ListTodo, Wrench, Users, MessageSquare, User as UserIcon, LogOut } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, adminOnly: false },
  { path: '/solicitacoes', label: 'Solicitações', icon: ListTodo, adminOnly: false },
  { path: '/itens', label: 'Itens', icon: Wrench, adminOnly: false },
  { path: '/usuarios', label: 'Usuários', icon: Users, adminOnly: true },
  { path: '/whatsapp', label: 'WhatsApp', icon: MessageSquare, adminOnly: false },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const { currentUser, isAdmin, logout } = useAuth();

  const filteredNavItems = navItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* Sidebar Desktop */}
      <nav className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 p-4 gap-2 justify-between">
        <div>
          <h1 className="text-xl font-bold p-2 mb-2 text-slate-800 flex items-center gap-2">
            Controle Pedidos
          </h1>

          {/* User info card */}
          <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1">
                <UserIcon size={12} /> Usuário Logado
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                {isAdmin ? 'ADM' : 'USUARIO'}
              </span>
            </div>
            <div className="font-bold text-slate-800 text-sm truncate">{currentUser?.nome || 'Não identificado'}</div>
            <div className="text-[11px] text-slate-500 truncate">{currentUser?.usuario || ''}</div>
          </div>

          <div className="space-y-1">
            {navItems.map(item => {
              const isRestricted = item.adminOnly && !isAdmin;
              if (isRestricted) return null;

              return (
                <NavLink 
                  key={item.path} 
                  to={item.path} 
                  className={({ isActive }) => `flex items-center gap-3 p-3 rounded-lg text-sm transition-colors ${isActive ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <button
            onClick={() => logout()}
            className="w-full text-xs text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 p-2.5 rounded-xl flex items-center justify-center gap-2 font-semibold transition-colors cursor-pointer"
          >
            <LogOut size={16} /> Sair do Sistema
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen md:min-h-0">
        {/* Top Header Mobile */}
        <header className="md:hidden bg-white border-b border-slate-200 p-3 flex justify-between items-center sticky top-0 z-40">
          <h1 className="font-bold text-slate-800 text-base">Controle Pedidos</h1>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 text-xs truncate max-w-[120px]">{currentUser?.nome}</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
              {isAdmin ? 'ADM' : 'USER'}
            </span>
            <button
              onClick={() => logout()}
              title="Sair"
              className="p-1.5 text-slate-500 hover:text-red-600 rounded-lg hover:bg-slate-100"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 mb-16 md:mb-0">
          {children}
        </main>
      </div>

      {/* Bottom Nav Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around p-2 z-40">
        {filteredNavItems.map(item => (
          <NavLink key={item.path} to={item.path} className={({ isActive }) => `p-2 flex flex-col items-center ${isActive ? 'text-blue-700' : 'text-slate-500'}`}>
            <item.icon size={22} />
            <span className="text-[10px]">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

