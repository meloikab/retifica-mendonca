'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  SERVICE_CATEGORIES,
  searchServices,
  type CatalogService,
  type ServiceCategory,
  type SearchMatch,
} from '@/lib/service-catalog';
import type { ServiceItem } from '@/lib/store';
import {
  Search,
  ChevronDown,
  Check,
  Plus,
  X,
  Package,
  Wrench,
} from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';

interface AddServicePayload {
  id: string;
  name: string;
  value: number;
  quantity: number;
}

interface ServiceCatalogProps {
  selectedServices: ServiceItem[];
  onAddService: (svc: AddServicePayload) => void;
  onRemoveService: (id: string) => void;
  onUpdateService: (id: string, updates: Partial<ServiceItem>) => void;
  readOnly?: boolean;
}

const CATEGORY_BADGE: Record<string, string> = {
  cabecote: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  bloco: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
  eixo: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  outros: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
};

const CATEGORY_ACCENT: Record<string, string> = {
  cabecote: 'border-l-blue-500/70 dark:border-l-blue-600',
  bloco: 'border-l-emerald-500/70 dark:border-l-emerald-600',
  eixo: 'border-l-amber-500/70 dark:border-l-amber-600',
  outros: 'border-l-purple-500/70 dark:border-l-purple-600',
};

function HighlightText({
  text,
  ranges,
  className,
}: {
  text: string;
  ranges: { start: number; end: number }[];
  className?: string;
}) {
  if (ranges.length === 0) {
    return <span className={className}>{text}</span>;
  }

  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  const parts: React.ReactNode[] = [];
  let last = 0;

  for (const r of sorted) {
    if (r.start < last) continue;
    if (r.start > last) {
      parts.push(<span key={`t-${last}`}>{text.slice(last, r.start)}</span>);
    }
    parts.push(
      <mark
        key={`m-${r.start}`}
        className="bg-primary/20 text-primary font-semibold rounded-sm"
      >
        {text.slice(r.start, r.end)}
      </mark>
    );
    last = r.end;
  }

  if (last < text.length) {
    parts.push(<span key={`t-${last}`}>{text.slice(last)}</span>);
  }

  return <span className={className}>{parts}</span>;
}

function CategoryAccordion({
  category,
  isOpen,
  onToggle,
  onAddService,
  selectedIds,
  readOnly,
}: {
  category: ServiceCategory;
  isOpen: boolean;
  onToggle: () => void;
  onAddService: (svc: CatalogService) => void;
  selectedIds: Set<string>;
  readOnly?: boolean;
}) {
  return (
    <div className={cn('rounded-lg border overflow-hidden transition-all', CATEGORY_ACCENT[category.id])}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2.5 text-left transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
      >
        <div className="flex items-center gap-2.5">
          <span className={cn('text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded', CATEGORY_BADGE[category.id])}>
            {category.name}
          </span>
          <span className="text-[11px] text-muted-foreground">{category.services.length} itens</span>
        </div>
        <ChevronDown className={cn('w-3.5 h-3.5 text-muted-foreground transition-transform duration-150', isOpen && 'rotate-180')} />
      </button>
      {isOpen && (
        <div className="pb-1 max-h-[280px] overflow-y-auto">
          {category.services.map((svc) => {
            const isSelected = selectedIds.has(svc.id);
            return (
              <div
                key={svc.id}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-1.5 mx-1.5 rounded-md transition-all cursor-pointer group',
                  isSelected
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'hover:bg-muted/50 text-foreground/80 hover:text-foreground'
                )}
                onClick={() => { if (!readOnly) onAddService(svc); }}
              >
                <div className={cn(
                  'w-4 h-4 rounded border-2 flex items-center justify-center transition-all shrink-0',
                  isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/30 group-hover:border-muted-foreground/50'
                )}>
                  {isSelected && <Check className="w-2.5 h-2.5" />}
                </div>
                <span className="text-[13px] font-medium flex-1 leading-tight">{svc.name}</span>
                {svc.defaultPrice > 0 && (
                  <span className="text-[11px] font-mono text-muted-foreground shrink-0">
                    {svc.defaultPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ServiceCatalog({
  selectedServices,
  onAddService,
  onRemoveService,
  onUpdateService,
  readOnly = false,
}: ServiceCatalogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set(['cabecote', 'bloco', 'eixo', 'outros']));
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customName, setCustomName] = useState('');

  const debouncedSearch = useDebounce(searchQuery, 200);

  const selectedIds = useMemo(() => new Set(selectedServices.map((s) => s.id)), [selectedServices]);
  const selectedNames = useMemo(() => new Set(selectedServices.map((s) => s.name.toLowerCase())), [selectedServices]);

  const toggleCategory = useCallback((id: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleCatalogAdd = useCallback((svc: CatalogService) => {
    if (selectedIds.has(svc.id)) { onRemoveService(svc.id); return; }
    if (selectedNames.has(svc.name.toLowerCase())) return;
    onAddService({ id: svc.id, name: svc.name, value: svc.defaultPrice, quantity: 1 });
  }, [selectedIds, selectedNames, onAddService, onRemoveService]);

  const handleAddCustom = useCallback(() => {
    const name = customName.trim();
    if (!name) return;
    if (selectedNames.has(name.toLowerCase())) return;
    onAddService({ id: 'custom-' + Date.now(), name, value: 0, quantity: 1 });
    setCustomName('');
    setShowCustomInput(false);
  }, [customName, selectedNames, onAddService]);

  const searchedResults = useMemo(() => {
    if (!debouncedSearch.trim()) return null;
    return searchServices(debouncedSearch, activeCategory || undefined);
  }, [debouncedSearch, activeCategory]);

  const subtotal = useMemo(() => selectedServices.reduce((acc, s) => acc + s.value * s.quantity, 0), [selectedServices]);
  const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar serviços..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
        {!readOnly && (
          <Button type="button" variant="outline" size="xs" onClick={() => setShowCustomInput(!showCustomInput)} className="gap-1 shrink-0">
            <Plus className="w-3 h-3" />
            Custom
          </Button>
        )}
      </div>

      {debouncedSearch && searchedResults && (
        <div className="flex items-center gap-1.5 px-0.5">
          <Search className="w-3 h-3 text-muted-foreground/60" />
          <span className="text-[11px] text-muted-foreground/80">
            {searchedResults.length > 0
              ? `${searchedResults.length} ${searchedResults.length === 1 ? 'resultado' : 'resultados'}`
              : 'Nenhum resultado'}
          </span>
        </div>
      )}

      {selectedServices.length > 0 && !readOnly && (
        <div className="flex flex-wrap gap-1">
          {selectedServices.map((svc) => (
            <span
              key={svc.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[11px] font-medium"
            >
              {svc.name}
              <button
                type="button"
                onClick={() => onRemoveService(svc.id)}
                className="hover:bg-primary/20 rounded-sm p-0.5 transition-colors"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {showCustomInput && (
        <div className="flex items-center gap-1.5 p-2 rounded-lg border bg-muted/30 animate-in fade-in slide-in-from-top-1 duration-100">
          <Input
            placeholder="Nome do serviço..."
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            className="h-7 text-xs flex-1"
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustom(); } }}
            autoFocus
          />
          <Button type="button" size="xs" onClick={handleAddCustom}>
            <Plus className="w-3 h-3 mr-0.5" /> Add
          </Button>
          <Button type="button" variant="ghost" size="icon-xs" onClick={() => { setShowCustomInput(false); setCustomName(''); }}>
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setActiveCategory('')}
          className={cn('px-2.5 py-1 rounded-md text-[11px] font-medium transition-all', !activeCategory ? 'bg-primary text-primary-foreground shadow-xs' : 'bg-muted text-muted-foreground hover:bg-muted/80')}
        >
          Todas
        </button>
        {SERVICE_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(activeCategory === cat.id ? '' : cat.id)}
            className={cn('px-2.5 py-1 rounded-md text-[11px] font-medium transition-all', activeCategory === cat.id ? 'bg-primary text-primary-foreground shadow-xs' : 'bg-muted text-muted-foreground hover:bg-muted/80')}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {searchedResults ? (
        <div className="max-h-[340px] overflow-y-auto space-y-0.5 pr-0.5">
          {searchedResults.length === 0 ? (
            <p className="text-xs text-muted-foreground italic text-center py-6">Nenhum serviço encontrado</p>
          ) : (
            searchedResults.map(({ category, service, ranges }: SearchMatch) => {
              const isSelected = selectedIds.has(service.id);
              return (
                <div
                  key={service.id}
                  className={cn('flex items-center gap-2.5 px-3 py-1.5 rounded-md transition-all cursor-pointer', isSelected ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted/50 text-foreground/80')}
                  onClick={() => { if (!readOnly) handleCatalogAdd(service); }}
                >
                  <div className={cn('w-4 h-4 rounded border-2 flex items-center justify-center transition-all shrink-0', isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/30')}>
                    {isSelected && <Check className="w-2.5 h-2.5" />}
                  </div>
                  <HighlightText
                    text={service.name}
                    ranges={ranges}
                    className="text-[13px] flex-1 leading-tight"
                  />
                  <span className={cn('text-[9px] px-1.5 py-0.5 rounded font-medium', CATEGORY_BADGE[category.id])}>{category.name}</span>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-0.5">
          {SERVICE_CATEGORIES.filter((cat) => !activeCategory || cat.id === activeCategory).map((cat) => (
            <CategoryAccordion
              key={cat.id}
              category={cat}
              isOpen={openCategories.has(cat.id)}
              onToggle={() => toggleCategory(cat.id)}
              onAddService={handleCatalogAdd}
              selectedIds={selectedIds}
              readOnly={readOnly}
            />
          ))}
        </div>
      )}

      {selectedServices.length > 0 && (
        <>
          <Separator className="my-1" />
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-primary" />
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Selecionados ({selectedServices.length})
              </span>
            </div>

            {selectedServices.map((svc) => (
              <div
                key={svc.id}
                className="flex items-center gap-2 py-1.5 px-2 rounded-lg bg-muted/30 border hover:bg-muted/50 transition-colors group"
              >
                {!readOnly && (
                  <button type="button" onClick={() => onRemoveService(svc.id)} className="text-destructive/60 hover:text-destructive p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <X className="w-3 h-3" />
                  </button>
                )}
                <span className="text-[13px] font-medium flex-1 truncate min-w-0">{svc.name}</span>

                <div className="flex items-center border rounded h-7 overflow-hidden bg-background shrink-0">
                  <button type="button" disabled={readOnly} onClick={() => onUpdateService(svc.id, { quantity: Math.max(1, svc.quantity - 1) })}
                    className="px-1.5 h-full hover:bg-muted transition-colors flex items-center border-r disabled:opacity-30">
                    <Plus className="w-2.5 h-2.5 rotate-45" />
                  </button>
                  <Input type="number" min="1" value={svc.quantity}
                    onChange={(e) => onUpdateService(svc.id, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                    className="border-none text-center h-full w-8 focus-visible:ring-0 px-0 text-xs [appearance:textfield]" disabled={readOnly} />
                  <button type="button" disabled={readOnly} onClick={() => onUpdateService(svc.id, { quantity: svc.quantity + 1 })}
                    className="px-1.5 h-full hover:bg-muted transition-colors flex items-center border-l disabled:opacity-30">
                    <Plus className="w-2.5 h-2.5" />
                  </button>
                </div>

                <div className="relative w-20 shrink-0">
                  <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-muted-foreground">R$</span>
                  <Input type="number" step="0.01" value={svc.value === 0 ? '' : svc.value}
                    onChange={(e) => onUpdateService(svc.id, { value: parseFloat(e.target.value) || 0 })}
                    className="pl-5 h-7 font-mono text-[11px]" placeholder="0,00" disabled={readOnly} />
                </div>

                <span className="text-[13px] font-bold font-mono text-primary w-16 text-right shrink-0">
                  {formatCurrency(svc.value * svc.quantity)}
                </span>
              </div>
            ))}

            <div className="flex items-center justify-between pt-1.5 border-t">
              <span className="text-[11px] text-muted-foreground font-medium">Subtotal</span>
              <span className="text-base font-black font-mono text-primary">{formatCurrency(subtotal)}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}