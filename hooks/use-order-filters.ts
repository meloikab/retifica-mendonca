'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import type { Order, Client } from '@/lib/store';
import type { FilterValues, SortConfig, SortField, SortDirection } from '@/components/filter-bar';

const DEFAULT_FILTERS: FilterValues = {
  search: '',
  clientId: '',
  motorModel: '',
  displacement: '',
  paymentMethod: '',
  paymentStatus: '',
  serviceType: '',
  serviceStatus: '',
  dateFrom: '',
  dateTo: '',
  minValue: '',
  maxValue: '',
};

const DEFAULT_SORT: SortConfig = { field: 'id', direction: 'desc' };

interface UseOrderFiltersOptions {
  storageKey: string;
  orders: Order[];
  clients: Client[];
}

export function useOrderFilters({ storageKey, orders, clients }: UseOrderFiltersOptions) {
  const [filters, setFilters] = useState<FilterValues>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem('retifica_filters_' + storageKey);
        if (saved) return { ...DEFAULT_FILTERS, ...JSON.parse(saved) };
      } catch { /* ignore */ }
    }
    return DEFAULT_FILTERS;
  });

  const [sort, setSort] = useState<SortConfig>(DEFAULT_SORT);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const debouncedSearch = useDebounce(filters.search, 300);

  const effectiveFilters = useMemo(() => ({
    ...filters,
    search: debouncedSearch,
  }), [filters, debouncedSearch]);

  useEffect(() => {
    try {
      sessionStorage.setItem('retifica_filters_' + storageKey, JSON.stringify(filters));
    } catch { /* ignore */ }
  }, [filters, storageKey]);

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  }, []);

  const clientMap = useMemo(() => {
    const map = new Map<string, Client>();
    clients.forEach((c) => map.set(c.id, c));
    return map;
  }, [clients]);

  const clientNameMap = useMemo(() => {
    const map = new Map<string, string>();
    clients.forEach((c) => { map.set(c.id, c.name.toLowerCase()); map.set(c.id + '_raw', c.name); });
    return map;
  }, [clients]);

  const allMotors = useMemo(() => {
    const set = new Set<string>();
    orders.forEach((o) => {
      o.motorModel.split(', ').forEach((m) => { if (m) set.add(m); });
    });
    return Array.from(set).sort();
  }, [orders]);

  const allDisplacements = useMemo(() => {
    const set = new Set<string>();
    orders.forEach((o) => { if (o.displacement) set.add(o.displacement); });
    return Array.from(set).sort((a, b) => parseFloat(a) - parseFloat(b));
  }, [orders]);

  const allPaymentMethods = useMemo(() => {
    const set = new Set<string>();
    orders.forEach((o) => { if (o.paymentMethod) set.add(o.paymentMethod); });
    return Array.from(set);
  }, [orders]);

  const allPaymentStatuses = useMemo(() => {
    const set = new Set<string>();
    orders.forEach((o) => { if (o.paymentStatus) set.add(o.paymentStatus); });
    return Array.from(set);
  }, [orders]);

  const allServiceStatuses = useMemo(() => {
    const set = new Set<string>();
    orders.forEach((o) => { if (o.serviceStatus) set.add(o.serviceStatus); });
    return Array.from(set);
  }, [orders]);

  const allServiceTypes = useMemo(() => {
    const set = new Set<string>();
    orders.forEach((o) => o.services.forEach((s) => { if (s.name) set.add(s.name); }));
    return Array.from(set).sort();
  }, [orders]);

  const filteredOrders = useMemo(() => {
    let result = [...orders];

    if (effectiveFilters.search) {
      const q = effectiveFilters.search.toLowerCase();
      result = result.filter((o) => {
        const client = clientMap.get(o.clientId);
        const searchInId = o.id.toString().includes(q);
        const searchInClient = client ? (client.name.toLowerCase().includes(q) || client.phone.includes(q) || client.document.includes(q)) : false;
        return searchInId || searchInClient;
      });
    }

    if (effectiveFilters.clientId) {
      result = result.filter((o) => o.clientId === effectiveFilters.clientId);
    }

    if (effectiveFilters.motorModel) {
      result = result.filter((o) => o.motorModel.toLowerCase().includes(effectiveFilters.motorModel.toLowerCase()));
    }

    if (effectiveFilters.displacement) {
      result = result.filter((o) => o.displacement === effectiveFilters.displacement);
    }

    if (effectiveFilters.paymentMethod) {
      result = result.filter((o) => o.paymentMethod === effectiveFilters.paymentMethod);
    }

    if (effectiveFilters.paymentStatus) {
      result = result.filter((o) => o.paymentStatus === effectiveFilters.paymentStatus);
    }

    if (effectiveFilters.serviceStatus) {
      result = result.filter((o) => o.serviceStatus === effectiveFilters.serviceStatus);
    }

    if (effectiveFilters.serviceType) {
      const q = effectiveFilters.serviceType.toLowerCase();
      result = result.filter((o) =>
        o.services.some((s) => s.name.toLowerCase().includes(q))
      );
    }

    if (effectiveFilters.dateFrom) {
      const from = new Date(effectiveFilters.dateFrom + 'T00:00:00');
      result = result.filter((o) => {
        const d = new Date(o.createdAt);
        return d >= from;
      });
    }

    if (effectiveFilters.dateTo) {
      const to = new Date(effectiveFilters.dateTo + 'T23:59:59');
      result = result.filter((o) => {
        const d = new Date(o.createdAt);
        return d <= to;
      });
    }

    if (effectiveFilters.minValue) {
      const min = parseFloat(effectiveFilters.minValue);
      if (!isNaN(min)) {
        result = result.filter((o) => o.netValue >= min);
      }
    }

    if (effectiveFilters.maxValue) {
      const max = parseFloat(effectiveFilters.maxValue);
      if (!isNaN(max)) {
        result = result.filter((o) => o.netValue <= max);
      }
    }

    result.sort((a, b) => {
      let cmp = 0;
      switch (sort.field) {
        case 'id':
          cmp = a.id - b.id;
          break;
        case 'date':
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'value':
          cmp = a.netValue - b.netValue;
          break;
        case 'client': {
          const nameA = (clientMap.get(a.clientId)?.name || '').toLowerCase();
          const nameB = (clientMap.get(b.clientId)?.name || '').toLowerCase();
          cmp = nameA.localeCompare(nameB);
          break;
        }
        case 'status':
          cmp = a.serviceStatus.localeCompare(b.serviceStatus);
          break;
      }
      return sort.direction === 'desc' ? -cmp : cmp;
    });

    return result;
  }, [orders, effectiveFilters, sort, clientMap]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredOrders.length / pageSize)), [filteredOrders.length, pageSize]);

  const safePage = Math.min(page, totalPages);
  const paginatedOrders = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, safePage, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const updateFilter = useCallback((newFilters: FilterValues) => {
    setFilters(newFilters);
    setPage(1);
  }, []);

  const handleSortChange = useCallback((newSort: SortConfig) => {
    setSort(newSort);
  }, []);

  return {
    filters,
    setFilters: updateFilter,
    clearFilters,
    sort,
    setSort: handleSortChange,
    page: safePage,
    setPage,
    pageSize,
    setPageSize,
    filteredOrders: paginatedOrders,
    totalFilteredCount: filteredOrders.length,
    totalCount: orders.length,
    allMotors,
    allDisplacements,
    allPaymentMethods,
    allPaymentStatuses,
    allServiceStatuses,
    allServiceTypes,
    clientOptions: clients.map((c) => ({ id: c.id, name: c.name, phone: c.phone, document: c.document })),
  };
}
