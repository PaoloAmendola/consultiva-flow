import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  MessageCircle, 
  Phone, 
  Calendar, 
  Plus,
  Edit,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { EnrichedLead } from '@/hooks/useLeads';
import { useCreateInteraction } from '@/hooks/useInteractions';
import { AddInteractionModal } from './AddInteractionModal';
import { EditLeadModal } from './EditLeadModal';

interface QuickActionButtonsProps {
  lead: EnrichedLead;
  showEdit?: boolean;
}

export function QuickActionButtons({ lead, showEdit = true }: QuickActionButtonsProps) {
  const [interactionModalOpen, setInteractionModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const createInteraction = useCreateInteraction();

  const handleWhatsApp = async () => {
    const phone = lead.phone.replace(/\D/g, '');
    const message = lead.suggestedMessage 
      ? encodeURIComponent(lead.suggestedMessage.replace('{nome}', lead.name.split(' ')[0]))
      : '';
    
    // Log the interaction
    await createInteraction.mutateAsync({
      lead_id: lead.id,
      type: 'WHATSAPP_OUT',
      direction: 'OUT',
      content: lead.suggestedMessage?.replace('{nome}', lead.name.split(' ')[0]) || 'Mensagem enviada',
    });

    window.open(`https://wa.me/55${phone}?text=${message}`, '_blank');
    toast.success('WhatsApp aberto e interação registrada!');
  };

  const handleCall = async () => {
    // Log the interaction
    await createInteraction.mutateAsync({
      lead_id: lead.id,
      type: 'LIGACAO_OUT',
      direction: 'OUT',
      content: 'Ligação realizada',
    });

    window.open(`tel:+55${lead.phone.replace(/\D/g, '')}`, '_blank');
    toast.success('Ligação iniciada e interação registrada!');
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Button 
          size="icon" 
          className="h-9 w-9 bg-green-500 hover:bg-green-600 text-white"
          onClick={handleWhatsApp}
          disabled={createInteraction.isPending}
        >
          <MessageCircle className="h-4 w-4" />
        </Button>
        <Button 
          size="icon" 
          className="h-9 w-9 bg-blue-500 hover:bg-blue-600 text-white"
          onClick={handleCall}
          disabled={createInteraction.isPending}
        >
          <Phone className="h-4 w-4" />
        </Button>
        <Button 
          size="icon" 
          variant="outline"
          className="h-9 w-9"
          onClick={() => setInteractionModalOpen(true)}
        >
          <Plus className="h-4 w-4" />
        </Button>
        {showEdit && (
          <Button 
            size="icon" 
            variant="outline"
            className="h-9 w-9"
            onClick={() => setEditModalOpen(true)}
          >
            <Edit className="h-4 w-4" />
          </Button>
        )}
      </div>

      <AddInteractionModal 
        leadId={lead.id}
        open={interactionModalOpen}
        onOpenChange={setInteractionModalOpen}
      />

      <EditLeadModal 
        lead={lead}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
      />
    </>
  );
}