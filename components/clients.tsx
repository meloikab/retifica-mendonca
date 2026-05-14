'use client';

import React, { useState } from 'react';
import { useStore, Client, Order } from '@/lib/store';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Search, 
  User, 
  Phone, 
  CreditCard, 
  ChevronRight,
  TrendingUp,
  History as HistoryIcon,
  Plus,
  MapPin,
  MessageCircle
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export function Clients() {
  const { clients, orders, addClient } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  
  // New Client Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDocument, setNewDocument] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newWhatsapp, setNewWhatsapp] = useState('');
  const [newCity, setNewCity] = useState('');

  // Masks
  const maskCPFCNPJ = (v: string) => {
    v = v.replace(/\D/g, "");
    if (v.length <= 11) {
      return v
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    } else {
      return v
        .replace(/^(\d{2})(\d)/, "$1.$2")
        .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1/$2")
        .replace(/(\d{4})(\d)/, "$1-$2");
    }
  };

  const maskPhone = (v: string) => {
    v = v.replace(/\D/g, "");
    if (v.length <= 10) {
      return v
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{4})(\d)/, "$1-$2");
    } else {
      return v
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2");
    }
  };

  const cleanNumeric = (v: string) => v.replace(/\D/g, "").slice(0, 14);
  const cleanPhone = (v: string) => v.replace(/\D/g, "").slice(0, 11);

  const resetForm = () => {
    setNewName('');
    setNewDocument('');
    setNewPhone('');
    setNewWhatsapp('');
    setNewCity('');
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newName) {
      toast.error('O nome do cliente é obrigatório.');
      return;
    }

    if (newDocument && clients.some(c => c.document === newDocument)) {
      toast.error('Este CPF/CNPJ já está cadastrado.');
      return;
    }

    const client = await addClient({
      name: newName,
      document: newDocument,
      phone: newPhone,
      whatsapp: newWhatsapp,
      city: newCity
    });

    toast.success('Cliente cadastrado com sucesso!');
    setIsModalOpen(false);
    setSelectedClientId(client.id);
    resetForm();
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.document.includes(searchTerm)
  );

  const selectedClient = clients.find(c => c.id === selectedClientId);
  const clientOrders = orders.filter(o => o.clientId === selectedClientId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-120px)]">
      <div className="lg:col-span-1 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Base de Clientes</h2>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{clients.length} Total</Badge>
            <Dialog open={isModalOpen} onOpenChange={(open) => {
              setIsModalOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger render={
                <Button size="sm" className="font-bold gap-2">
                  <Plus className="w-4 h-4" />
                  Adicionar Cliente
                </Button>
              } />
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black flex items-center gap-2">
                    <User className="w-6 h-6 text-primary" />
                    Novo Cliente
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddClient} className="space-y-4 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="name">Nome completo</Label>
                      <Input 
                        id="name" 
                        placeholder="Nome completo" 
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="document">CPF/CNPJ (Opcional)</Label>
                      <Input 
                        id="document" 
                        placeholder="000.000.000-00" 
                        value={maskCPFCNPJ(newDocument)}
                        onChange={e => setNewDocument(cleanNumeric(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone (Opcional)</Label>
                      <Input 
                        id="phone" 
                        placeholder="(00) 00000-0000" 
                        value={maskPhone(newPhone)}
                        onChange={e => setNewPhone(cleanPhone(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp">WhatsApp (Opcional)</Label>
                      <Input 
                        id="whatsapp" 
                        placeholder="(00) 00000-0000" 
                        value={maskPhone(newWhatsapp)}
                        onChange={e => setNewWhatsapp(cleanPhone(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">Cidade (Opcional)</Label>
                      <Input 
                        id="city" 
                        placeholder="Ex: Curitiba - PR" 
                        value={newCity}
                        onChange={e => setNewCity(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter className="pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" className="font-bold">
                      Salvar Cliente
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar nome ou CPF/CNPJ..." 
            className="pl-8"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <ScrollArea className="flex-1 rounded-xl border bg-card shadow-inner">
          <div className="divide-y">
            {filteredClients.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground italic">
                Nenhum cliente encontrado.
              </div>
            ) : (
              filteredClients.map((client) => (
                <button
                  key={client.id}
                  onClick={() => setSelectedClientId(client.id)}
                  className={cn(
                    "w-full text-left p-4 hover:bg-primary/5 transition-colors group flex items-center justify-between",
                    selectedClientId === client.id && "bg-primary/10 border-l-4 border-primary"
                  )}
                >
                    <div className="space-y-1">
                      <div className="font-bold group-hover:text-primary transition-colors">{client.name}</div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
                        {client.document && (
                          <span className="flex items-center gap-1"><CreditCard className="w-3 h-3" /> {maskCPFCNPJ(client.document)}</span>
                        )}
                        {client.phone && (
                          <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {maskPhone(client.phone)}</span>
                        )}
                      </div>
                    </div>
                  <ChevronRight className={cn("w-4 h-4 transition-transform", selectedClientId === client.id ? "rotate-90 text-primary" : "text-muted-foreground")} />
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      <div className="lg:col-span-2 space-y-6 overflow-y-auto pr-4 custom-scrollbar">
        {!selectedClient ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-3xl p-12 text-center bg-muted/10">
            <User className="w-16 h-16 opacity-20 mb-4" />
            <h3 className="text-xl font-semibold">Nenhum cliente selecionado</h3>
            <p className="max-w-xs">Selecione um cliente da lista ao lado para ver seus detalhes e histórico de ordens de serviço.</p>
          </div>
        ) : (
          <>
            <Card className="shadow-lg border-2 border-primary/10">
              <CardHeader className="bg-primary/5 rounded-t-xl">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground text-3xl font-bold">
                      {selectedClient.name.charAt(0)}
                    </div>
                    <div>
                      <CardTitle className="text-2xl">{selectedClient.name}</CardTitle>
                      <CardDescription className="flex flex-wrap items-center gap-4 mt-2">
                        {selectedClient.document && (
                          <span className="flex items-center gap-1 font-mono text-xs border rounded px-1.5 py-0.5 bg-background"><CreditCard className="w-3 h-3 text-primary" /> {maskCPFCNPJ(selectedClient.document)}</span>
                        )}
                        {selectedClient.phone && (
                          <span className="flex items-center gap-1 text-xs"><Phone className="w-3 h-3 text-primary" /> {maskPhone(selectedClient.phone)}</span>
                        )}
                        {selectedClient.whatsapp && (
                          <span className="flex items-center gap-1 text-xs"><MessageCircle className="w-3 h-3 text-green-600" /> {maskPhone(selectedClient.whatsapp)}</span>
                        )}
                        {selectedClient.city && (
                          <span className="flex items-center gap-1 text-xs"><MapPin className="w-3 h-3 text-primary" /> {selectedClient.city}</span>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 grid grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-muted/40 border">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Total O.S.</p>
                  <p className="text-2xl font-bold flex items-center gap-2">
                    <HistoryIcon className="w-5 h-5 text-primary" />
                    {clientOrders.length}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-muted/40 border">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Investimento Total</p>
                  <p className="text-2xl font-bold flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    {clientOrders.reduce((acc, o) => acc + o.netValue, 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-orange-50/50 border border-orange-100 dark:bg-orange-950/30 dark:border-orange-800/50">
                  <p className="text-[10px] uppercase font-bold text-orange-600 dark:text-orange-400 mb-1">O.S. Ativas</p>
                  <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                    {clientOrders.filter(o => !o.finished).length}
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Histórico de Ordens de Serviço
                </h3>
              </div>
              
              <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-[100px] font-bold">Nº O.S.</TableHead>
                      <TableHead className="font-bold">Motor</TableHead>
                      <TableHead className="font-bold">Data</TableHead>
                      <TableHead className="font-bold">Status</TableHead>
                      <TableHead className="font-bold text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic">
                          Este cliente ainda não possui ordens de serviço.
                        </TableCell>
                      </TableRow>
                    ) : (
                      clientOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono font-bold">#{order.id}</TableCell>
                          <TableCell className="text-sm">
                            {order.motorModel} <span className="text-muted-foreground opacity-70">({order.displacement})</span>
                          </TableCell>
                          <TableCell className="text-sm">
                            {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell>
                            <Badge variant={order.finished ? "outline" : "default" } className={order.finished ? "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950/30" : ""}>
                              {order.finished ? 'Finalizada' : order.serviceStatus}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono font-semibold">
                            {order.netValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
