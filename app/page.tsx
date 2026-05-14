'use client';

import React, { useState } from 'react';
import { Sidebar, View } from '@/components/sidebar';
import { Dashboard } from '@/components/dashboard';
import { Clients } from '@/components/clients';
import { History } from '@/components/history';
import { OSForm } from '@/components/os-form';
import { useStore, Order } from '@/lib/store';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const { isLoaded } = useStore();

  if (!isLoaded) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center gap-4 bg-background">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-muted-foreground font-medium animate-pulse">Carregando Sistema Retifica Mendonça...</p>
      </div>
    );
  }

  const handleEditOrder = (order: Order) => {
    setEditingOrder(order);
    setIsReadOnly(false);
    setCurrentView('new-os');
  };

  const handleViewOrder = (order: Order) => {
    setEditingOrder(order);
    setIsReadOnly(true);
    setCurrentView('new-os');
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onEdit={handleEditOrder} onView={handleViewOrder} />;
      case 'clients':
        return <Clients />;
      case 'history':
        return <History />;
      case 'new-os':
        return (
          <OSForm
            order={editingOrder || undefined}
            readOnly={isReadOnly}
            onComplete={() => {
              setEditingOrder(null);
              setIsReadOnly(false);
              setCurrentView('dashboard');
            }}
          />
        );
      default:
        return <Dashboard onEdit={handleEditOrder} onView={handleViewOrder} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        currentView={currentView}
        onViewChange={(view) => {
          setEditingOrder(null);
          setIsReadOnly(false);
          setCurrentView(view);
        }}
      />

      <main className="flex-1 p-8 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

//sanduiche