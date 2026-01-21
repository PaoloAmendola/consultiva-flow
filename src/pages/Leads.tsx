import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { mockLeads } from '@/data/mockData';
import { Lead, ORIGIN_LABELS, PROFISSIONAL_STAGES, DISTRIBUIDOR_STAGES } from '@/types/crm';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, ChevronRight, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const Leads = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newLead, setNewLead] = useState({
    name: '',
    phone: '',
    leadType: 'PROFISSIONAL' as const,
    origin: 'WHATSAPP' as const,
  });

  const filteredLeads = useMemo(() => {
    if (!searchQuery) return mockLeads;
    
    const query = searchQuery.toLowerCase();
    return mockLeads.filter(lead => 
      lead.name.toLowerCase().includes(query) ||
      lead.phone.includes(query) ||
      lead.company?.toLowerCase().includes(query) ||
      lead.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  }, [searchQuery]);

  const handleCreateLead = () => {
    if (!newLead.name || !newLead.phone) {
      toast.error('Nome e telefone são obrigatórios');
      return;
    }
    toast.success('Lead criado com sucesso!');
    setIsCreating(false);
    setNewLead({ name: '', phone: '', leadType: 'PROFISSIONAL', origin: 'WHATSAPP' });
  };

  const getStageLabel = (lead: Lead) => {
    const stages = lead.leadType === 'DISTRIBUIDOR' ? DISTRIBUIDOR_STAGES : PROFISSIONAL_STAGES;
    return stages.find(s => s.value === lead.stage)?.label || lead.stage;
  };

  return (
    <AppLayout 
      title="Leads" 
      subtitle={`${mockLeads.length} leads ativos`}
      showFab
      onFabClick={() => setIsCreating(true)}
    >
      {/* Search */}
      <div className="p-4 border-b border-border bg-card/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, telefone ou tag..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 bg-background"
          />
        </div>
      </div>

      {/* Lead list */}
      <div className="divide-y divide-border">
        {filteredLeads.map(lead => (
          <Link
            key={lead.id}
            to={`/leads/${lead.id}`}
            className="flex items-center gap-3 p-4 hover:bg-accent/50 active:bg-accent transition-colors"
          >
            {/* Priority indicator */}
            <div className={cn(
              'w-1 h-12 rounded-full flex-shrink-0',
              lead.priority === 'P1' && 'bg-destructive',
              lead.priority === 'P2' && 'bg-warning',
              lead.priority === 'P3' && 'bg-info',
              lead.priority === 'P4' && 'bg-muted-foreground',
            )} />

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-foreground truncate">
                  {lead.name}
                </span>
                {lead.isOverdue && (
                  <span className="text-xs text-destructive">⏰</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline" className="text-xs">
                  {getStageLabel(lead)}
                </Badge>
                <span className="truncate">
                  {lead.company || ORIGIN_LABELS[lead.origin]}
                </span>
              </div>
            </div>

            <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          </Link>
        ))}
      </div>

      {filteredLeads.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center px-4">
          <Search className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-1">
            Nenhum lead encontrado
          </h3>
          <p className="text-sm text-muted-foreground">
            Tente buscar por outro termo
          </p>
        </div>
      )}

      {/* Create Lead Sheet */}
      <Sheet open={isCreating} onOpenChange={setIsCreating}>
        <SheetContent side="bottom" className="h-[85vh]">
          <SheetHeader>
            <SheetTitle>Novo Lead</SheetTitle>
          </SheetHeader>
          
          <div className="mt-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                placeholder="Nome do lead"
                value={newLead.name}
                onChange={e => setNewLead(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone/WhatsApp *</Label>
              <Input
                id="phone"
                placeholder="11999887766"
                value={newLead.phone}
                onChange={e => setNewLead(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo de Lead</Label>
              <Select 
                value={newLead.leadType}
                onValueChange={v => setNewLead(prev => ({ ...prev, leadType: v as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PROFISSIONAL">Profissional (Direto)</SelectItem>
                  <SelectItem value="DISTRIBUIDOR">Distribuidor (Canal)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Origem</Label>
              <Select 
                value={newLead.origin}
                onValueChange={v => setNewLead(prev => ({ ...prev, origin: v as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                  <SelectItem value="INSTAGRAM">Instagram</SelectItem>
                  <SelectItem value="GOOGLE">Google</SelectItem>
                  <SelectItem value="NUVEMSHOP">Nuvemshop</SelectItem>
                  <SelectItem value="TELEFONE">Telefone</SelectItem>
                  <SelectItem value="INDICACAO">Indicação</SelectItem>
                  <SelectItem value="PRESENCIAL_EMPRESA">Presencial na empresa</SelectItem>
                  <SelectItem value="VISITA_SALAO">Visita em salão</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              className="w-full btn-primary"
              onClick={handleCreateLead}
            >
              <Plus className="h-5 w-5 mr-2" />
              Criar Lead
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </AppLayout>
  );
};

export default Leads;
