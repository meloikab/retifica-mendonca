'use client';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Search,
  X,
  SlidersHorizontal,
  RotateCcw,
  Check,
  ChevronsUpDown,
  Calendar,
  DollarSign,
  Car,
  Gauge,
  CreditCard,
  Wrench,
  Tag,
  User,
  ArrowUpDown,
  ChevronDown,
  ListOrdered,
  Loader2,
} from 'lucide-react';

export interface FilterValues {
  search: string;
  clientId: string;
  motorModel: string;
  displacement: string;
  paymentMethod: string;
  paymentStatus: string;
  serviceType: string;
  serviceStatus: string;
  dateFrom: string;
  dateTo: string;
  minValue: string;
  maxValue: string;
}

export type SortField = 'date' | 'value' | 'client' | 'status' | 'id';
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

interface ClientOption {
  id: string;
  name: string;
  phone: string;
  document: string;
}

interface FilterBarProps {
  filters: FilterValues;
  onFilterChange: (filters: FilterValues) => void;
  onClear: () => void;
  resultCount: number;
  totalCount: number;
  loading?: boolean;
  clients: ClientOption[];
  motors: string[];
  displacements: string[];
  paymentMethods: string[];
  paymentStatuses: string[];
  serviceStatuses: string[];
  sort: SortConfig;
  onSortChange: (sort: SortConfig) => void;
  className?: string;
  showSearch?: boolean;
  showClient?: boolean;
  showMotor?: boolean;
  showDisplacement?: boolean;
  showPaymentMethod?: boolean;
  showPaymentStatus?: boolean;
  showServiceType?: boolean;
  showServiceStatus?: boolean;
  showDates?: boolean;
  showValues?: boolean;
}

function FilterTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 transition-all hover:bg-primary/20">
      {label}
      <button onClick={onRemove} className="ml-0.5 w-3.5 h-3.5 rounded-full inline-flex items-center justify-center hover:bg-primary/20 transition-colors">
        <X className="w-2.5 h-2.5" />
      </button>
    </span>
  );
}

function SortButton({ label, field, currentField, direction, onSort }: {
  label: string; field: SortField; currentField: SortField; direction: SortDirection; onSort: (field: SortField, dir: SortDirection) => void;
}) {
  const isActive = currentField === field;
  return (
    <button onClick={() => { onSort(field, isActive && direction === 'asc' ? 'desc' : isActive ? 'asc' : 'desc'); }}
      className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all',
        isActive ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}
    >
      {label}
      {isActive && <ArrowUpDown className={cn('w-3 h-3 transition-transform', direction === 'asc' && 'rotate-180')} />}
    </button>
  );
}

function ActiveFilters({ filters, onRemoveFilter, onClear, count }: {
  filters: FilterValues; onRemoveFilter: (key: keyof FilterValues) => void; onClear: () => void; count: number;
}) {
  const tags: { key: keyof FilterValues; label: string }[] = [];
  if (filters.search) tags.push({ key: 'search', label: '\u201C' + filters.search + '\u201D' });
  if (filters.clientId) tags.push({ key: 'clientId', label: 'Cliente' });
  if (filters.motorModel) tags.push({ key: 'motorModel', label: filters.motorModel });
  if (filters.displacement) tags.push({ key: 'displacement', label: filters.displacement });
  if (filters.paymentMethod) tags.push({ key: 'paymentMethod', label: filters.paymentMethod });
  if (filters.paymentStatus) tags.push({ key: 'paymentStatus', label: filters.paymentStatus });
  if (filters.serviceType) tags.push({ key: 'serviceType', label: filters.serviceType });
  if (filters.serviceStatus) tags.push({ key: 'serviceStatus', label: filters.serviceStatus });
  if (filters.dateFrom) tags.push({ key: 'dateFrom', label: 'De: ' + filters.dateFrom });
  if (filters.dateTo) tags.push({ key: 'dateTo', label: 'At\u00E9: ' + filters.dateTo });
  if (filters.minValue) tags.push({ key: 'minValue', label: 'M\u00EDn: R$ ' + filters.minValue });
  if (filters.maxValue) tags.push({ key: 'maxValue', label: 'M\u00E1x: R$ ' + filters.maxValue });
  if (tags.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted-foreground font-medium mr-1">{count > 0 ? count + ' resultado' + (count !== 1 ? 's' : '') : 'Filtros:'}</span>
      {tags.map((t) => <FilterTag key={t.key} label={t.label} onRemove={() => onRemoveFilter(t.key)} />)}
      {tags.length > 1 && <button onClick={onClear} className="text-xs text-muted-foreground hover:text-destructive transition-colors font-medium ml-1">Limpar tudo</button>}
    </div>
  );
}

export function FilterBar({
  filters,
  onFilterChange,
  onClear,
  resultCount,
  totalCount,
  loading,
  clients,
  motors,
  displacements,
  paymentMethods,
  paymentStatuses,
  serviceStatuses,
  sort,
  onSortChange,
  className,
  showSearch = true,
  showClient = true,
  showMotor = true,
  showDisplacement = true,
  showPaymentMethod = true,
  showPaymentStatus = true,
  showServiceType = true,
  showServiceStatus = true,
  showDates = true,
  showValues = true,
}: FilterBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [clientOpen, setClientOpen] = useState(false);

  const hasActiveFilters = useMemo(() => Object.values(filters).some((v) => v !== ''), [filters]);
  const activeFilterCount = useMemo(() => Object.values(filters).filter((v) => v !== '').length, [filters]);
  const selectedClientName = useMemo(() => clients.find((c) => c.id === filters.clientId)?.name || '', [clients, filters.clientId]);

  const updateFilter = (key: keyof FilterValues, value: string | null) => { onFilterChange({ ...filters, [key]: value ?? '' }); };
  const removeFilter = (key: keyof FilterValues) => { updateFilter(key, ''); };

  const sortOptions: { label: string; field: SortField }[] = [
    { label: 'N\u00BA O.S.', field: 'id' },
    { label: 'Data', field: 'date' },
    { label: 'Cliente', field: 'client' },
    { label: 'Valor', field: 'value' },
    { label: 'Status', field: 'status' },
  ];

  return (
    <div className={cn('space-y-4', className)}>
      <div className='flex items-center justify-between gap-4'>
        <div className='flex items-center gap-3'>
          <Button variant='outline' size='sm' onClick={() => setIsOpen(!isOpen)}
            className={cn('gap-2 font-medium transition-all', isOpen && 'bg-primary/10 border-primary/30 text-primary')}
          >
            <SlidersHorizontal className='w-4 h-4' />
            Filtros
            {activeFilterCount > 0 && (
              <span className='w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center'>{activeFilterCount}</span>
            )}
            <ChevronDown className={cn('w-3 h-3 transition-transform', isOpen && 'rotate-180')} />
          </Button>
          {hasActiveFilters && (
            <Button variant='ghost' size='sm' onClick={onClear} className='gap-1.5 text-muted-foreground hover:text-destructive'>
              <RotateCcw className='w-3.5 h-3.5' /> Limpar
            </Button>
          )}
        </div>
        <div className='flex items-center gap-2'>
          {loading && <Loader2 className='w-4 h-4 animate-spin text-primary' />}
          <span className='text-sm text-muted-foreground whitespace-nowrap'>
            <span className='font-semibold text-foreground'>{resultCount}</span>
            {' / '}{totalCount}
          </span>
        </div>
      </div>

      {isOpen && (
        <div className='rounded-xl border bg-card shadow-sm p-5 space-y-5 animate-in fade-in slide-in-from-top-2 duration-200'>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
            {showSearch && (
              <div className='sm:col-span-2 lg:col-span-1'>
                <Label className='text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5'>
                  <Search className='w-3 h-3' /> Busca Geral
                </Label>
                <Input placeholder='N\u00BA O.S., nome, telefone...' value={filters.search}
                  onChange={(e) => updateFilter('search', e.target.value)} className='h-9' />
              </div>
            )}
            {showClient && (
              <div>
                <Label className='text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5'>
                  <User className='w-3 h-3' /> Cliente
                </Label>
                <Popover open={clientOpen} onOpenChange={setClientOpen}>
                  <PopoverTrigger render={<Button variant='outline' role='combobox' className='w-full justify-between font-normal h-9' />}>
                    {selectedClientName || 'Todos os clientes'}
                    <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                  </PopoverTrigger>
                  <PopoverContent className='w-[300px] p-0' align='start'>
                    <Command>
                      <CommandInput placeholder='Buscar cliente...' />
                      <CommandList>
                        <CommandEmpty>Nenhum cliente.</CommandEmpty>
                        <CommandGroup>
                          {clients.map((c) => (
                            <CommandItem key={c.id} value={c.name + ' ' + c.phone + ' ' + c.document}
                              onSelect={() => { updateFilter('clientId', filters.clientId === c.id ? '' : c.id); setClientOpen(false); }}
                              className='flex items-center justify-between'
                            >
                              <div><span className='font-medium'>{c.name}</span><span className='text-xs text-muted-foreground ml-2'>{c.phone}</span></div>
                              {filters.clientId === c.id && <Check className='h-4 w-4 text-primary shrink-0' />}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            )}
            {showMotor && (
              <div>
                <Label className='text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5'>
                  <Car className='w-3 h-3' /> Motor
                </Label>
                <Select value={filters.motorModel} onValueChange={(v) => updateFilter('motorModel', v)}>
                  <SelectTrigger className='h-9'><SelectValue placeholder='Todos' /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value=' '>Todos</SelectItem>
                    {motors.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {showDisplacement && (
              <div>
                <Label className='text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5'>
                  <Gauge className='w-3 h-3' /> Cilindrada
                </Label>
                <Select value={filters.displacement} onValueChange={(v) => updateFilter('displacement', v)}>
                  <SelectTrigger className='h-9'><SelectValue placeholder='Todas' /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value=' '>Todas</SelectItem>
                    {displacements.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {showPaymentMethod && (
              <div>
                <Label className='text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5'>
                  <CreditCard className='w-3 h-3' /> Forma Pagamento
                </Label>
                <Select value={filters.paymentMethod} onValueChange={(v) => updateFilter('paymentMethod', v)}>
                  <SelectTrigger className='h-9'><SelectValue placeholder='Todas' /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value=' '>Todas</SelectItem>
                    {paymentMethods.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {showPaymentStatus && (
              <div>
                <Label className='text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5'>
                  <Tag className='w-3 h-3' /> Status Pagamento
                </Label>
                <Select value={filters.paymentStatus} onValueChange={(v) => updateFilter('paymentStatus', v)}>
                  <SelectTrigger className='h-9'><SelectValue placeholder='Todos' /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value=' '>Todos</SelectItem>
                    {paymentStatuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {showServiceStatus && (
              <div>
                <Label className='text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5'>
                  <Wrench className='w-3 h-3' /> Status Ordem
                </Label>
                <Select value={filters.serviceStatus} onValueChange={(v) => updateFilter('serviceStatus', v)}>
                  <SelectTrigger className='h-9'><SelectValue placeholder='Todos' /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value=' '>Todos</SelectItem>
                    {serviceStatuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {showServiceType && (
              <div>
                <Label className='text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5'>
                  <ListOrdered className='w-3 h-3' /> Tipo Servi\u00E7o
                </Label>
                <Input placeholder='Ex: Plainar...' value={filters.serviceType}
                  onChange={(e) => updateFilter('serviceType', e.target.value)} className='h-9' />
              </div>
            )}
            {showDates && (
              <>
                <div>
                  <Label className='text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5'>
                    <Calendar className='w-3 h-3' /> Data Inicial
                  </Label>
                  <Input type='date' value={filters.dateFrom} onChange={(e) => updateFilter('dateFrom', e.target.value)} className='h-9' />
                </div>
                <div>
                  <Label className='text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5'>
                    <Calendar className='w-3 h-3' /> Data Final
                  </Label>
                  <Input type='date' value={filters.dateTo} onChange={(e) => updateFilter('dateTo', e.target.value)} className='h-9' />
                </div>
              </>
            )}
            {showValues && (
              <>
                <div>
                  <Label className='text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5'>
                    <DollarSign className='w-3 h-3' /> Valor M\u00EDnimo
                  </Label>
                  <Input type='number' step='0.01' placeholder='R$ 0,00' value={filters.minValue}
                    onChange={(e) => updateFilter('minValue', e.target.value)} className='h-9' />
                </div>
                <div>
                  <Label className='text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5'>
                    <DollarSign className='w-3 h-3' /> Valor M\u00E1ximo
                  </Label>
                  <Input type='number' step='0.01' placeholder='R$ 9999,99' value={filters.maxValue}
                    onChange={(e) => updateFilter('maxValue', e.target.value)} className='h-9' />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <ActiveFilters filters={filters} onRemoveFilter={removeFilter} onClear={onClear} count={resultCount} />

      <div className='flex flex-wrap items-center gap-2'>
        <span className='text-xs text-muted-foreground font-medium mr-1'>Ordenar por:</span>
        {sortOptions.map((opt) => (
          <SortButton key={opt.field} label={opt.label} field={opt.field} currentField={sort.field}
            direction={sort.direction} onSort={(f, d) => onSortChange({ field: f, direction: d })} />
        ))}
      </div>
    </div>
  );
}
