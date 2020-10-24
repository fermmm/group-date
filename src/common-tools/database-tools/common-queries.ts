import { serializeAllValuesIfNeeded } from './data-conversion-tools';
import { __, g, P } from './database-manager';
import { GremlinValueType, Traversal } from './gremlin-typing-tools';

export function valueMap(traversal: Traversal): Traversal {
   return traversal.valueMap().by(__.unfold());
}

/**
 * Given a list of objects, creates vertices with the same properties. Be aware this is done all in the
 * same query and Gremlin has a limit on the query size, if the query never responds you need to divide
 * the list of objects in chunks and call this multiple times.
 *
 * @param objects The objects list to create vertices from them.
 * @param verticesLabel The label of the vertices
 * @param duplicationAvoidanceProperty Property name usually the id, if a vertex already exists with the same value on this property then the vertex will not be created
 * @param serializeProperties Serialize all properties to types that are compatible with Gremlin. default = true
 */
export function queryToCreateVerticesFromObjects<T>(
   objects: T[],
   verticesLabel: string,
   duplicationAvoidanceProperty?: keyof T,
   serializeProperties: boolean = true,
   currentTraversal?: Traversal,
): Traversal {
   if (currentTraversal == null) {
      currentTraversal = (g as unknown) as Traversal;
   }

   let objectsReadyForDB: Array<Record<keyof T, GremlinValueType>> | T[];

   objectsReadyForDB = !serializeProperties ? objects : objects.map(o => serializeAllValuesIfNeeded(o));

   let creationTraversal: Traversal = __.addV(verticesLabel);
   Object.keys(objectsReadyForDB[0]).forEach(
      key => (creationTraversal = creationTraversal.property(key, __.select(key))),
   );

   if (duplicationAvoidanceProperty == null) {
      return currentTraversal.inject(objectsReadyForDB).unfold().map(creationTraversal);
   } else {
      return currentTraversal
         .inject([])
         .as('nothing')
         .inject(objectsReadyForDB)
         .unfold()
         .map(
            __.as('data')
               .select(duplicationAvoidanceProperty)
               .as('dap')
               .select('data')
               .choose(
                  __.V()
                     .hasLabel(verticesLabel)
                     .has(duplicationAvoidanceProperty, __.where(P.eq('dap'))),
                  __.select('nothing'),
                  creationTraversal,
               ),
         )
         .unfold();
   }
}
