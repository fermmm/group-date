import { process } from 'gremlin';
import { __ } from './database-manager';

export function valueMap(traversal: process.GraphTraversal): process.GraphTraversal {
   return traversal.valueMap().by(__.unfold());
}
