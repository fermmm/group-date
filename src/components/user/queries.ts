import { process } from 'gremlin';
import { serializeIfNeeded } from '../../common-tools/database-tools/data-convertion-tools';
import { EditableUserProp, editableUserPropsList } from '../../shared-tools/validators/user';
import { getUserTraversalByToken } from '../common/queries';

export async function setUserProps(
   token: string,
   userProps: Record<EditableUserProp, number | string | boolean | string[]>,
): Promise<void> {
   let query: process.GraphTraversal = getUserTraversalByToken(token);

   editableUserPropsList.forEach(editableUserProp => {
      if (userProps[editableUserProp] != null) {
         query = query.property(editableUserProp, serializeIfNeeded(userProps[editableUserProp]));
      }
   });

   return query.iterate();
}
