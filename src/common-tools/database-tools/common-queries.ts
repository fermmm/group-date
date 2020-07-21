import { __, column } from './database-manager';
import { Traversal } from './gremlin-typing-tools';

export function valueMap(traversal: Traversal): Traversal {
   return traversal.valueMap().by(__.unfold());
}

export function gremlinArrayMap(list: Traversal, traversalForEachItem: Traversal): Traversal {
   return list
      .project('i')
      .by(traversalForEachItem.fold())
      .unfold()
      .select(column.values)
      .unfold();
}
