import { ReactNode } from 'react';

export default function Card({ children, className = '', onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div onClick={onClick} className={`bg-white rounded-xl shadow-sm border border-slate-100 p-5 ${className}`}>
      {children}
    </div>
  );
}

