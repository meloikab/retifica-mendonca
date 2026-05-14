'use client';

import React, { useState, useMemo } from 'react';
import { useStore, Order } from '@/lib/store';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Download,
  Calendar,
  DollarSign,
  Eye,
  Printer,
  Hash,
  Users,
  Wrench,
  Package,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { FilterBar } from '@/components/filter-bar';
import { Pagination } from '@/components/pagination';
import { useOrderFilters } from '@/hooks/use-order-filters';

export function History() {
  const { orders, clients } = useStore();
  const [viewOrderId, setViewOrderId] = useState<number | null>(null);

  const finishedOrders = useMemo(() => orders.filter(o => o.finished), [orders]);

  const {
    filters, setFilters, clearFilters,
    sort, setSort,
    page, setPage, pageSize, setPageSize,
    filteredOrders,
    totalFilteredCount, totalCount,
    allMotors, allDisplacements,
    allPaymentMethods, allPaymentStatuses, allServiceStatuses, allServiceTypes,
    clientOptions,
  } = useOrderFilters({
    storageKey: 'history',
    orders: finishedOrders,
    clients,
  });

  const selectedOrder = viewOrderId ? orders.find(o => o.id === viewOrderId) : null;

  const totalRevenue = finishedOrders.reduce((acc, curr) => acc + curr.netValue, 0);

  const formatCurrency = (val: number) =>
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pronto': return <Badge variant="default" className="bg-green-600 hover:bg-green-700"><CheckCircle2 className="w-3 h-3 mr-1" />Pronto</Badge>;
      case 'Em Andamento': return <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">Em Andamento</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPaymentBadge = (order: Order) => {
    switch (order.paymentStatus) {
      case 'Pago': return <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950/30 dark:border-green-800">Pago</Badge>;
      case 'Entrada': return <Badge variant="outline" className="text-orange-600 bg-orange-50 border-orange-200 dark:text-orange-400 dark:bg-orange-950/30 dark:border-orange-800">Entrada</Badge>;
      default: return <Badge variant="destructive">Pendente</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Histórico de O.S. Finalizadas</h2>
        <p className="text-muted-foreground">Consulta e auditoria de serviços concluídos.</p>
      </div>

      <FilterBar
        filters={filters}
        onFilterChange={setFilters}
        onClear={clearFilters}
        resultCount={totalFilteredCount}
        totalCount={totalCount}
        clients={clientOptions}
        motors={allMotors}
        displacements={allDisplacements}
        paymentMethods={allPaymentMethods}
        paymentStatuses={allPaymentStatuses}
        serviceStatuses={allServiceStatuses}
        sort={sort}
        onSortChange={setSort}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Serviços</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{finishedOrders.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-primary flex items-center gap-1">
              <DollarSign className="w-3 h-3" /> Faturamento Realizado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {finishedOrders.reduce((acc, curr) => acc + curr.netValue, 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[100px] font-bold">Nº O.S.</TableHead>
              <TableHead className="font-bold">Cliente</TableHead>
              <TableHead className="font-bold">Motor</TableHead>
              <TableHead className="font-bold">Finalizado em</TableHead>
              <TableHead className="font-bold text-right">Valor Final</TableHead>
              <TableHead className="font-bold text-center">Pagamento</TableHead>
              <TableHead className="text-right">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-64 text-center text-muted-foreground">
                  Nenhum registro no histórico.
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => {
                const client = clients.find(c => c.id === order.clientId);
                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono font-bold">#{order.id}</TableCell>
                    <TableCell>
                      <div className="font-semibold">{client?.name}</div>
                      <div className="text-xs text-muted-foreground">{client?.document}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{order.motorModel}</div>
                      <Badge variant="secondary" className="text-[10px]">{order.displacement}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold">
                      {order.netValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950/30 dark:border-green-800">
                        {order.paymentMethod || 'Pago'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger render={
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 gap-1 text-primary hover:text-primary hover:bg-primary/10 font-bold"
                            onClick={() => setViewOrderId(order.id)}
                          >
                            <Eye className="w-4 h-4" />
                            Visualizar O.S.
                          </Button>
                        } />
                        <DialogContent className="max-w-2xl sm:max-w-2xl p-0 overflow-hidden flex flex-col max-h-[85vh]">
                          <DialogHeader className="p-5 border-b bg-muted/30 shrink-0">
                            <DialogTitle className="text-xl font-black flex items-center gap-2">
                              <Eye className="w-5 h-5 text-primary" />
                              Ordem de Serviço
                              <span className="font-mono text-primary ml-1">#{order.id}</span>
                            </DialogTitle>
                          </DialogHeader>
                          <div className="flex-1 overflow-y-auto p-5 space-y-5">
                            {selectedOrder && (() => {
                              const orderClient = clients.find(c => c.id === selectedOrder.clientId);
                              return (
                                <>
                                  {/* Informações Gerais */}
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="space-y-1">
                                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1"><Hash className="w-3 h-3" />Nº O.S.</p>
                                      <p className="text-lg font-black font-mono text-primary">#{selectedOrder.id}</p>
                                    </div>
                                    <div className="space-y-1">
                                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1"><Users className="w-3 h-3" />Cliente</p>
                                      <p className="text-sm font-bold">{orderClient?.name || 'Cliente Removido'}</p>
                                      {orderClient?.phone && <p className="text-xs text-muted-foreground font-mono">{orderClient.phone}</p>}
                                    </div>
                                    <div className="space-y-1">
                                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1"><Wrench className="w-3 h-3" />Motor</p>
                                      <p className="text-sm font-bold">{selectedOrder.motorModel}</p>
                                    </div>
                                    <div className="space-y-1">
                                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Cilindrada</p>
                                      <Badge variant="outline" className="font-mono">{selectedOrder.displacement || '-'}</Badge>
                                    </div>
                                  </div>

                                  <Separator />

                                  {/* Status e Datas */}
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="space-y-1">
                                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Status</p>
                                      {getStatusBadge(selectedOrder.serviceStatus)}
                                    </div>
                                    <div className="space-y-1">
                                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Pagamento</p>
                                      {getPaymentBadge(selectedOrder)}
                                    </div>
                                    <div className="space-y-1">
                                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1"><Calendar className="w-3 h-3" />Chegada</p>
                                      <p className="text-sm font-medium font-mono">
                                        {selectedOrder.arrivalDate ? new Date(selectedOrder.arrivalDate + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}
                                      </p>
                                    </div>
                                    <div className="space-y-1">
                                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1"><Calendar className="w-3 h-3" />Entrega</p>
                                      <p className="text-sm font-medium font-mono">
                                        {selectedOrder.deliveryDate ? new Date(selectedOrder.deliveryDate + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Peças Deixadas */}
                                  {selectedOrder.partsLeft.length > 0 && (
                                    <>
                                      <Separator />
                                      <div className="space-y-2">
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1"><Package className="w-3 h-3" />Material Deixado</p>
                                        <div className="flex flex-wrap gap-1.5">
                                          {selectedOrder.partsLeft.map(p => (
                                            <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>
                                          ))}
                                        </div>
                                      </div>
                                    </>
                                  )}

                                  {/* Peças Adicionais */}
                                  {selectedOrder.additionalParts.length > 0 && (
                                    <div className="space-y-2">
                                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Peças Adicionais</p>
                                      <div className="flex flex-wrap gap-1.5">
                                        {selectedOrder.additionalParts.map(p => (
                                          <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  <Separator />

                                  {/* Serviços */}
                                  <div className="space-y-2">
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1"><Wrench className="w-3 h-3" />Serviços Realizados</p>
                                    {selectedOrder.services.length > 0 ? (
                                      <div className="rounded-lg border overflow-hidden">
                                        <Table>
                                          <TableHeader className="bg-muted/40">
                                            <TableRow>
                                              <TableHead className="text-xs font-bold">Serviço</TableHead>
                                              <TableHead className="text-xs font-bold text-center w-[60px]">Qtd</TableHead>
                                              <TableHead className="text-xs font-bold text-right w-[100px]">Unit.</TableHead>
                                              <TableHead className="text-xs font-bold text-right w-[100px]">Total</TableHead>
                                            </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                            {selectedOrder.services.map(s => (
                                              <TableRow key={s.id}>
                                                <TableCell className="text-sm font-medium">{s.name}</TableCell>
                                                <TableCell className="text-sm text-center font-mono">{s.quantity}</TableCell>
                                                <TableCell className="text-sm text-right font-mono">{formatCurrency(s.value)}</TableCell>
                                                <TableCell className="text-sm text-right font-mono font-bold">{formatCurrency(s.value * s.quantity)}</TableCell>
                                              </TableRow>
                                            ))}
                                          </TableBody>
                                        </Table>
                                      </div>
                                    ) : (
                                      <p className="text-sm text-muted-foreground italic">Nenhum serviço registrado.</p>
                                    )}
                                  </div>

                                  {/* Observações */}
                                  {selectedOrder.observations && (
                                    <>
                                      <Separator />
                                      <div className="space-y-1">
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Observações</p>
                                        <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg border">{selectedOrder.observations}</p>
                                      </div>
                                    </>
                                  )}

                                  <Separator />

                                  {/* Resumo Financeiro */}
                                  <Card className="bg-[var(--fin-bg)] text-[var(--fin-text)] border-[var(--fin-border)]">
                                    <CardContent className="p-5 space-y-3">
                                      <div className="flex items-center justify-between">
                                        <span className="text-xs text-[var(--fin-muted)] uppercase tracking-wider font-bold">Subtotal</span>
                                        <span className="font-mono font-bold">{formatCurrency(selectedOrder.totalValue)}</span>
                                      </div>
                                      {selectedOrder.discount > 0 && (
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs text-[var(--fin-muted)] uppercase tracking-wider font-bold">Desconto</span>
                                          <span className="font-mono font-bold text-red-400">- {formatCurrency(selectedOrder.discount)}</span>
                                        </div>
                                      )}
                                      {selectedOrder.paymentMethod && (
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs text-[var(--fin-muted)] uppercase tracking-wider font-bold">Forma Pgto.</span>
                                          <Badge variant="outline" className="bg-[var(--fin-overlay)] text-[var(--fin-text)] border-[var(--fin-border)] text-xs">{selectedOrder.paymentMethod}</Badge>
                                        </div>
                                      )}
                                      {selectedOrder.entryValue != null && selectedOrder.entryValue > 0 && selectedOrder.paymentStatus === 'Entrada' && (
                                        <>
                                          <div className="flex items-center justify-between">
                                            <span className="text-xs text-[var(--fin-muted)] uppercase tracking-wider font-bold">Entrada</span>
                                            <span className="font-mono font-bold text-green-400">{formatCurrency(selectedOrder.entryValue)}</span>
                                          </div>
                                          <div className="flex items-center justify-between">
                                            <span className="text-xs text-[var(--fin-muted)] uppercase tracking-wider font-bold">Saldo</span>
                                            <span className="font-mono font-bold text-blue-400">{formatCurrency(selectedOrder.balanceValue || 0)}</span>
                                          </div>
                                        </>
                                      )}
                                      <Separator className="bg-[var(--fin-border)]" />
                                      <div className="flex items-center justify-between pt-1">
                                        <span className="text-xs text-[var(--fin-accent)] uppercase tracking-[0.3em] font-black">Valor Final</span>
                                        <span className="text-2xl font-black font-mono text-[var(--fin-accent)]">{formatCurrency(selectedOrder.netValue)}</span>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </>
                              );
                            })()}
                          </div>
                          <DialogFooter className="p-4 border-t bg-muted/10 shrink-0 gap-2 print:hidden">
                            <DialogClose render={<Button variant="outline" />}>
                              Fechar
                            </DialogClose>
                            <Button onClick={() => window.print()} className="flex items-center gap-2">
                              <Printer className="w-4 h-4" />
                              Imprimir O.S
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination
        currentPage={page}
        totalPages={Math.ceil(totalFilteredCount / pageSize)}
        pageSize={pageSize}
        totalItems={totalFilteredCount}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
}
