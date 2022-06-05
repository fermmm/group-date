import { GROUP_PROPS_TO_ENCODE } from "../../api/tools/shared-tools/validators/group";
import { TAG_PROPS_TO_ENCODE } from "../../api/tools/shared-tools/validators/tags";
import { USER_PROPS_TO_ENCODE } from "../../api/tools/shared-tools/validators/user";

/**
 * Tries to determine if the given prop name is probably encoded.
 */
export function isProbablyEncodedProp(propName: string): boolean {
   return (
      // @ts-ignore
      USER_PROPS_TO_ENCODE.has(propName) ||
      // @ts-ignore
      GROUP_PROPS_TO_ENCODE.has(propName) ||
      // @ts-ignore
      TAG_PROPS_TO_ENCODE.has(propName)
   );
}
