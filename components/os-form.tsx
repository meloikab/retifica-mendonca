'use client';

import React, { useState } from 'react';
import { useStore, ServiceItem, Order, ServiceStatus, PaymentStatus, PaymentMethod } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  Trash2, 
  UserPlus, 
  Users,
  Calculator,
  Wrench,
  Package,
  Calendar as CalendarIcon,
  BadgeDollarSign,
  Search,
  Check,
  ChevronsUpDown,
  Hash,
  Printer
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { ServiceCatalog } from '@/components/service-catalog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function OSForm({ 
  onComplete, 
  order,
  readOnly = false
}: { 
  onComplete?: () => void, 
  order?: Order,
  readOnly?: boolean
}) {
  const { clients, addClient, addOrder, updateOrder, orders } = useStore();
  
  // Form State
  const [osNumber, setOsNumber] = useState(order?.id?.toString() || '');
  const [clientId, setClientId] = useState(order?.clientId || '');
  const [motorModels, setMotorModels] = useState<string[]>(
    order?.motorModel ? order.motorModel.split(', ') : []
  );
  const [displacement, setDisplacement] = useState(order?.displacement || '');
  const [partsLeft, setPartsLeft] = useState<string[]>(order?.partsLeft || []);
  const [additionalParts, setAdditionalParts] = useState<string[]>(order?.additionalParts || []);
  const [services, setServices] = useState<ServiceItem[]>(order?.services || []);
  const [discount, setDiscount] = useState(order?.discount || 0);
  const [observations, setObservations] = useState(order?.observations || '');
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus>(order?.serviceStatus || 'Na Fila');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(order?.paymentStatus || 'Não Pago');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>(order?.paymentMethod || '');
  const [secondPaymentMethod, setSecondPaymentMethod] = useState<PaymentMethod | ''>(order?.secondPaymentMethod || '');
  const [entryValue, setEntryValue] = useState<number>(order?.entryValue || 0);
  const [deliveryDate, setDeliveryDate] = useState(order?.deliveryDate || '');
  const [arrivalDate, setArrivalDate] = useState(order?.arrivalDate || new Date().toISOString().split('T')[0]);
  const [finished, setFinished] = useState(order?.finished || false);

  // Custom Options State
  const [customMotor, setCustomMotor] = useState('');
  const [availableMotors, setAvailableMotors] = useState(['Power', 'Fire', 'AP', 'CHT', 'Sevel']);
  const [customDisplacement, setCustomDisplacement] = useState('');
  const initialDisplacements = ['1.0', '1.4', '1.6', '1.8', '2.0', '2.8', '3.0'];
  if (order?.displacement && !initialDisplacements.includes(order.displacement)) {
    initialDisplacements.push(order.displacement);
  }

  const [availableDisplacements, setAvailableDisplacements] = useState(
    initialDisplacements.sort((a, b) => parseFloat(a) - parseFloat(b))
  );


  // Client Modal State
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isClientSelectorOpen, setIsClientSelectorOpen] = useState(false);
  const [isDisplacementOpen, setIsDisplacementOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientDoc, setNewClientDoc] = useState('');

  const handleAddClient = async () => {
    if (!newClientName || !newClientPhone || !newClientDoc) {
      toast.error('Preencha todos os campos do cliente.');
      return;
    }
    const client = await addClient({ 
      name: newClientName, 
      phone: newClientPhone, 
      document: newClientDoc 
    });
    setClientId(client.id);
    setIsClientModalOpen(false);
    setNewClientName('');
    setNewClientPhone('');
    setNewClientDoc('');
    toast.success('Cliente cadastrado com sucesso!');
  };

  const handleAddService = (name: string) => {
    const newService: ServiceItem = {
      id: crypto.randomUUID(),
      name,
      value: 0,
      quantity: 1,
    };
    setServices([...services, newService]);
  };

  const handleRemoveService = (id: string) => {
    setServices(services.filter(s => s.id !== id));
  };

  const updateServiceField = <K extends keyof ServiceItem>(id: string, field: K, value: ServiceItem[K]) => {
    setServices(services.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const totalValue = services.reduce((acc, curr) => acc + (curr.value * curr.quantity), 0);
  const netValue = totalValue - discount;
  const balanceValue = Math.max(0, netValue - entryValue);

  const defaultAdditionalParts = ['Mancais do bloco', 'Tampa de cabeçote', 'Jetcooler', 'Comando de válvula'];
  const initialAdditionalParts = [...defaultAdditionalParts];
  order?.additionalParts?.forEach(p => {
    if (!initialAdditionalParts.includes(p)) {
      initialAdditionalParts.push(p);
    }
  });

  const [availableAdditionalParts, setAvailableAdditionalParts] = useState(initialAdditionalParts);
  const [newAdditionalPartName, setNewAdditionalPartName] = useState('');

  const handleAddAdditionalPart = (e: React.MouseEvent) => {
    e.preventDefault();
    const name = newAdditionalPartName.trim();
    if (!name) return;
    
    if (!availableAdditionalParts.includes(name)) {
      setAvailableAdditionalParts([...availableAdditionalParts, name]);
      setAdditionalParts([...additionalParts, name]);
      setNewAdditionalPartName('');
      toast.success(`Peça "${name}" adicionada.`);
    } else {
      if (!additionalParts.includes(name)) {
        setAdditionalParts([...additionalParts, name]);
        setNewAdditionalPartName('');
      } else {
        toast.error('Esta peça já está na lista.');
      }
    }
  };

  const handleRemoveAvailableAdditionalPart = (part: string) => {
    if (defaultAdditionalParts.includes(part)) return;
    setAvailableAdditionalParts(prev => prev.filter(p => p !== part));
    setAdditionalParts(prev => prev.filter(p => p !== part));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;

    if (!clientId) {
      toast.error('Selecione um cliente.');
      return;
    }
    if (motorModels.length === 0) {
      toast.error('Selecione ao menos um modelo de motor.');
      return;
    }

    const orderData = {
      clientId,
      motorModel: motorModels.join(', '),
      displacement,
      serviceStatus,
      paymentStatus,
      paymentMethod: paymentMethod || undefined,
      secondPaymentMethod: secondPaymentMethod || undefined,
      entryValue,
      balanceValue,
      partsLeft,
      additionalParts,
      services,
      discount,
      totalValue,
      netValue,
      finished,
      deliveryDate,
      arrivalDate,
      observations,
    };

    try {
      if (order) {
        await updateOrder(order.id, orderData);
      } else {
        await addOrder({
          ...orderData,
          id: osNumber ? parseInt(osNumber) : undefined
        });
      }
      if (onComplete) onComplete();
    } catch (err) {
      // Error handled by store toast
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-6 max-w-5xl mx-auto pb-12 print:p-0 print:m-0 print:max-w-none", readOnly && "opacity-100")}>
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {readOnly ? "Visualizar O.S." : order ? "Editar Ordem de Serviço" : "Nova Ordem de Serviço"}
          </h2>
          <p className="text-muted-foreground">
            {readOnly ? `Detalhes da O.S. #${order?.id}` : order ? `Alterando dados da O.S. #${order.id}` : "Preencha os detalhes para gerar uma nova O.S."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {readOnly && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => window.print()}
              className="flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Imprimir O.S.
            </Button>
          )}
          {!readOnly && (
            <Button size="lg" type="submit" className="shadow-lg">
              {order ? "Salvar Alterações" : "Gerar Ordem de Serviço"}
            </Button>
          )}
        </div>
      </div>

      <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-6", readOnly && "pointer-events-none")}>
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Hash className="w-5 h-5 text-primary" />
                Número da O.S.
              </div>
              {!order && !readOnly && (
                <Button 
                  type="button"
                  variant="outline" 
                  size="sm" 
                  onClick={(e) => {
                    e.preventDefault();
                    const next = orders.length > 0 ? Math.max(...orders.map(o => o.id)) + 1 : 1001;
                    setOsNumber(next.toString());
                  }}
                  className="h-8 text-xs font-bold"
                >
                  Gerar automático
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative group max-w-[200px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary font-mono font-bold text-lg">#</span>
              <Input 
                type="number"
                value={osNumber}
                onChange={e => setOsNumber(e.target.value)}
                className="pl-8 font-mono text-xl font-black h-12"
                placeholder="Ex: 1001"
                disabled={!!order || readOnly}
              />
            </div>
            {!order && !readOnly && (
               <p className="text-[10px] text-muted-foreground mt-2 italic px-1">
                 Se deixar vazio, um número será gerado automaticamente.
               </p>
            )}
          </CardContent>
        </Card>

        <div className="hidden md:block" />

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Informações do Cliente e Motor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-end gap-3">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="client">Cliente</Label>
                  <Popover open={isClientSelectorOpen} onOpenChange={setIsClientSelectorOpen}>
                    <PopoverTrigger render={<Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={isClientSelectorOpen}
                      className="w-full justify-between font-normal"
                    />}>
                      {clientId
                        ? clients.find((c) => c.id === clientId)?.name
                        : "Selecione um cliente..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Pesquisar por nome, telefone ou documento..." />
                        <CommandList>
                          <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                          <CommandGroup>
                            {clients.map((client) => (
                              <CommandItem
                                key={client.id}
                                value={`${client.name} ${client.phone} ${client.document}`}
                                onSelect={() => {
                                  setClientId(client.id);
                                  setIsClientSelectorOpen(false);
                                }}
                                className="flex flex-col items-start gap-0.5 py-3"
                              >
                                <div className="flex items-center justify-between w-full">
                                  <span className="font-bold">{client.name}</span>
                                  {clientId === client.id && <Check className="h-4 w-4 text-primary" />}
                                </div>
                                <div className="flex gap-4 text-xs text-muted-foreground font-mono">
                                  <span>DOC: {client.document}</span>
                                  <span>TEL: {client.phone}</span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <Dialog open={isClientModalOpen} onOpenChange={setIsClientModalOpen}>
                  <DialogTrigger render={<Button variant="outline" className="flex items-center gap-2" />}>
                    <UserPlus className="w-4 h-4" />
                    Novo Cliente
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Cadastrar Novo Cliente</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Nome Completo / Razão Social</Label>
                        <Input value={newClientName} onChange={e => setNewClientName(e.target.value)} placeholder="Ex: João da Silva" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Telefone</Label>
                          <Input value={newClientPhone} onChange={e => setNewClientPhone(e.target.value)} placeholder="(11) 99999-9999" />
                        </div>
                        <div className="space-y-2">
                          <Label>CPF/CNPJ</Label>
                          <Input value={newClientDoc} onChange={e => setNewClientDoc(e.target.value)} placeholder="000.000.000-00" />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleAddClient}>Salvar Cliente</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-4">
                {/* Tags selecionadas */}
                <div className="space-y-2">
                  <Label>Modelos do Motor</Label>
                  <div className="flex flex-wrap gap-2.5 min-h-[36px]">
                    {motorModels.map(motor => (
                      <Badge key={motor} variant="secondary" className="h-9 pl-3.5 pr-2 py-0 flex items-center gap-2.5 rounded-lg text-sm font-semibold group hover:bg-muted/80 transition-colors">
                        {motor}
                        <button
                          type="button"
                          onClick={() => setMotorModels(motorModels.filter(m => m !== motor))}
                          className="w-5 h-5 flex items-center justify-center rounded-md hover:bg-destructive/15 hover:text-destructive transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5 rotate-45" />
                        </button>
                      </Badge>
                    ))}
                    {motorModels.length === 0 && (
                      <span className="text-xs text-muted-foreground italic self-center">Nenhum modelo selecionado</span>
                    )}
                  </div>
                </div>

                {/* Seletores lado a lado */}
                <div className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-[7] w-full">
                    <Label className="mb-2 block text-xs text-muted-foreground">Selecionar Motores</Label>

                  <Popover>
                    <PopoverTrigger render={<Button
                      variant="outline"
                      className="w-full justify-between font-normal h-10"
                    />}>
                      Selecionar Motores...
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="start">
                      <Command>
                        <CommandInput 
                          placeholder="Buscar ou adicionar motor..." 
                          value={customMotor}
                          onValueChange={setCustomMotor}
                        />
                        <CommandList>
                          <CommandEmpty className="py-2 px-4 text-sm flex flex-col gap-2">
                            <span className="text-muted-foreground italic">Nenhum motor encontrado.</span>
                            {customMotor && (
                              <Button 
                                size="sm" 
                                variant="secondary" 
                                className="w-full text-xs"
                                onClick={(e) => {
                                  e.preventDefault();
                                  if (customMotor && !availableMotors.includes(customMotor)) {
                                    setAvailableMotors(prev => [...prev, customMotor]);
                                    setMotorModels(prev => [...prev, customMotor]);
                                    setCustomMotor('');
                                  }
                                }}
                              >
                                <Plus className="w-3 h-3 mr-1" /> Adicionar "{customMotor}"
                              </Button>
                            )}
                          </CommandEmpty>
                          <CommandGroup>
                            {availableMotors.map((motor) => (
                              <CommandItem
                                key={motor}
                                onSelect={() => {
                                  if (motorModels.includes(motor)) {
                                    setMotorModels(motorModels.filter(m => m !== motor));
                                  } else {
                                    setMotorModels([...motorModels, motor]);
                                  }
                                }}
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                <Checkbox 
                                  checked={motorModels.includes(motor)}
                                  className="pointer-events-none"
                                />
                                <span className={cn(
                                  "flex-1",
                                  motorModels.includes(motor) ? "font-bold text-primary" : ""
                                )}>
                                  {motor}
                                </span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  </div>

                  <div className="flex-[3] w-full">
                    <Label className="mb-2 block text-xs text-muted-foreground">Cilindrada</Label>
                  <Popover open={isDisplacementOpen} onOpenChange={setIsDisplacementOpen}>
                    <PopoverTrigger render={<Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-full justify-between font-normal h-10 px-3",
                          !displacement && "text-muted-foreground"
                        )}
                      />}>
                        {displacement ? displacement : "Selecionar cilindrada"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0" align="start">
                      <Command>
                        <CommandInput 
                          placeholder="Pesquisar..." 
                          value={customDisplacement}
                          onValueChange={setCustomDisplacement}
                        />
                        <CommandList>
                          {customDisplacement && !availableDisplacements.includes(customDisplacement) && (
                            <CommandGroup>
                              <CommandItem
                                value={customDisplacement}
                                onSelect={() => {
                                  if (customDisplacement && !availableDisplacements.includes(customDisplacement)) {
                                    setAvailableDisplacements(prev => [...prev, customDisplacement].sort((a, b) => parseFloat(a) - parseFloat(b)));
                                    setDisplacement(customDisplacement);
                                    setCustomDisplacement('');
                                    setIsDisplacementOpen(false);
                                  }
                                }}
                                className="flex items-center gap-2 cursor-pointer text-primary font-bold border-b mb-1"
                              >
                                <Plus className="w-4 h-4" /> Adicionar "{customDisplacement}"
                              </CommandItem>
                            </CommandGroup>
                          )}
                          <CommandEmpty className="py-6 text-center text-sm">
                            <p className="text-muted-foreground italic mb-2">Cilindrada não encontrada.</p>
                          </CommandEmpty>
                          <CommandGroup heading="Disponíveis">
                            {availableDisplacements.map((c) => (
                              <CommandItem
                                key={c}
                                value={c}
                                onSelect={() => {
                                  setDisplacement(c);
                                  setCustomDisplacement('');
                                  setIsDisplacementOpen(false);
                                }}
                                className="flex items-center justify-between cursor-pointer"
                              >
                                {c}
                                {displacement === c && <Check className="h-4 w-4 text-primary" />}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarIcon className="w-4 h-4 text-primary" />
              Status e Entrega
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Status do Serviço</Label>
              <Select value={serviceStatus} onValueChange={(v) => setServiceStatus((v as ServiceStatus) || 'Na Fila')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Na Fila">Na Fila</SelectItem>
                  <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                  <SelectItem value="Pronto">Pronto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Data de Chegada</Label>
              <Input type="date" value={arrivalDate} onChange={e => setArrivalDate(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Data Prevista de Entrega</Label>
              <Input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} />
            </div>

            <div className="pt-4 border-t space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="finished" 
                  checked={finished}
                  onCheckedChange={(checked) => setFinished(!!checked)}
                />
                <Label htmlFor="finished" className="font-bold text-primary cursor-pointer">
                  Serviço Finalizado e Entregue
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Materiais e Peças
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <Label className="text-lg font-semibold">Material Deixado (conferência)</Label>
              <div className="grid grid-cols-2 gap-4">
                {['Bloco', 'Cabeçote', 'Eixo', 'Pistões'].map(part => (
                  <div 
                    key={part} 
                    className={cn(
                      "flex items-center space-x-3 p-3 rounded-lg border transition-all cursor-pointer",
                      partsLeft.includes(part) ? "bg-primary/10 border-primary shadow-sm" : "bg-muted/50 border-transparent hover:border-muted-foreground/30"
                    )}
                    onClick={() => {
                      if (partsLeft.includes(part)) setPartsLeft(partsLeft.filter(p => p !== part));
                      else setPartsLeft([...partsLeft, part]);
                    }}
                  >
                    <Checkbox id={`check-${part}`} checked={partsLeft.includes(part)} readOnly />
                    <Label className="font-bold cursor-pointer">{part}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold">Peças Adicionais</Label>
                {!readOnly && (
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Digite uma nova peça..." 
                      value={newAdditionalPartName}
                      onChange={e => setNewAdditionalPartName(e.target.value)}
                      className="h-8 text-xs w-48"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddAdditionalPart(e as any);
                        }
                      }}
                    />
                    <Button 
                      onClick={handleAddAdditionalPart} 
                      size="sm" 
                      className="h-8 px-2 text-xs"
                      type="button"
                    >
                      <Plus className="w-3 h-3 mr-1" /> Adicionar
                    </Button>
                  </div>
                )}
              </div>
               
              <div className="grid grid-cols-2 gap-3">
                {availableAdditionalParts.map(part => (
                  <div key={part} className="group flex items-center justify-between bg-muted/20 hover:bg-muted/40 p-2 rounded-md border border-transparent hover:border-muted-foreground/20 transition-all">
                    <div className="flex items-center space-x-2 flex-1">
                      <Checkbox 
                        id={`extra-${part}`} 
                        checked={additionalParts.includes(part)}
                        onCheckedChange={(checked) => {
                          if (checked) setAdditionalParts([...additionalParts, part]);
                          else setAdditionalParts(additionalParts.filter(p => p !== part));
                        }}
                      />
                      <label htmlFor={`extra-${part}`} className="text-sm font-medium cursor-pointer flex-1">
                        {part}
                      </label>
                    </div>
                    {!defaultAdditionalParts.includes(part) && !readOnly && (
                      <button
                        type="button"
                        onClick={() => handleRemoveAvailableAdditionalPart(part)}
                        className="text-destructive p-1 rounded-full hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {availableAdditionalParts.length === 0 && (
                <p className="text-xs text-muted-foreground italic text-center py-4">Nenhuma peça cadastrada.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-primary" />
              Catálogo de Serviços
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ServiceCatalog
              selectedServices={services}
              onAddService={(svc) => handleAddService(svc.name)}
              onRemoveService={handleRemoveService}
              onUpdateService={(id, updates) => {
                Object.entries(updates).forEach(([key, value]) => {
                  updateServiceField(id, key as any, value);
                });
              }}
              readOnly={readOnly}
            />
          </CardContent>
        </Card>

        <div className="bg-[var(--fin-bg)] text-[var(--fin-text)] rounded-[24px] p-8 shadow-2xl flex flex-col gap-8 border-[var(--fin-border)] relative overflow-hidden h-full min-h-[500px]">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--fin-accent)]/10 blur-[80px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/5 blur-[60px] rounded-full pointer-events-none" />
          
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--fin-accent)]/20 flex items-center justify-center">
              <Calculator className="w-4 h-4 text-[var(--fin-accent)]" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--fin-text)]/90">Resumo Financeiro</h3>
          </div>

          <div className="flex justify-between items-center bg-[var(--fin-overlay)] p-4 rounded-2xl border-[var(--fin-border)]">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--fin-muted)] font-bold">Subtotal</span>
              <p className="text-xs text-[var(--fin-muted)]/60">Somatória de Serviços</p>
            </div>
            <div className="bg-[var(--fin-overlay)] border-[var(--fin-border)] px-4 py-2 rounded-xl shadow-inner">
              <span className="font-mono text-lg font-bold text-[var(--fin-text)]">
                {totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
          </div>

          <div className="space-y-6 flex-1">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-[var(--fin-muted)] text-[10px] font-bold uppercase tracking-[0.15em]">Desconto Manual</Label>
                <div className="h-px flex-1 bg-[var(--fin-border)] mx-4" />
                <BadgeDollarSign className="w-4 h-4 text-[var(--fin-accent)]/60" />
              </div>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--fin-accent)] text-sm font-mono font-bold">R$</span>
                <Input 
                  type="number" 
                  value={discount} 
                  onChange={e => setDiscount(Number(e.target.value))}
                  className="bg-[var(--fin-input-bg)] border-[var(--fin-input-border)] text-[var(--fin-text)] pl-11 font-mono focus-visible:ring-[var(--fin-accent)]/40 h-12 rounded-xl transition-all hover:bg-[var(--fin-input-bg)]/80"
                  placeholder="0,00"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-[var(--fin-muted)] text-[10px] font-bold uppercase tracking-[0.15em]">Status do Pagamento</Label>
              <Select value={paymentStatus} onValueChange={(v) => {
                const status = (v as PaymentStatus) || 'Não Pago';
                setPaymentStatus(status);
                if (status === 'Não Pago') {
                  setPaymentMethod('');
                  setSecondPaymentMethod('');
                  setEntryValue(0);
                } else if (status === 'Pago') {
                  setEntryValue(netValue);
                  setSecondPaymentMethod('');
                } else if (status === 'Entrada') {
                  if (entryValue === 0) setEntryValue(netValue / 2);
                }
              }}>
                <SelectTrigger className="bg-[var(--fin-input-bg)] border-[var(--fin-input-border)] text-[var(--fin-text)] h-12 rounded-xl focus:ring-[var(--fin-accent)]/40 hover:bg-[var(--fin-input-bg)]/80 transition-all">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[var(--fin-bg)] border-[var(--fin-border)] text-[var(--fin-text)]">
                  <SelectItem value="Não Pago">Não Pago</SelectItem>
                  <SelectItem value="Entrada">Entrada (Simulando Parcial)</SelectItem>
                  <SelectItem value="Pago">Pago (Quitado)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(paymentStatus === 'Pago' || paymentStatus === 'Entrada') && (
              <div className="space-y-5 animate-in fade-in slide-in-from-top-2 duration-500">
                <div className="bg-[var(--fin-overlay)] border-[var(--fin-border)] rounded-2xl p-5 space-y-4 relative overflow-hidden transition-all hover:border-[var(--fin-accent)]/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-[var(--fin-accent)]" />
                       <span className="text-[10px] uppercase tracking-widest text-[var(--fin-muted)] font-bold">Lançamento 01</span>
                    </div>
                    {paymentStatus === 'Pago' ? (
                       <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 text-[9px] font-black tracking-tighter">TOTAL QUITADO</Badge>
                    ) : (
                       <Badge variant="outline" className="bg-[var(--fin-accent)]/10 text-[var(--fin-accent)] border-[var(--fin-accent)]/20 text-[9px] font-black tracking-tighter">VALOR DE ENTRADA</Badge>
                    )}
                  </div>
                   
                  <div className="grid grid-cols-1 gap-3">
                    <div className="relative group">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--fin-accent)] text-sm font-mono font-bold">R$</span>
                      <Input 
                        type="number" 
                        value={entryValue} 
                        onChange={e => {
                          const val = Number(e.target.value);
                          setEntryValue(val);
                          if (val >= netValue && netValue > 0) {
                            setPaymentStatus('Pago');
                          } else if (val > 0) {
                            setPaymentStatus('Entrada');
                          } else {
                            setPaymentStatus('Não Pago');
                          }
                        }}
                        className="bg-[var(--fin-input-bg)] border-[var(--fin-input-border)] text-[var(--fin-text)] pl-11 font-mono h-12 rounded-xl focus:ring-[var(--fin-accent)]/40 transition-all"
                        placeholder="0,00"
                      />
                    </div>
                    
                    <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod((v as PaymentMethod) || '')}>
                      <SelectTrigger className="bg-[var(--fin-input-bg)] border-[var(--fin-input-border)] text-[var(--fin-text)] h-12 rounded-xl hover:bg-[var(--fin-input-bg)]/80 transition-all">
                        <SelectValue placeholder="Forma de Pagamento" />
                      </SelectTrigger>
                      <SelectContent className="bg-[var(--fin-bg)] border-[var(--fin-border)] text-[var(--fin-text)]">
                        {['PIX', 'Dinheiro', 'Débito', 'Crédito à Vista', 'Crédito 2x', 'Crédito 3x'].map(m => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {balanceValue > 0 && paymentStatus === 'Entrada' && (
                  <div className="bg-[var(--fin-overlay)] border-[var(--fin-border)] border-dashed rounded-2xl p-5 space-y-4 animate-in zoom-in-95 duration-500 hover:border-[var(--fin-border)] transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                         <span className="text-[10px] uppercase tracking-widest text-[var(--fin-muted)] font-bold">Saldo a Pagar</span>
                      </div>
                      <div className="bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                        <span className="font-mono text-xs font-black text-blue-400">
                          {balanceValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <Select value={secondPaymentMethod} onValueChange={(v) => setSecondPaymentMethod((v as PaymentMethod) || '')}>
                        <SelectTrigger className="bg-[var(--fin-input-bg)] border-[var(--fin-input-border)] text-[var(--fin-text)] h-12 rounded-xl hover:bg-[var(--fin-input-bg)]/80 transition-all">
                          <SelectValue placeholder="Forma do Saldo Restante" />
                        </SelectTrigger>
                        <SelectContent className="bg-[var(--fin-bg)] border-[var(--fin-border)] text-[var(--fin-text)]">
                          {['PIX', 'Dinheiro', 'Débito', 'Crédito à Vista', 'Crédito 2x', 'Crédito 3x'].map(m => (
                            <SelectItem key={m} value={m}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-auto pt-8 flex flex-col items-center gap-4">
            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[var(--fin-border)] to-transparent" />
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase tracking-[0.5em] text-[var(--fin-muted)] font-black mb-2 opacity-80">Valor Líquido Final</span>
              <div className="relative group">
                <div className="absolute inset-0 bg-[var(--fin-glow)] blur-[30px] rounded-full group-hover:bg-[var(--fin-accent)]/20 transition-all duration-700 opacity-50" />
                <p className="relative text-5xl font-black text-[var(--fin-accent)] font-mono tracking-tighter transition-transform duration-500 group-hover:scale-105">
                  {netValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
