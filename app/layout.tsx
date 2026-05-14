import type {Metadata} from 'next';
import './globals.css';
import { Inter, Geist } from 'next/font/google';
import { cn } from "@/lib/utils";
import { StoreProvider } from '@/lib/store';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: 'Retifica Mendonça - Gestão de O.S.',
  description: 'Sistema completo de gerenciamento de ordens de serviço para Retifica Mendonça.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={cn("font-sans antialiased", "font-sans", geist.variable)}>
      <body className="min-h-screen bg-background text-foreground theme-transition">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={true}
          disableTransitionOnChange={false}
          storageKey="retifica-theme"
        >
          <StoreProvider>
            {children}
            <Toaster position="top-right" richColors />
          </StoreProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
