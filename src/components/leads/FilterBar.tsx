import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { LeadType, LeadOrigin, LeadPriority, ORIGIN_LABELS } from '@/types/database';

export interface LeadFilters {
  leadType?: LeadType[];
  priority?: LeadPriority[];
  origin?: LeadOrigin[];
}

interface FilterBarProps {
  onFilterChange: (filters: LeadFilters) => void;
  activeFilters: LeadFilters;
}

const PIPELINE_OPTIONS = [
  { value: 'PROFISSIONAL', label: 'Profissional' },
  { value: 'DISTRIBUIDOR', label: 'Distribuidor' },
];

const PRIORITY_OPTIONS = [
  { value: 'P1', label: 'P1 - Urgente' },
  { value: 'P2', label: 'P2 - Alta' },
  { value: 'P3', label: 'P3 - Média' },
  { value: 'P4', label: 'P4 - Baixa' },
];

export function FilterBar({ onFilterChange, activeFilters }: FilterBarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleLeadType = (value: LeadType) => {
    const current = activeFilters.leadType || [];
    const newValues = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
    onFilterChange({ ...activeFilters, leadType: newValues.length > 0 ? newValues : undefined });
  };

  const togglePriority = (value: LeadPriority) => {
    const current = activeFilters.priority || [];
    const newValues = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
    onFilterChange({ ...activeFilters, priority: newValues.length > 0 ? newValues : undefined });
  };

  const toggleOrigin = (value: LeadOrigin) => {
    const current = activeFilters.origin || [];
    const newValues = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
    onFilterChange({ ...activeFilters, origin: newValues.length > 0 ? newValues : undefined });
  };

  const clearFilters = () => onFilterChange({});

  const activeCount = 
    (activeFilters.leadType?.length || 0) + 
    (activeFilters.priority?.length || 0) + 
    (activeFilters.origin?.length || 0);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Filtros
            {activeCount > 0 && (
              <Badge variant="secondary" className="ml-1">{activeCount}</Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Filtros</SheetTitle>
          </SheetHeader>
          <div className="space-y-6 mt-6">
            <div>
              <h4 className="text-sm font-medium mb-3">Pipeline</h4>
              <div className="flex flex-wrap gap-2">
                {PIPELINE_OPTIONS.map(opt => (
                  <Button
                    key={opt.value}
                    variant={activeFilters.leadType?.includes(opt.value as LeadType) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleLeadType(opt.value as LeadType)}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-3">Prioridade</h4>
              <div className="flex flex-wrap gap-2">
                {PRIORITY_OPTIONS.map(opt => (
                  <Button
                    key={opt.value}
                    variant={activeFilters.priority?.includes(opt.value as LeadPriority) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => togglePriority(opt.value as LeadPriority)}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>
            {activeCount > 0 && (
              <Button variant="ghost" onClick={clearFilters} className="w-full">
                Limpar filtros
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {activeFilters.leadType?.map(v => (
        <Badge key={v} variant="secondary" className="gap-1 cursor-pointer" onClick={() => toggleLeadType(v)}>
          {v} <X className="h-3 w-3" />
        </Badge>
      ))}
      {activeFilters.priority?.map(v => (
        <Badge key={v} variant="secondary" className="gap-1 cursor-pointer" onClick={() => togglePriority(v)}>
          {v} <X className="h-3 w-3" />
        </Badge>
      ))}

      {activeCount === 0 && (
        <>
          <Button variant="ghost" size="sm" onClick={() => onFilterChange({ priority: ['P1'] })}>
            🔴 Urgentes
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onFilterChange({ leadType: ['PROFISSIONAL'] })}>
            Direto
          </Button>
        </>
      )}
    </div>
  );
}