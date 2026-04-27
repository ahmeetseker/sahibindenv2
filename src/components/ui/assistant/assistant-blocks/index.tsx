import type { AssistantBlock } from '@/lib/assistant/types';
import { TextBlock } from './text-block';
import { ListingsBlock } from './listings-block';
import { CustomersBlock } from './customers-block';
import { TransactionsBlock } from './transactions-block';
import { EventsBlock } from './events-block';
import { StatBlock } from './stat-block';
import { ChartBlock } from './chart-block';
import { SuggestBlock } from './suggest-block';

interface Props {
  block: AssistantBlock;
  onSuggest?: (chip: string) => void;
  onNavigate?: (target: 'listings' | 'customers') => void;
}

export function BlockRenderer({ block, onSuggest, onNavigate }: Props) {
  switch (block.kind) {
    case 'text':
      return <TextBlock text={block.text} />;
    case 'listings':
      return <ListingsBlock ids={block.ids} onNavigate={() => onNavigate?.('listings')} />;
    case 'customers':
      return <CustomersBlock ids={block.ids} onNavigate={() => onNavigate?.('customers')} />;
    case 'transactions':
      return <TransactionsBlock ids={block.ids} />;
    case 'events':
      return <EventsBlock ids={block.ids} />;
    case 'stat':
      return <StatBlock label={block.label} value={block.value} delta={block.delta} />;
    case 'chart':
      return <ChartBlock chart={block.chart} data={block.data} caption={block.caption} />;
    case 'suggest':
      return <SuggestBlock chips={block.chips} onPick={(c) => onSuggest?.(c)} />;
  }
}
