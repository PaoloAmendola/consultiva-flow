import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { DbAsset, LeadType } from '@/types/database';
import { AssetInput } from '@/hooks/useAssetMutations';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset?: DbAsset | null;
  onSubmit: (data: AssetInput) => void;
  isPending: boolean;
}

const ASSET_TYPES = ['PDF', 'VIDEO', 'IMAGEM', 'LINK', 'AUDIO'];
const LEAD_TYPES: LeadType[] = ['PROFISSIONAL', 'DISTRIBUIDOR'];

export function AssetFormModal({ open, onOpenChange, asset, onSubmit, isPending }: Props) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('PDF');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [forLeadType, setForLeadType] = useState<LeadType[]>([]);
  const [tagsStr, setTagsStr] = useState('');

  useEffect(() => {
    if (asset) {
      setCode(asset.code);
      setName(asset.name);
      setType(asset.type);
      setUrl(asset.url);
      setDescription(asset.description || '');
      setForLeadType(asset.for_lead_type || []);
      setTagsStr(asset.tags?.join(', ') || '');
    } else {
      setCode(''); setName(''); setType('PDF'); setUrl('');
      setDescription(''); setForLeadType([]); setTagsStr('');
    }
  }, [asset, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tags = tagsStr.split(',').map(t => t.trim()).filter(Boolean);
    onSubmit({
      code: code.trim(),
      name: name.trim(),
      type,
      url: url.trim(),
      description: description.trim() || null,
      for_lead_type: forLeadType.length > 0 ? forLeadType : null,
      tags: tags.length > 0 ? tags : null,
    });
  };

  const toggleLeadType = (lt: LeadType) => {
    setForLeadType(prev => prev.includes(lt) ? prev.filter(t => t !== lt) : [...prev, lt]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{asset ? 'Editar Asset' : 'Novo Asset'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Código *</Label>
              <Input value={code} onChange={e => setCode(e.target.value)} required placeholder="A1" />
            </div>
            <div>
              <Label>Tipo *</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ASSET_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Nome *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} required placeholder="Nome do material" />
          </div>
          <div>
            <Label>URL *</Label>
            <Input value={url} onChange={e => setUrl(e.target.value)} required type="url" placeholder="https://..." />
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Breve descrição..." />
          </div>
          <div>
            <Label className="mb-2 block">Público-alvo</Label>
            <div className="flex gap-4">
              {LEAD_TYPES.map(lt => (
                <label key={lt} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={forLeadType.includes(lt)} onCheckedChange={() => toggleLeadType(lt)} />
                  {lt === 'PROFISSIONAL' ? '👤 Profissional' : '🏢 Distribuidor'}
                </label>
              ))}
            </div>
          </div>
          <div>
            <Label>Tags (separadas por vírgula)</Label>
            <Input value={tagsStr} onChange={e => setTagsStr(e.target.value)} placeholder="resultado, antes-depois" />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending ? 'Salvando...' : asset ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
