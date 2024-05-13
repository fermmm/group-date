"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkTypeByMember = void 0;
/**
 * Check if an object is of type T by looking for a member inside of it.
 *
 * @param obj The object to check
 * @param memberName: The name of the member the object needs to have in order to be considered of type T
 */
function checkTypeByMember(obj, memberName) {
    return memberName in obj;
}
exports.checkTypeByMember = checkTypeByMember;
//# sourceMappingURL=ts-tools.js.map