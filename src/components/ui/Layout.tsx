import React, { useState } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { Sidebar } from '../Sidebar';
import { MobileNav } from '../MobileNav';
import { Footer } from '../Footer';
import { cn } from '../../utils/cn';
import { Menu, X } from 'lucide-react';
import { Button } from './Button';

interface AppLayoutProps {
  children: React.ReactNode;
  path: string;
}

export function AppLayout({ children, path }: AppLayoutProps) {
  const { theme } = useTheme();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const isSuite = path === "/corporate-suite";

  return (
    <div className={cn(
      'min-h-screen flex bg-slate-50 dark:bg-slate-950 transition-colors duration-300',
      theme === 'dark' && 'dark'
    )}>
      {/* Desktop Sidebar */}
      {!isSuite && (
        <div className="hidden lg:flex lg:shrink-0">
          <div className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <Sidebar isOpen={true} setIsOpen={() => {}} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">

        {/* Top Header - Mobile only or Suite navigation */}
        <header className="lg:hidden h-14 shrink-0 glass-ui flex items-center justify-between px-4 z-50">
           <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-sky-600 rounded flex items-center justify-center text-white font-bold text-xs">S</div>
              <span className="font-black text-sm tracking-tight italic">SIMCO.<span className="text-sky-600">MATRIX</span></span>
           </div>
           {!isSuite && (
             <Button variant="ghost" size="sm" onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}>
               {mobileSidebarOpen ? <X size={20} /> : <Menu size={20} />}
             </Button>
           )}
        </header>

        {/* Scrolling Viewport */}
        <main className="flex-1 overflow-y-auto relative no-scrollbar">
          <div className={cn(
            'page-container',
            isSuite && 'max-w-full px-4 lg:px-8'
          )}>
            {children}
          </div>
          {!isSuite && <Footer />}
        </main>
      </div>

      {/* Mobile Navigation Bar */}
      {!isSuite && <MobileNav />}

      {/* Mobile Sidebar Overlay */}
      {!isSuite && mobileSidebarOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
           <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)} />
           <div className="absolute inset-y-0 left-0 w-64 bg-white dark:bg-slate-900 shadow-2xl animate-in slide-in-from-left duration-300">
              <Sidebar isOpen={true} setIsOpen={() => {}} />
           </div>
        </div>
      )}
    </div>
  );
}

export function Section({ title, subtitle, children, actions, icon: Icon, color }: { title: string; subtitle?: string; children: React.ReactNode; actions?: React.ReactNode; icon?: React.ElementType; color?: string }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          {Icon && (
            <div className={`p-1.5 rounded-lg ${color ? `${color.replace('text-', 'bg-')}/10 ${color}` : 'bg-brand-50 dark:bg-brand-900/20 text-brand-500'}`}>
               <Icon size={14} />
            </div>
          )}
          <div>
            <h2 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
               {title}
            </h2>
            {subtitle && <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex items-center gap-1">{actions}</div>}
      </div>
      <div className="animate-in fade-in slide-in-from-bottom-1 duration-300">
        {children}
      </div>
    </section>
  );
}
