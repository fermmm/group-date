/**
 * Check if an object is of type T by looking for a member inside of it.
 *
 * @param obj The object to check
 * @param memberName: The name of the member the object needs to have in order to be considered of type T
 */
export function checkTypeByMember<T>(obj: any, memberName: keyof T): obj is T {
   return memberName in obj;
}
