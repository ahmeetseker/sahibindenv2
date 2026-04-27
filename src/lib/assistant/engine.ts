import { normalize } from './normalize';
import {
  extractLocation,
  extractPriceRange,
  extractAreaRange,
  extractTags,
  extractSegment,
  extractStage,
  extractDay,
  extractEventType,
  extractIds,
} from './extractors';
import { INTENTS, type StoreSnapshot } from './intents';
import type { AssistantResponse, ExtractedParams } from './types';

export function classify(text: string, store: StoreSnapshot): AssistantResponse {
  const norm = normalize(text);
  const params: ExtractedParams = {
    location: extractLocation(norm),
    priceRange: extractPriceRange(norm),
    areaRange: extractAreaRange(norm),
    tags: extractTags(norm),
    segment: extractSegment(norm),
    stage: extractStage(norm),
    day: extractDay(norm),
    eventType: extractEventType(norm),
    ids: extractIds(norm),
  };

  const scores = INTENTS.map((intent) => {
    let score = 0;
    for (const kw of intent.keywords) {
      if (norm.includes(kw)) score += 1;
    }
    if (
      intent.name === 'match.find' &&
      ((params.ids?.listings.length ?? 0) > 0 || (params.ids?.customers.length ?? 0) > 0)
    ) {
      score += 3;
    }
    if (intent.name === 'event.list' && (params.day || params.eventType)) score += 2;
    if (
      intent.name === 'listing.search' &&
      (params.location || (params.tags?.length ?? 0) > 0 || params.priceRange || params.areaRange)
    ) {
      score += 1;
    }
    if (intent.name === 'customer.search' && (params.segment || params.stage)) score += 2;
    if (intent.name === 'transaction.summary' && params.stage) score += 2;
    return { intent, score };
  });

  let best = scores[0];
  for (const s of scores) {
    if (s.score > best.score) best = s;
  }
  if (best.score < 1) {
    const unknownIntent = INTENTS.find((i) => i.name === 'unknown')!;
    return unknownIntent.handle(params, store);
  }
  return best.intent.handle(params, store);
}
