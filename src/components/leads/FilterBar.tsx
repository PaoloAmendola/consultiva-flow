import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterBarProps {
  onFilterChange: (filters: Record<string, string[]>) => void;
  activeFilters: Record<string, string[]>;
}

const PIPELINE_OPTIONS: FilterOption[] = [
  { value: 'PROFISSIONAL', label: 'Direto (Profissional)' },
  { value: 'DISTRIBUIDOR', label: 'Canal (Distribuidor)' },
];

const PRIORITY_OPTIONS: FilterOption[] = [
  { value: 'P1', label: 'P1 - Urgente' },
  { value: 'P2', label: 'P2 - Alta' },
  { value: 'P3', label: 'P3 - Média' },
  { value: 'P4', label: 'P4 - Baixa' },
];

const ORIGIN_OPTIONS: FilterOption[] = [
  { value: 'INSTAGRAM', label: 'Instagram' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'GOOGLE', label: 'Google' },
  { value: 'NUVEMSHOP', label: 'Nuvemshop' },
  { value: 'INDICACAO', label: 'Indicação' },
  { value: 'PRESENCIAL_EMPRESA', label: 'Presencial' },
  { value: 'VISITA_SALAO', label: 'Visita Salão' },
];

export function FilterBar({ onFilterChange, activeFilters }: FilterBarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleFilter = (category: string, value: string) => {
    const current = activeFilters[category] || [];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    
    onFilterChange({
      ...activeFilters,
      [category]: updated,
    });
  };

  const clearFilters = () => {
    onFilterChange({});
  };

  const activeCount = Object.values(activeFilters).flat().length;

  return (
    <div className="px-4 py-2 border-b border-border bg-card/50">
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 flex-shrink-0">
              <Filter className="h-4 w-4" />
              Filtros
              {activeCount > 0 && (
                <Badge variant="default" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                  {activeCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh]">
            <SheetHeader>
              <SheetTitle className="flex items-center justify-between">
                <span>Filtros</span>
                {activeCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Limpar todos
                  </Button>
                )}
              </SheetTitle>
            </SheetHeader>
            
            <div className="mt-6 space-y-6">
              {/* Pipeline */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Pipeline</h4>
                <div className="flex flex-wrap gap-2">
                  {PIPELINE_OPTIONS.map(opt => (
                    <Button
                      key={opt.value}
                      variant={activeFilters.pipeline?.includes(opt.value) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleFilter('pipeline', opt.value)}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Priority */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Prioridade</h4>
                <div className="flex flex-wrap gap-2">
                  {PRIORITY_OPTIONS.map(opt => (
                    <Button
                      key={opt.value}
                      variant={activeFilters.priority?.includes(opt.value) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleFilter('priority', opt.value)}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Origin */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Origem</h4>
                <div className="flex flex-wrap gap-2">
                  {ORIGIN_OPTIONS.map(opt => (
                    <Button
                      key={opt.value}
                      variant={activeFilters.origin?.includes(opt.value) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleFilter('origin', opt.value)}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Quick filter chips */}
        {activeCount === 0 ? (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="flex-shrink-0"
              onClick={() => toggleFilter('priority', 'P1')}
            >
              🔴 Urgentes
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex-shrink-0"
              onClick={() => toggleFilter('pipeline', 'PROFISSIONAL')}
            >
              💇 Direto
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex-shrink-0"
              onClick={() => toggleFilter('pipeline', 'DISTRIBUIDOR')}
            >
              🏢 Canal
            </Button>
          </>
        ) : (
          <>
            {Object.entries(activeFilters).map(([category, values]) =>
              values.map(value => (
                <Badge
                  key={`${category}-${value}`}
                  variant="secondary"
                  className="flex-shrink-0 gap-1 cursor-pointer"
                  onClick={() => toggleFilter(category, value)}
                >
                  {value}
                  <X className="h-3 w-3" />
                </Badge>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}
