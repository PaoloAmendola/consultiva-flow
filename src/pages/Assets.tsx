import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAssets } from '@/hooks/useAssets';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Search, FileText, Video, Image, Link as LinkIcon, Headphones, ExternalLink, Copy, Package } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const ASSET_TYPE_CONFIG: Record<string, { icon: typeof FileText; color: string }> = {
  PDF: { icon: FileText, color: 'bg-red-500/20 text-red-400' },
  VIDEO: { icon: Video, color: 'bg-purple-500/20 text-purple-400' },
  IMAGEM: { icon: Image, color: 'bg-green-500/20 text-green-400' },
  LINK: { icon: LinkIcon, color: 'bg-blue-500/20 text-blue-400' },
  AUDIO: { icon: Headphones, color: 'bg-amber-500/20 text-amber-400' },
};

const Assets = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [audienceFilter, setAudienceFilter] = useState<string | null>(null);
  const { data: assets, isLoading, error } = useAssets();

  const filteredAssets = (assets || []).filter(asset => {
    if (typeFilter && asset.type !== typeFilter) return false;
    if (audienceFilter && (!asset.for_lead_type || !asset.for_lead_type.includes(audienceFilter as any))) return false;
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      asset.name.toLowerCase().includes(query) ||
      asset.code.toLowerCase().includes(query) ||
      asset.description?.toLowerCase().includes(query) ||
      asset.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  });

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('Link copiado!');
  };

  const handleOpen = (url: string) => {
    window.open(url, '_blank');
  };

  const assetTypes = ['PDF', 'VIDEO', 'IMAGEM', 'LINK', 'AUDIO'];

  if (error) {
    return (
      <DashboardLayout title="Assets" subtitle="Erro ao carregar">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-destructive">Erro ao carregar assets. Tente novamente.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title="Materiais de Venda" 
      subtitle={isLoading ? 'Carregando...' : `${filteredAssets.length} de ${assets?.length || 0} materiais`}
    >
      {/* Search and filters */}
      <div className="space-y-3 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, código ou tag..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          {/* Type filters */}
          <Button
            variant={typeFilter === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTypeFilter(null)}
          >
            Todos
          </Button>
          {assetTypes.map(type => {
            const config = ASSET_TYPE_CONFIG[type];
            const Icon = config?.icon || FileText;
            return (
              <Button
                key={type}
                variant={typeFilter === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTypeFilter(type)}
                className="gap-1.5"
              >
                <Icon className="h-3.5 w-3.5" />
                {type}
              </Button>
            );
          })}

          <div className="w-px h-6 bg-border mx-1" />

          {/* Audience filter */}
          <Button
            variant={audienceFilter === 'PROFISSIONAL' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAudienceFilter(audienceFilter === 'PROFISSIONAL' ? null : 'PROFISSIONAL')}
            className="gap-1"
          >
            👤 Profissional
          </Button>
          <Button
            variant={audienceFilter === 'DISTRIBUIDOR' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAudienceFilter(audienceFilter === 'DISTRIBUIDOR' ? null : 'DISTRIBUIDOR')}
            className="gap-1"
          >
            🏢 Distribuidor
          </Button>
        </div>
      </div>

      {/* Asset grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-1">
            Nenhum material encontrado
          </h3>
          <p className="text-sm text-muted-foreground">
            {searchQuery || typeFilter || audienceFilter ? 'Tente buscar por outro termo ou ajustar os filtros' : 'Nenhum asset cadastrado'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredAssets.map(asset => {
            const config = ASSET_TYPE_CONFIG[asset.type] || ASSET_TYPE_CONFIG.PDF;
            const Icon = config.icon;
            
            return (
              <Card
                key={asset.id}
                className="group hover:border-primary/30 transition-all duration-200"
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className={cn(
                      "w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0",
                      config.color
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">
                          {asset.code}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-foreground text-sm leading-tight">{asset.name}</h3>
                    </div>
                  </div>

                  {asset.description && (
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{asset.description}</p>
                  )}

                  <div className="flex flex-wrap gap-1 mb-3">
                    {asset.for_lead_type?.map(type => (
                      <Badge
                        key={type}
                        variant="outline"
                        className={cn(
                          "text-[10px]",
                          type === 'PROFISSIONAL' 
                            ? 'border-purple-500/40 text-purple-400' 
                            : 'border-blue-500/40 text-blue-400'
                        )}
                      >
                        {type === 'PROFISSIONAL' ? '👤 Profissional' : '🏢 Distribuidor'}
                      </Badge>
                    ))}
                    {asset.tags?.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="secondary" className="text-[10px]">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      size="sm"
                      className="flex-1 gap-1.5 h-8 text-xs"
                      onClick={() => handleOpen(asset.url)}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Abrir
                    </Button>
                    <Button 
                      variant="secondary"
                      size="sm"
                      className="h-8"
                      onClick={() => handleCopyLink(asset.url)}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
};

export default Assets;
