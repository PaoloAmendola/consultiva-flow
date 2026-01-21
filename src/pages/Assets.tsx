import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { mockAssets } from '@/data/mockData';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, FileText, Video, Image, Link as LinkIcon, Headphones, ExternalLink, Copy } from 'lucide-react';
import { toast } from 'sonner';

const Assets = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  const filteredAssets = mockAssets.filter(asset => {
    if (typeFilter && asset.type !== typeFilter) return false;
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      asset.name.toLowerCase().includes(query) ||
      asset.description?.toLowerCase().includes(query) ||
      asset.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  });

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'PDF': return FileText;
      case 'VIDEO': return Video;
      case 'IMAGEM': return Image;
      case 'LINK': return LinkIcon;
      case 'AUDIO': return Headphones;
      default: return FileText;
    }
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('Link copiado!');
  };

  const handleOpen = (url: string) => {
    window.open(url, '_blank');
  };

  const assetTypes = ['PDF', 'VIDEO', 'IMAGEM', 'LINK', 'AUDIO'];

  return (
    <AppLayout 
      title="Assets" 
      subtitle={`${mockAssets.length} materiais disponíveis`}
    >
      {/* Search */}
      <div className="p-4 border-b border-border bg-card/50 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar materiais..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 bg-background"
          />
        </div>
        
        {/* Type filters */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          <Button
            variant={typeFilter === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTypeFilter(null)}
          >
            Todos
          </Button>
          {assetTypes.map(type => (
            <Button
              key={type}
              variant={typeFilter === type ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTypeFilter(type)}
            >
              {type}
            </Button>
          ))}
        </div>
      </div>

      {/* Asset list */}
      <div className="p-4 space-y-3">
        {filteredAssets.map(asset => {
          const Icon = getAssetIcon(asset.type);
          return (
            <div
              key={asset.id}
              className="action-card"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground mb-1">{asset.name}</h3>
                  {asset.description && (
                    <p className="text-sm text-muted-foreground mb-2">{asset.description}</p>
                  )}
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary" className="text-xs">{asset.type}</Badge>
                    {asset.tags?.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 mt-4">
                <Button 
                  className="flex-1 btn-primary gap-2"
                  onClick={() => handleOpen(asset.url)}
                >
                  <ExternalLink className="h-4 w-4" />
                  Abrir
                </Button>
                <Button 
                  variant="secondary"
                  onClick={() => handleCopyLink(asset.url)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}

        {filteredAssets.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Nenhum material encontrado
            </h3>
            <p className="text-sm text-muted-foreground">
              Tente buscar por outro termo
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Assets;
