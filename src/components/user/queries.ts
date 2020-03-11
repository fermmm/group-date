import { process } from 'gremlin';
import { EditableUserProp, editableUserPropsList } from '../../shared-tools/validators/user';
import { getUserTraversalByToken } from '../common/queries';

export async function setUserProps(token: string, userProps: Record<EditableUserProp, number | string>): Promise<void> {
   let query: process.GraphTraversal = getUserTraversalByToken(token);
   /**
    * Loop trough the editableUserPropsList instead of looping params.props because params.props
    * comes from the request and the system should not be stressed with a possible big object attack.
    */
   editableUserPropsList.forEach(editableUserProp => {
      if (userProps[editableUserProp] != null) {
         query = query.property(editableUserProp, userProps[editableUserProp]);
      }
   });

   return query.iterate();
}
