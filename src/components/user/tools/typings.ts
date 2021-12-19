import { User } from "../../../shared-tools/endpoints-interfaces/user";

export type TokenOrId = { token?: string } | { userId?: string };
export type TokenIdOrUser = { token?: string } | { userId?: string } | { user?: Partial<User> };
