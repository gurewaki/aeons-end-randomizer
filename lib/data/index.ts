import type { Expansion } from '../types';
import { EXPANSIONS } from './expansions.generated';

export { EXPANSIONS };

const byId = new Map<string, Expansion>(EXPANSIONS.map((e) => [e.id, e]));

export function getExpansion(id: string): Expansion | undefined {
  return byId.get(id);
}
