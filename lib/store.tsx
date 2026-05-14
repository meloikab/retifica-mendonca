'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

export type ServiceStatus = 'Na Fila' | 'Em Andamento' | 'Pronto';
export type PaymentStatus = 'Não Pago' | 'Entrada' | 'Pago';
export type PaymentMethod = 'PIX' | 'Dinheiro' | 'Débito' | 'Crédito à Vista' | 'Crédito 2x' | 'Crédito 3x';

export interface ServiceItem {
  id: string;
  name: string;
  value: number;
  quantity: number;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  document: string;
  whatsapp?: string;
  city?: string;
}

export interface Order {
  id: number;
  clientId: string;
  motorModel: string;
  displacement: string;
  serviceStatus: ServiceStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  secondPaymentMethod?: PaymentMethod;
  entryValue?: number;
  balanceValue?: number;
  partsLeft: string[];
  additionalParts: string[];
  services: ServiceItem[];
  discount: number;
  totalValue: number;
  netValue: number;
  finished: boolean;
  deliveryDate?: string;
  arrivalDate?: string;
  observations: string;
  createdAt: string;
}

// ── Conversão snake_case (DB) ↔ camelCase (App) ──

function clientFromDb(row: any): Client {
  return {
    id: row.id,
    name: row.name || '',
    phone: row.phone || '',
    document: row.document || '',
    whatsapp: row.whatsapp || '',
    city: row.city || '',
  };
}

function clientToDb(c: Omit<Client, 'id'> & { id?: string }) {
  return {
    ...(c.id ? { id: c.id } : {}),
    name: c.name,
    phone: c.phone || '',
    document: c.document || '',
    whatsapp: c.whatsapp || '',
    city: c.city || '',
  };
}

function orderFromDb(row: any): Order {
  return {
    id: Number(row.id),
    clientId: row.client_id || '',
    motorModel: row.motor_model || '',
    displacement: row.displacement || '',
    serviceStatus: row.service_status || 'Na Fila',
    paymentStatus: row.payment_status || 'Não Pago',
    paymentMethod: row.payment_method || undefined,
    secondPaymentMethod: row.second_payment_method || undefined,
    entryValue: Number(row.entry_value) || 0,
    balanceValue: Number(row.balance_value) || 0,
    partsLeft: row.parts_left || [],
    additionalParts: row.additional_parts || [],
    services: (row.services || []).map((s: any) => ({
      ...s,
      quantity: s.quantity || 1,
    })),
    discount: Number(row.discount) || 0,
    totalValue: Number(row.total_value) || 0,
    netValue: Number(row.net_value) || 0,
    finished: !!row.finished,
    deliveryDate: row.delivery_date || undefined,
    arrivalDate: row.arrival_date || undefined,
    observations: row.observations || '',
    createdAt: row.created_at || new Date().toISOString(),
  };
}

function orderToDb(o: Omit<Order, 'id' | 'createdAt'> & { id?: number; createdAt?: string }) {
  return {
    ...(o.id != null ? { id: o.id } : {}),
    client_id: o.clientId,
    motor_model: o.motorModel,
    displacement: o.displacement,
    service_status: o.serviceStatus,
    payment_status: o.paymentStatus,
    payment_method: o.paymentMethod || null,
    second_payment_method: o.secondPaymentMethod || null,
    entry_value: o.entryValue || 0,
    balance_value: o.balanceValue || 0,
    parts_left: o.partsLeft || [],
    additional_parts: o.additionalParts || [],
    services: o.services || [],
    discount: o.discount || 0,
    total_value: o.totalValue || 0,
    net_value: o.netValue || 0,
    finished: !!o.finished,
    delivery_date: o.deliveryDate || null,
    arrival_date: o.arrivalDate || null,
    observations: o.observations || '',
    ...(o.createdAt ? { created_at: o.createdAt } : {}),
  };
}

// ── Store Context ──

interface StoreContextType {
  clients: Client[];
  orders: Order[];
  addClient: (client: Omit<Client, 'id'>) => Promise<Client>;
  addOrder: (order: Omit<Order, 'id' | 'createdAt'> & { id?: number }) => Promise<void>;
  updateOrder: (id: number, updates: Partial<Order>) => Promise<void>;
  deleteOrder: (id: number) => Promise<void>;
  isLoaded: boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // ── Carregar dados: Supabase → fallback localStorage ──
  useEffect(() => {
    async function loadData() {
      try {
        const [clientsRes, ordersRes] = await Promise.all([
          supabase.from('clients').select('*'),
          supabase.from('orders').select('*'),
        ]);

        if (clientsRes.error) throw clientsRes.error;
        if (ordersRes.error) throw ordersRes.error;

        const loadedClients = (clientsRes.data || []).map(clientFromDb);
        const loadedOrders = (ordersRes.data || []).map(orderFromDb);

        setClients(loadedClients);
        setOrders(loadedOrders);

        // Sync para localStorage (cache offline)
        localStorage.setItem('retifica_clients', JSON.stringify(loadedClients));
        localStorage.setItem('retifica_orders', JSON.stringify(loadedOrders));
      } catch (err) {
        console.warn('Supabase offline – carregando do cache local:', err);
        toast.warning('Sem conexão com o servidor. Usando dados locais.');

        const savedClients = localStorage.getItem('retifica_clients');
        const savedOrders = localStorage.getItem('retifica_orders');
        if (savedClients) setClients(JSON.parse(savedClients));
        if (savedOrders) {
          const parsed = JSON.parse(savedOrders);
          setOrders(parsed.map((o: any) => ({
            ...o,
            services: o.services?.map((s: any) => ({ ...s, quantity: s.quantity || 1 })) || [],
          })));
        }
      }
      setIsLoaded(true);
    }

    loadData();
  }, []);

  // ── Manter cache local atualizado ──
  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      localStorage.setItem('retifica_clients', JSON.stringify(clients));
      localStorage.setItem('retifica_orders', JSON.stringify(orders));
    }
  }, [clients, orders, isLoaded]);

  // ── CRUD: Clientes ──

  const addClient = async (clientData: Omit<Client, 'id'>): Promise<Client> => {
    const tempId = crypto.randomUUID();
    const newClient: Client = { ...clientData, id: tempId };

    try {
      const { data, error } = await supabase
        .from('clients')
        .insert(clientToDb({ ...clientData, id: tempId }))
        .select()
        .single();

      if (error) throw error;

      const saved = clientFromDb(data);
      setClients((prev) => [...prev, saved]);
      return saved;
    } catch (err) {
      console.error('Erro Supabase (addClient):', err);
      toast.warning('Falha ao salvar no servidor. Salvo localmente.');
      setClients((prev) => [...prev, newClient]);
      return newClient;
    }
  };

  // ── CRUD: Ordens de Serviço ──

  const addOrder = async (orderData: Omit<Order, 'id' | 'createdAt'> & { id?: number }): Promise<void> => {
    let nextId = orderData.id;

    if (!nextId) {
      nextId = orders.length > 0 ? Math.max(...orders.map(o => o.id)) + 1 : 1001;
    } else if (orders.some(o => o.id === nextId)) {
      toast.error(`Número da O.S. #${nextId} já cadastrado`);
      throw new Error(`O.S. #${nextId} já existe`);
    }

    const newOrder: Order = {
      ...orderData,
      id: nextId,
      createdAt: new Date().toISOString(),
    };

    try {
      const { error } = await supabase
        .from('orders')
        .insert(orderToDb(newOrder));

      if (error) throw error;

      setOrders((prev) => [...prev, newOrder]);
      toast.success(`O.S. #${nextId} criada com sucesso!`);
    } catch (err: any) {
      if (err?.code === '23505') {
        toast.error(`Número da O.S. #${nextId} já cadastrado no servidor`);
        throw err;
      }
      console.error('Erro Supabase (addOrder):', err);
      toast.warning('Falha ao salvar no servidor. Salvo localmente.');
      setOrders((prev) => [...prev, newOrder]);
    }
  };

  const updateOrder = async (id: number, updates: Partial<Order>): Promise<void> => {
    // Otimisticamente atualizar o state
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...updates } : o)));

    try {
      const dbUpdates: Record<string, any> = {};
      if (updates.clientId !== undefined) dbUpdates.client_id = updates.clientId;
      if (updates.motorModel !== undefined) dbUpdates.motor_model = updates.motorModel;
      if (updates.displacement !== undefined) dbUpdates.displacement = updates.displacement;
      if (updates.serviceStatus !== undefined) dbUpdates.service_status = updates.serviceStatus;
      if (updates.paymentStatus !== undefined) dbUpdates.payment_status = updates.paymentStatus;
      if (updates.paymentMethod !== undefined) dbUpdates.payment_method = updates.paymentMethod;
      if (updates.secondPaymentMethod !== undefined) dbUpdates.second_payment_method = updates.secondPaymentMethod;
      if (updates.entryValue !== undefined) dbUpdates.entry_value = updates.entryValue;
      if (updates.balanceValue !== undefined) dbUpdates.balance_value = updates.balanceValue;
      if (updates.partsLeft !== undefined) dbUpdates.parts_left = updates.partsLeft;
      if (updates.additionalParts !== undefined) dbUpdates.additional_parts = updates.additionalParts;
      if (updates.services !== undefined) dbUpdates.services = updates.services;
      if (updates.discount !== undefined) dbUpdates.discount = updates.discount;
      if (updates.totalValue !== undefined) dbUpdates.total_value = updates.totalValue;
      if (updates.netValue !== undefined) dbUpdates.net_value = updates.netValue;
      if (updates.finished !== undefined) dbUpdates.finished = updates.finished;
      if (updates.deliveryDate !== undefined) dbUpdates.delivery_date = updates.deliveryDate;
      if (updates.arrivalDate !== undefined) dbUpdates.arrival_date = updates.arrivalDate;
      if (updates.observations !== undefined) dbUpdates.observations = updates.observations;

      const { error } = await supabase
        .from('orders')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;
      toast.info(`O.S. #${id} atualizada.`);
    } catch (err) {
      console.error('Erro Supabase (updateOrder):', err);
      toast.warning(`O.S. #${id} atualizada localmente (falha no servidor).`);
    }
  };

  const deleteOrder = async (id: number): Promise<void> => {
    setOrders((prev) => prev.filter((o) => o.id !== id));

    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.error(`O.S. #${id} excluída.`);
    } catch (err) {
      console.error('Erro Supabase (deleteOrder):', err);
      toast.warning(`O.S. #${id} excluída localmente (falha no servidor).`);
    }
  };

  return (
    <StoreContext.Provider value={{ clients, orders, addClient, addOrder, updateOrder, deleteOrder, isLoaded }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
