import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Plus, X, Package, Pencil, Trash2, Check } from 'lucide-react';
import { useClientOrders, useCreateClientOrder, useUpdateClientOrder, useDeleteClientOrder, type ClientOrder } from '@/hooks/useClientOrders';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface OrdersPanelProps {
  leadId: string;
  clientName: string;
}

export function OrdersPanel({ leadId, clientName }: OrdersPanelProps) {
  const { data: orders, isLoading } = useClientOrders(leadId);
  const createOrder = useCreateClientOrder();
  const updateOrder = useUpdateClientOrder();
  const deleteOrder = useDeleteClientOrder();
  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState<ClientOrder | null>(null);
  const [items, setItems] = useState('');
  const [totalValue, setTotalValue] = useState('');
  const [notes, setNotes] = useState('');

  const totalAllOrders = orders?.reduce((sum, o) => sum + Number(o.total_value), 0) || 0;

  const resetForm = () => {
    setItems('');
    setTotalValue('');
    setNotes('');
    setEditingOrder(null);
    setShowForm(false);
  };

  const openEdit = (order: ClientOrder) => {
    setEditingOrder(order);
    setItems(order.items);
    setTotalValue(String(order.total_value));
    setNotes(order.notes || '');
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!items.trim() || !totalValue) return;
    if (editingOrder) {
      await updateOrder.mutateAsync({
        id: editingOrder.id,
        items: items.trim(),
        total_value: parseFloat(totalValue),
        notes: notes.trim() || null,
      });
    } else {
      await createOrder.mutateAsync({
        lead_id: leadId,
        items: items.trim(),
        total_value: parseFloat(totalValue),
        notes: notes.trim() || undefined,
      });
    }
    resetForm();
  };

  const isPending = createOrder.isPending || updateOrder.isPending;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <ShoppingCart className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold">Pedidos</span>
          {orders && orders.length > 0 && (
            <Badge variant="secondary" className="text-[10px]">
              {orders.length} · R$ {totalAllOrders.toFixed(2)}
            </Badge>
          )}
        </div>
        <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1" onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}>
          {showForm ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
          {showForm ? 'Cancelar' : 'Novo Pedido'}
        </Button>
      </div>

      {showForm && (
        <div className="bg-card rounded-lg p-2.5 border border-primary/20 space-y-2">
          <Input placeholder="Itens (ex: Kit Hidratação x2, Shampoo x3)" value={items} onChange={e => setItems(e.target.value)} className="h-7 text-xs" />
          <Input type="number" placeholder="Valor total (R$)" value={totalValue} onChange={e => setTotalValue(e.target.value)} className="h-7 text-xs" step="0.01" />
          <Textarea placeholder="Observações (opcional)" value={notes} onChange={e => setNotes(e.target.value)} className="text-xs min-h-[40px]" />
          <Button size="sm" className="h-7 text-xs w-full" onClick={handleSubmit} disabled={isPending || !items.trim() || !totalValue}>
            {isPending ? 'Salvando...' : editingOrder ? 'Salvar Alterações' : 'Registrar Pedido'}
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="text-xs text-muted-foreground text-center py-2">Carregando...</div>
      ) : orders && orders.length > 0 ? (
        <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
          {orders.map(order => (
            <div key={order.id} className="bg-muted/50 rounded-lg p-2 text-xs group relative">
              <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center gap-1">
                  <Package className="h-3 w-3 text-muted-foreground" />
                  <span className="font-medium">{format(new Date(order.order_date), 'dd/MM/yyyy', { locale: ptBR })}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-primary">R$ {Number(order.total_value).toFixed(2)}</span>
                  <div className="flex gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => openEdit(order)}>
                      <Pencil className="h-2.5 w-2.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive" onClick={() => { if (confirm('Remover este pedido?')) deleteOrder.mutate(order.id); }}>
                      <Trash2 className="h-2.5 w-2.5" />
                    </Button>
                  </div>
                </div>
              </div>
              <p className="text-muted-foreground truncate">{order.items}</p>
              {order.notes && <p className="text-muted-foreground/70 text-[10px] mt-0.5">{order.notes}</p>}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[10px] text-muted-foreground text-center py-2">Nenhum pedido registrado</p>
      )}
    </div>
  );
}
