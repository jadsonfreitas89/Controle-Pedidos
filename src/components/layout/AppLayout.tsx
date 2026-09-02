import { ReactNode } from 'react';
import { LayoutDashboard, ListTodo, PlusCircle, Wrench, Users, MessageSquare } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/solicitacoes', label: 'Solicitações', icon: ListTodo },
  { path: '/itens', label: 'Itens', icon: Wrench },
  { path: '/usuarios', label: 'Usuários', icon: Users },
  { path: '/whatsapp', label: 'WhatsApp', icon: MessageSquare },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* Sidebar Desktop */}
      <nav className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 p-4 gap-2">
        <h1 className="text-xl font-bold p-2 mb-4 text-slate-800">Controle Pedidos</h1>
        {navItems.map(item => (
          <NavLink key={item.path} to={item.path} className={({ isActive }) => `flex items-center gap-3 p-3 rounded-lg ${isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`}>
            <item.icon size={20} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 mb-16 md:mb-0">
        {children}
      </main>

      {/* Bottom Nav Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around p-2">
        {navItems.map(item => (
          <NavLink key={item.path} to={item.path} className={({ isActive }) => `p-2 flex flex-col items-center ${isActive ? 'text-blue-700' : 'text-slate-500'}`}>
            <item.icon size={24} />
            <span className="text-[10px]">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
