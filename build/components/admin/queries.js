"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryToSelectUsersForNotification = exports.queryToGetAllChatsWithAdmins = exports.queryToSaveAdminChatMessage = exports.queryToGetAdminChatMessages = void 0;
const moment = require("moment");
const data_conversion_tools_1 = require("../../common-tools/database-tools/data-conversion-tools");
const database_manager_1 = require("../../common-tools/database-tools/database-manager");
const queries_1 = require("../user/queries");
function queryToGetAdminChatMessages(userId, includeUserData) {
    const projectWithoutUserData = database_manager_1.__.valueMap().by(database_manager_1.__.unfold());
    const projectWithUserData = database_manager_1.__.union(projectWithoutUserData, database_manager_1.__.project("nonAdminUser").by(database_manager_1.__.select("user").valueMap().by(database_manager_1.__.unfold())))
        .unfold()
        .group()
        .by(database_manager_1.__.select(database_manager_1.column.keys))
        .by(database_manager_1.__.select(database_manager_1.column.values));
    return (0, queries_1.queryToGetUserById)(userId)
        .as("user")
        .out("chatWithAdmins")
        .choose(database_manager_1.__.identity(), includeUserData ? projectWithUserData : projectWithoutUserData);
}
exports.queryToGetAdminChatMessages = queryToGetAdminChatMessages;
function queryToSaveAdminChatMessage(userId, updatedMessagesList, lastMessageIsFromAdmin) {
    return (0, queries_1.queryToGetUserById)(userId)
        .as("user")
        .coalesce(database_manager_1.__.out("chatWithAdmins"), database_manager_1.__.addV("chatWithAdmins").as("x").addE("chatWithAdmins").from_("user").select("x"))
        .property(database_manager_1.cardinality.single, "messages", (0, data_conversion_tools_1.serializeIfNeeded)(updatedMessagesList))
        .property(database_manager_1.cardinality.single, "adminHasResponded", lastMessageIsFromAdmin)
        .property(database_manager_1.cardinality.single, "lastMessageDate", moment().unix());
}
exports.queryToSaveAdminChatMessage = queryToSaveAdminChatMessage;
function queryToGetAllChatsWithAdmins(excludeRespondedByAdmin) {
    const projectWithUserData = database_manager_1.__.union(database_manager_1.__.valueMap().by(database_manager_1.__.unfold()), database_manager_1.__.project("nonAdminUser").by(database_manager_1.__.select("user").valueMap().by(database_manager_1.__.unfold())))
        .unfold()
        .group()
        .by(database_manager_1.__.select(database_manager_1.column.keys))
        .by(database_manager_1.__.select(database_manager_1.column.values));
    let traversal = database_manager_1.g.V().hasLabel("chatWithAdmins");
    if (excludeRespondedByAdmin) {
        traversal = traversal.not(database_manager_1.__.has("adminHasResponded", true));
    }
    return traversal.map(database_manager_1.__.as("chat").in_("chatWithAdmins").as("user").select("chat").choose(database_manager_1.__.identity(), projectWithUserData));
}
exports.queryToGetAllChatsWithAdmins = queryToGetAllChatsWithAdmins;
function queryToSelectUsersForNotification(filters) {
    const traversal = (0, queries_1.queryToGetAllCompleteUsers)();
    console.log(filters.usersEmail);
    if (filters.usersEmail && filters.usersEmail.length > 0) {
        traversal.union(...filters.usersEmail.map(email => database_manager_1.__.has("email", email)));
    }
    return traversal;
}
exports.queryToSelectUsersForNotification = queryToSelectUsersForNotification;
//# sourceMappingURL=queries.js.map