'use client';

import React, { useMemo } from 'react';
import { useStore, Order, ServiceStatus } from '@/lib/store';
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
import { 
  MoreHorizontal, 
  Eye, 
  CheckCircle2,
  AlertCircle,
  Clock,
  Pencil,
  Trash2
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { FilterBar, type FilterValues, type SortConfig } from '@/components/filter-bar';
import { Pagination } from '@/components/pagination';
import { useOrderFilters } from '@/hooks/use-order-filters';

export function Dashboard({ 
  onEdit, 
  onView 
}: { 
  onEdit?: (order: Order) => void, 
  onView?: (order: Order) => void 
}) {
  const { orders, clients, updateOrder, deleteOrder } = useStore();

  const activeOrders = useMemo(() => orders.filter(o => !o.finished), [orders]);

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
    storageKey: 'dashboard',
    orders: activeOrders,
    clients,
  });

  const getStatusBadge = (status: ServiceStatus) => {
    switch (status) {
      case 'Na Fila': return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="w-3 h-3" /> Na Fila</Badge>;
      case 'Em Andamento': return <Badge variant="default" className="bg-blue-500 hover:bg-blue-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Em Andamento</Badge>;
      case 'Pronto': return <Badge variant="default" className="bg-green-600 hover:bg-green-700 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Pronto</Badge>;
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case 'Não Pago': return <Badge variant="destructive">Pendente</Badge>;
      case 'Entrada': return <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50 dark:text-orange-400 dark:border-orange-800 dark:bg-orange-950/30">Entrada</Badge>;
      case 'Pago': return <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 dark:text-green-400 dark:border-green-800 dark:bg-green-950/30">Pago</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleDelete = (id: number) => {
    toast.warning(`Excluir O.S. #${id}?`, {
      description: "Esta ação não pode ser desfeita.",
      action: {
        label: "Confirmar",
        onClick: () => deleteOrder(id),
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">O.S. em Andamento</h2>
        <p className="text-muted-foreground">Gerencie as ordens de serviço ativas na oficina.</p>
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
        showServiceType={false}
        showValues={false}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-muted/20 border-dashed">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">O.S. Na Fila</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.filter(o => !o.finished && o.serviceStatus === 'Na Fila').length}</div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50/50 border-blue-100 dark:bg-blue-950/30 dark:border-blue-800/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400">Em Execução</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{orders.filter(o => !o.finished && o.serviceStatus === 'Em Andamento').length}</div>
          </CardContent>
        </Card>
        <Card className="bg-green-50/50 border-green-100 dark:bg-green-950/30 dark:border-green-800/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600 dark:text-green-400">Aguardando Retirada</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">{orders.filter(o => !o.finished && o.serviceStatus === 'Pronto').length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[100px] font-bold">Nº O.S.</TableHead>
              <TableHead className="font-bold">Chegada</TableHead>
              <TableHead className="font-bold">Cliente</TableHead>
              <TableHead className="font-bold">Motor</TableHead>
              <TableHead className="font-bold">Cil.</TableHead>
              <TableHead className="font-bold">Peças Deixadas</TableHead>
              <TableHead className="font-bold text-center">Status Serviço</TableHead>
              <TableHead className="font-bold text-center">Pagamento</TableHead>
              <TableHead className="text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-64 text-center text-muted-foreground">
                  Nenhuma ordem de serviço ativa encontrada.
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => {
                const client = clients.find(c => c.id === order.clientId);
                return (
                  <TableRow key={order.id} className="hover:bg-muted/30 transition-colors group">
                    <TableCell className="font-mono font-bold text-primary">#{order.id}</TableCell>
                    <TableCell className="text-sm font-mono whitespace-nowrap">
                      {order.arrivalDate ? new Date(order.arrivalDate + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold">{client?.name || 'Cliente Removido'}</div>
                      <div className="text-xs text-muted-foreground">{client?.phone}</div>
                    </TableCell>
                    <TableCell className="text-sm font-medium">{order.motorModel}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">{order.displacement}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {order.partsLeft.map(p => (
                          <span key={p} className="text-[10px] bg-muted px-1.5 py-0.5 rounded border">{p}</span>
                        ))}
                        {order.partsLeft.length === 0 && <span className="text-xs text-muted-foreground italic">Nenhuma</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(order.serviceStatus)}
                    </TableCell>
                    <TableCell className="text-center">
                      {getPaymentBadge(order.paymentStatus)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}>
                          <MoreHorizontal className="w-4 h-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuGroup>
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => onEdit?.(order)}>
                              <Pencil className="w-4 h-4 mr-2" /> Editar O.S.
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onView?.(order)}>
                              <Eye className="w-4 h-4 mr-2" /> Visualizar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-green-600 dark:text-green-400 font-bold"
                              onClick={() => updateOrder(order.id, { finished: true, serviceStatus: 'Pronto' })}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2" /> Finalizar O.S.
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive font-bold"
                              onClick={() => handleDelete(order.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" /> Excluir
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
