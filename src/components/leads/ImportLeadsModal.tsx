import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Upload, FileUp, AlertCircle, CheckCircle2, Download } from 'lucide-react';
import { toast } from 'sonner';
import { parseCSV, generateTemplateCSV, downloadCSV, CSVParseResult, CSVImportRow } from '@/lib/csv-utils';
import { useCreateLead } from '@/hooks/useLeads';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';

export function ImportLeadsModal() {
  const [open, setOpen] = useState(false);
  const [parseResult, setParseResult] = useState<CSVParseResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createLead = useCreateLead();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Selecione um arquivo CSV');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande (máx. 5MB)');
      return;
    }

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const result = parseCSV(content);
      setParseResult(result);
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleImport = async () => {
    if (!parseResult || parseResult.valid.length === 0) return;

    setImporting(true);
    setProgress(0);
    let success = 0;
    let failed = 0;

    for (let i = 0; i < parseResult.valid.length; i++) {
      const row = parseResult.valid[i];
      try {
        await createLead.mutateAsync({
          name: row.name,
          phone: row.phone,
          email: row.email || null,
          company: row.company || null,
          city: row.city || null,
          state: row.state || null,
          lead_type: row.lead_type,
          origin: row.origin,
          stage: row.stage || 'NOVO_LEAD',
          priority: row.priority,
          next_action_type: row.next_action_type,
          next_action_at: row.next_action_at,
          next_action_note: row.next_action_note || null,
          tags: row.tags || null,
          observations: row.observations || null,
        });
        success++;
      } catch {
        failed++;
      }
      setProgress(Math.round(((i + 1) / parseResult.valid.length) * 100));
    }

    setImporting(false);
    toast.success(`${success} lead(s) importado(s)${failed > 0 ? `, ${failed} falharam` : ''}`);
    setOpen(false);
    resetState();
  };

  const handleDownloadTemplate = () => {
    const template = generateTemplateCSV();
    downloadCSV(template, 'modelo-importacao-leads.csv');
    toast.success('Modelo baixado!');
  };

  const resetState = () => {
    setParseResult(null);
    setFileName('');
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetState(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Upload className="h-4 w-4" />
          Importar CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Importar Leads via CSV</DialogTitle>
          <DialogDescription>
            Selecione um arquivo CSV com os dados dos leads para importar em massa.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Download template */}
          <Button variant="outline" size="sm" className="gap-2 w-full" onClick={handleDownloadTemplate}>
            <Download className="h-4 w-4" />
            Baixar modelo CSV
          </Button>

          {/* File upload */}
          <div
            className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <FileUp className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {fileName || 'Clique para selecionar um arquivo CSV'}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Parse results */}
          {parseResult && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span className="text-sm font-medium">{parseResult.valid.length} leads válidos</span>
                {parseResult.errors.length > 0 && (
                  <>
                    <AlertCircle className="h-4 w-4 text-destructive ml-2" />
                    <span className="text-sm text-destructive">{parseResult.errors.length} erros</span>
                  </>
                )}
              </div>

              {/* Preview */}
              {parseResult.valid.length > 0 && (
                <ScrollArea className="h-32 rounded-lg border p-3">
                  <div className="space-y-1">
                    {parseResult.valid.slice(0, 10).map((row, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span className="font-medium">{row.name}</span>
                        <span className="text-muted-foreground">{row.phone}</span>
                        <Badge variant="outline" className="text-xs">{row.lead_type}</Badge>
                      </div>
                    ))}
                    {parseResult.valid.length > 10 && (
                      <p className="text-xs text-muted-foreground">
                        ... e mais {parseResult.valid.length - 10} leads
                      </p>
                    )}
                  </div>
                </ScrollArea>
              )}

              {/* Errors */}
              {parseResult.errors.length > 0 && (
                <ScrollArea className="h-24 rounded-lg border border-destructive/30 p-3">
                  <div className="space-y-1">
                    {parseResult.errors.map((err, i) => (
                      <p key={i} className="text-xs text-destructive">
                        Linha {err.row}: {err.message}
                      </p>
                    ))}
                  </div>
                </ScrollArea>
              )}

              {/* Progress */}
              {importing && (
                <div className="space-y-2">
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-muted-foreground text-center">{progress}%</p>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { setOpen(false); resetState(); }}>
            Cancelar
          </Button>
          <Button
            onClick={handleImport}
            disabled={!parseResult || parseResult.valid.length === 0 || importing}
            className="gap-2"
          >
            {importing ? 'Importando...' : `Importar ${parseResult?.valid.length || 0} leads`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
