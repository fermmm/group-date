import { __, column } from './database-manager';
import { Traversal } from './gremlin-typing-tools';

export function valueMap(traversal: Traversal): Traversal {
   return traversal.valueMap().by(__.unfold());
}
