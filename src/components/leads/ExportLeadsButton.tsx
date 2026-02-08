import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { exportLeadsToCSV, downloadCSV, ExportableLead } from '@/lib/csv-utils';
import { useLeads } from '@/hooks/useLeads';

export function ExportLeadsButton() {
  const { data: leads, isLoading } = useLeads();

  const handleExport = () => {
    if (!leads || leads.length === 0) {
      toast.error('Nenhum lead para exportar');
      return;
    }

    const csv = exportLeadsToCSV(leads as ExportableLead[]);
    const date = new Date().toISOString().split('T')[0];
    downloadCSV(csv, `leads-${date}.csv`);
    toast.success(`${leads.length} leads exportados!`);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2"
      onClick={handleExport}
      disabled={isLoading || !leads?.length}
    >
      <Download className="h-4 w-4" />
      Exportar CSV
    </Button>
  );
}
