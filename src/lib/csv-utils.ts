// CSV Import/Export utilities for leads
import { 
  LeadType, LeadOrigin, LeadPriority, ActionType, LeadStatusFinal,
  ORIGIN_LABELS, ACTION_TYPE_CONFIG, PROFISSIONAL_STAGES, DISTRIBUIDOR_STAGES,
} from '@/types/database';
import { z } from 'zod';

// CSV column mapping
const CSV_HEADERS = [
  'nome', 'telefone', 'email', 'empresa', 'cidade', 'estado',
  'tipo', 'origem', 'etapa', 'prioridade', 'status',
  'proxima_acao_tipo', 'proxima_acao_data', 'proxima_acao_nota',
  'tags', 'observacoes',
] as const;

const LEAD_TYPE_MAP: Record<string, LeadType> = {
  'profissional': 'PROFISSIONAL',
  'distribuidor': 'DISTRIBUIDOR',
  'nao_qualificado': 'NAO_QUALIFICADO',
  'não qualificado': 'NAO_QUALIFICADO',
};

const ORIGIN_MAP: Record<string, LeadOrigin> = Object.fromEntries(
  Object.entries(ORIGIN_LABELS).map(([k, v]) => [v.toLowerCase(), k as LeadOrigin])
);

const ACTION_TYPE_MAP: Record<string, ActionType> = Object.fromEntries(
  Object.entries(ACTION_TYPE_CONFIG).map(([k, v]) => [v.label.toLowerCase(), k as ActionType])
);

const STATUS_MAP: Record<string, LeadStatusFinal> = {
  'ativo': 'ATIVO',
  'convertido': 'CONVERTIDO',
  'perdido': 'PERDIDO',
  'fora_perfil': 'FORA_PERFIL',
  'fora de perfil': 'FORA_PERFIL',
};

export interface CSVImportRow {
  name: string;
  phone: string;
  email?: string;
  company?: string;
  city?: string;
  state?: string;
  lead_type: LeadType;
  origin: LeadOrigin;
  stage?: string;
  priority?: LeadPriority;
  status_final?: LeadStatusFinal;
  next_action_type: ActionType;
  next_action_at: string;
  next_action_note?: string;
  tags?: string[];
  observations?: string;
}

export interface CSVParseResult {
  valid: CSVImportRow[];
  errors: { row: number; message: string }[];
  total: number;
}

function escapeCSV(value: string | null | undefined): string {
  if (!value) return '';
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
  }
  result.push(current.trim());
  return result;
}

function resolveLeadType(val: string): LeadType | undefined {
  const key = val.toLowerCase().trim();
  return LEAD_TYPE_MAP[key] || (Object.values(['PROFISSIONAL', 'DISTRIBUIDOR', 'NAO_QUALIFICADO'] as const).find(v => v === val.toUpperCase()) as LeadType | undefined);
}

function resolveOrigin(val: string): LeadOrigin | undefined {
  const key = val.toLowerCase().trim();
  return ORIGIN_MAP[key] || (Object.keys(ORIGIN_LABELS).find(v => v === val.toUpperCase()) as LeadOrigin | undefined);
}

function resolveActionType(val: string): ActionType | undefined {
  const key = val.toLowerCase().trim();
  return ACTION_TYPE_MAP[key] || (Object.keys(ACTION_TYPE_CONFIG).find(v => v === val.toUpperCase()) as ActionType | undefined);
}

function resolvePriority(val: string): LeadPriority | undefined {
  const v = val.toUpperCase().trim();
  if (['P1', 'P2', 'P3', 'P4'].includes(v)) return v as LeadPriority;
  return undefined;
}

function resolveStage(val: string, leadType: LeadType): string | undefined {
  const stages = leadType === 'DISTRIBUIDOR' ? DISTRIBUIDOR_STAGES : PROFISSIONAL_STAGES;
  // Match by value or label
  const found = stages.find(s => s.value === val.toUpperCase() || s.label.toLowerCase() === val.toLowerCase().trim());
  return found?.value;
}

export function parseCSV(csvContent: string): CSVParseResult {
  const lines = csvContent.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) {
    return { valid: [], errors: [{ row: 0, message: 'Arquivo CSV vazio ou sem dados' }], total: 0 };
  }

  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
  const result: CSVParseResult = { valid: [], errors: [], total: lines.length - 1 };

  const getCol = (row: string[], colName: string): string => {
    const idx = headers.indexOf(colName);
    return idx >= 0 ? (row[idx] || '').trim() : '';
  };

  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    if (row.every(c => !c)) continue; // skip empty

    try {
      const name = getCol(row, 'nome');
      const phone = getCol(row, 'telefone');
      if (!name || !phone) {
        result.errors.push({ row: i + 1, message: 'Nome e telefone são obrigatórios' });
        continue;
      }

      const leadTypeStr = getCol(row, 'tipo') || 'profissional';
      const leadType = resolveLeadType(leadTypeStr);
      if (!leadType) {
        result.errors.push({ row: i + 1, message: `Tipo inválido: "${leadTypeStr}"` });
        continue;
      }

      const originStr = getCol(row, 'origem') || 'whatsapp';
      const origin = resolveOrigin(originStr);
      if (!origin) {
        result.errors.push({ row: i + 1, message: `Origem inválida: "${originStr}"` });
        continue;
      }

      const actionStr = getCol(row, 'proxima_acao_tipo') || 'whatsapp';
      const actionType = resolveActionType(actionStr);
      if (!actionType) {
        result.errors.push({ row: i + 1, message: `Tipo de ação inválido: "${actionStr}"` });
        continue;
      }

      const dateStr = getCol(row, 'proxima_acao_data');
      let nextActionAt: string;
      if (dateStr) {
        const parsed = new Date(dateStr);
        if (isNaN(parsed.getTime())) {
          result.errors.push({ row: i + 1, message: `Data inválida: "${dateStr}"` });
          continue;
        }
        nextActionAt = parsed.toISOString();
      } else {
        // Default: tomorrow 9am
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);
        nextActionAt = tomorrow.toISOString();
      }

      const stageStr = getCol(row, 'etapa');
      const stage = stageStr ? resolveStage(stageStr, leadType) : undefined;

      const priorityStr = getCol(row, 'prioridade');
      const priority = priorityStr ? resolvePriority(priorityStr) : undefined;

      const statusStr = getCol(row, 'status');
      const statusFinal = statusStr ? STATUS_MAP[statusStr.toLowerCase().trim()] : undefined;

      const tagsStr = getCol(row, 'tags');
      const tags = tagsStr ? tagsStr.split(';').map(t => t.trim()).filter(Boolean) : undefined;

      result.valid.push({
        name: name.substring(0, 100),
        phone: phone.substring(0, 20),
        email: getCol(row, 'email') || undefined,
        company: getCol(row, 'empresa') || undefined,
        city: getCol(row, 'cidade') || undefined,
        state: getCol(row, 'estado')?.substring(0, 2) || undefined,
        lead_type: leadType,
        origin,
        stage,
        priority,
        status_final: statusFinal,
        next_action_type: actionType,
        next_action_at: nextActionAt,
        next_action_note: getCol(row, 'proxima_acao_nota') || undefined,
        tags,
        observations: getCol(row, 'observacoes') || undefined,
      });
    } catch (err) {
      result.errors.push({ row: i + 1, message: 'Erro ao processar linha' });
    }
  }

  return result;
}

export interface ExportableLead {
  name: string;
  phone: string;
  email?: string | null;
  company?: string | null;
  city?: string | null;
  state?: string | null;
  lead_type: LeadType;
  origin: LeadOrigin;
  stage: string;
  priority: LeadPriority;
  status_final: LeadStatusFinal;
  next_action_type: ActionType;
  next_action_at: string;
  next_action_note?: string | null;
  tags?: string[] | null;
  observations?: string | null;
  created_at: string;
}

export function exportLeadsToCSV(leads: ExportableLead[]): string {
  const headers = [
    'nome', 'telefone', 'email', 'empresa', 'cidade', 'estado',
    'tipo', 'origem', 'etapa', 'prioridade', 'status',
    'proxima_acao_tipo', 'proxima_acao_data', 'proxima_acao_nota',
    'tags', 'observacoes', 'criado_em',
  ];

  const rows = leads.map(lead => {
    const stages = lead.lead_type === 'DISTRIBUIDOR' ? DISTRIBUIDOR_STAGES : PROFISSIONAL_STAGES;
    const stageLabel = stages.find(s => s.value === lead.stage)?.label || lead.stage;

    return [
      escapeCSV(lead.name),
      escapeCSV(lead.phone),
      escapeCSV(lead.email),
      escapeCSV(lead.company),
      escapeCSV(lead.city),
      escapeCSV(lead.state),
      lead.lead_type === 'DISTRIBUIDOR' ? 'Distribuidor' : lead.lead_type === 'NAO_QUALIFICADO' ? 'Não Qualificado' : 'Profissional',
      ORIGIN_LABELS[lead.origin] || lead.origin,
      escapeCSV(stageLabel),
      lead.priority,
      lead.status_final,
      ACTION_TYPE_CONFIG[lead.next_action_type]?.label || lead.next_action_type,
      new Date(lead.next_action_at).toLocaleString('pt-BR'),
      escapeCSV(lead.next_action_note),
      escapeCSV(lead.tags?.join('; ')),
      escapeCSV(lead.observations),
      new Date(lead.created_at).toLocaleString('pt-BR'),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

export function downloadCSV(content: string, filename: string) {
  const BOM = '\uFEFF'; // UTF-8 BOM for Excel compatibility
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function generateTemplateCSV(): string {
  const headers = [
    'nome', 'telefone', 'email', 'empresa', 'cidade', 'estado',
    'tipo', 'origem', 'etapa', 'prioridade', 'status',
    'proxima_acao_tipo', 'proxima_acao_data', 'proxima_acao_nota',
    'tags', 'observacoes',
  ];

  const exampleRow = [
    'Maria Silva', '11999998888', 'maria@email.com', 'Salão Bela', 'São Paulo', 'SP',
    'Profissional', 'Instagram', 'Novo Lead', 'P2', 'Ativo',
    'WhatsApp', '2025-02-10 09:00', 'Enviar catálogo',
    'corte;coloração', 'Indicada pela Ana',
  ];

  return [headers.join(','), exampleRow.join(',')].join('\n');
}
