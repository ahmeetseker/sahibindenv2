export type IntentName =
  | 'listing.search'
  | 'customer.search'
  | 'transaction.summary'
  | 'event.list'
  | 'match.find'
  | 'count.stats'
  | 'greeting'
  | 'unknown';

export interface PriceRange {
  min?: number;
  max?: number;
}

export interface AreaRange {
  min?: number;
  max?: number;
}

export interface ExtractedParams {
  location?: string;
  priceRange?: PriceRange;
  areaRange?: AreaRange;
  tags?: string[];
  segment?: 'Sıcak' | 'Ilık' | 'Soğuk';
  stage?: 'İlk temas' | 'Görüşme' | 'Teklif' | 'Kaparo' | 'Tapu';
  day?: 'Pzt' | 'Sal' | 'Çar' | 'Per' | 'Cum' | 'Cmt' | 'Paz';
  eventType?: 'saha' | 'tapu' | 'gorusme';
  ids?: { listings: string[]; customers: string[]; transactions: string[] };
  interestKeyword?: string;
}

export type ChartKind = 'mini' | 'line' | 'funnel';

export interface ChartDatum {
  label: string;
  value: number;
}

export type AssistantBlock =
  | { kind: 'text'; text: string }
  | { kind: 'listings'; ids: string[] }
  | { kind: 'customers'; ids: string[] }
  | { kind: 'transactions'; ids: string[] }
  | { kind: 'events'; ids: string[] }
  | { kind: 'stat'; label: string; value: string; delta?: string }
  | { kind: 'chart'; chart: ChartKind; data: ChartDatum[]; caption?: string }
  | { kind: 'suggest'; chips: string[] };

export interface AssistantResponse {
  intent: IntentName;
  text: string;
  blocks: AssistantBlock[];
}

export interface AssistantChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  blocks?: AssistantBlock[];
  intent?: IntentName;
  createdAt: string;
}

export interface AssistantSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: AssistantChatMessage[];
}
