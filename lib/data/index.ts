import type { Expansion } from '../types';
import { EXPANSIONS } from './expansions.generated';
import { SETUPS } from './setups.generated';

export { EXPANSIONS, SETUPS };

const byId = new Map<string, Expansion>(EXPANSIONS.map((e) => [e.id, e]));

export function getExpansion(id: string): Expansion | undefined {
  return byId.get(id);
}
