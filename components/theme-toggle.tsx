'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className={cn("h-8 w-full rounded-lg bg-muted/50 animate-pulse", className)} />
    );
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <Button
      variant="ghost"
      className={cn(
        "w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg transition-all duration-200 group text-sm font-medium",
        "text-muted-foreground hover:bg-muted hover:text-foreground",
        className
      )}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      <div className="flex items-center gap-3">
        <div className="relative w-5 h-5 flex items-center justify-center">
          <Sun
            className={cn(
              "w-[18px] h-[18px] absolute transition-all duration-300",
              isDark ? "opacity-0 rotate-90 scale-0" : "opacity-100 rotate-0 scale-100"
            )}
          />
          <Moon
            className={cn(
              "w-[18px] h-[18px] absolute transition-all duration-300",
              isDark ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-0"
            )}
          />
        </div>
        <span>{isDark ? 'Modo Escuro' : 'Modo Claro'}</span>
      </div>
      <kbd className="hidden md:inline-flex h-5 items-center gap-1 rounded border bg-muted/50 px-1.5 font-mono text-[10px] font-medium text-muted-foreground/70">
        {isDark ? <Moon className="w-3 h-3" /> : <Sun className="w-3 h-3" />}
      </kbd>
    </Button>
  );
}
