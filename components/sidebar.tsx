'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme-toggle';
import { 
  LayoutDashboard, 
  Users, 
  History, 
  FilePlus2,
  Wrench
} from 'lucide-react';

export type View = 'dashboard' | 'clients' | 'history' | 'new-os';

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

export function Sidebar({ currentView, onViewChange }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'new-os', label: 'Nova O.S.', icon: FilePlus2 },
    { id: 'clients', label: 'Clientes', icon: Users },
    { id: 'history', label: 'Histórico', icon: History },
  ] as const;

  return (
    <aside className="w-64 border-r bg-muted/30 flex flex-col h-screen sticky top-0">
      <div className="p-6 flex items-center gap-2 border-bottom">
        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-primary-foreground shadow-lg">
          <Wrench className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-none">Retifica</h1>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Mendonça</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 group text-sm font-medium",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive ? "" : "text-muted-foreground group-hover:text-foreground")} />
              {item.label}
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-foreground/50" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t mt-auto space-y-2">
        <ThemeToggle />
        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-widest">Sistema V1.0</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-medium">Servidor Online</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
