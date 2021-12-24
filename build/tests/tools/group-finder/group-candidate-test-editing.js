"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectMembersWithNeighbors = exports.connectMembersRandomly = exports.connectMembersAllWithAll = exports.connectSingleMemberWithAll = exports.createAndAddMultipleUsersRandomlyConnected = exports.createAndAddMultipleUsers = exports.createAndAddOneUser = exports.addUsersToGroupWithCustomIds = exports.createGroupCandidateWithCustomIds = exports.createGroupCandidate = void 0;
const group_candidate_editing_1 = require("../../../components/groups-finder/tools/group-candidate-editing");
const generalTools_1 = require("../generalTools");
const string_tools_1 = require("../../../common-tools/string-tools/string-tools");
/**
 * Creates a group candidate.
 * @param amountOfInitialUsers Unconnected users to create as the initial users
 * @param connectAllWithAll Connect all users with all
 */
function createGroupCandidate(props) {
    let resultGroup = {
        groupId: props.customId != null ? props.customId : (0, string_tools_1.generateId)(),
        users: [],
    };
    for (let i = 0; i < props.amountOfInitialUsers; i++) {
        resultGroup = createAndAddOneUser({
            group: resultGroup,
            connectWith: props.connectAllWithAll ? "all" : [],
        });
    }
    return resultGroup;
}
exports.createGroupCandidate = createGroupCandidate;
function createGroupCandidateWithCustomIds(props) {
    let resultGroup = {
        groupId: (0, string_tools_1.generateId)(),
        users: [],
    };
    props.usersIds.forEach(userId => (resultGroup = createAndAddOneUser({
        group: resultGroup,
        connectWith: props.connectAllWithAll ? "all" : [],
        userId,
    })));
    return resultGroup;
}
exports.createGroupCandidateWithCustomIds = createGroupCandidateWithCustomIds;
function addUsersToGroupWithCustomIds(props) {
    let resultGroup = (0, group_candidate_editing_1.copyGroupCandidate)(props.group);
    props.usersIds.forEach(userId => (resultGroup = createAndAddOneUser({
        group: resultGroup,
        connectWith: props.connectWith,
        userId,
    })));
    return resultGroup;
}
exports.addUsersToGroupWithCustomIds = addUsersToGroupWithCustomIds;
/**
 * Creates a group candidate fake user. Also adds the user to the group and connects other users according to the provided connections array.
 * Returns a copy of the group containing with the changes.
 * @param connectWith List of users from the provided group to connect with as a list of indexes to find them in the group candidate (not the userId). If null it will connect the fake users will all current users in the group, pass [] to do not connect the new fake users.
 */
function createAndAddOneUser(props) {
    var _a;
    const resultGroup = (0, group_candidate_editing_1.copyGroupCandidate)(props.group);
    const connectWith = props.connectWith === "all" ? (0, group_candidate_editing_1.getUsersFromGroupCandidateAsIndexList)(resultGroup) : props.connectWith;
    const newUser = {
        userId: (_a = props.userId) !== null && _a !== void 0 ? _a : (0, string_tools_1.generateId)(),
        matches: connectWith.map(i => resultGroup.users[i].userId),
    };
    newUser.matches.forEach(userMatch => (0, group_candidate_editing_1.getUserByIdOnGroupCandidate)(resultGroup, userMatch).matches.push(newUser.userId));
    resultGroup.users.push(newUser);
    return resultGroup;
}
exports.createAndAddOneUser = createAndAddOneUser;
/**
 * Creates multiple fake users and adds them to a group candidate.
 * All will have the same provided connections.
 * Only to be used on testing.
 *
 * @param amountOfUsers Amount of users to add
 * @param connectWith List of users from the provided group to connect with as a list of indexes to find them in the group (this doesn't work with the userId). If null it will connect the fake users will all current users in the group, pass [] to do not connect the new fake users.
 */
function createAndAddMultipleUsers(group, amountOfUsers, connectWith) {
    let resultGroup = (0, group_candidate_editing_1.copyGroupCandidate)(group);
    connectWith = connectWith !== null && connectWith !== void 0 ? connectWith : (0, group_candidate_editing_1.getUsersFromGroupCandidateAsIndexList)(resultGroup);
    for (let i = 0; i < amountOfUsers; i++) {
        resultGroup = createAndAddOneUser({ group: resultGroup, connectWith });
    }
    return resultGroup;
}
exports.createAndAddMultipleUsers = createAndAddMultipleUsers;
/**
 * Creates fake users and adds them to the group, then connects them randomly with the previous members of the group.
 */
function createAndAddMultipleUsersRandomlyConnected(params) {
    let resultGroup = params.group != null
        ? (0, group_candidate_editing_1.copyGroupCandidate)(params.group)
        : createGroupCandidate({ amountOfInitialUsers: 0, connectAllWithAll: false });
    for (let i = 0; i < params.amountOfUsers; i++) {
        const connectWith = getRandomArrayIndexes(resultGroup.users.length, generalTools_1.chance.integer({ min: params.minConnectionsPerUser, max: params.maxConnectionsPerUser }));
        resultGroup = createAndAddOneUser({ group: resultGroup, connectWith });
    }
    return resultGroup;
}
exports.createAndAddMultipleUsersRandomlyConnected = createAndAddMultipleUsersRandomlyConnected;
function connectSingleMemberWithAll(groupOfTheUser, user) {
    const resultGroup = (0, group_candidate_editing_1.copyGroupCandidate)(groupOfTheUser);
    const userFromResultGroup = (0, group_candidate_editing_1.getUserByIdOnGroupCandidate)(resultGroup, user.userId);
    resultGroup.users.forEach(u => {
        (0, group_candidate_editing_1.connectUsers)(userFromResultGroup, u);
    });
    return resultGroup;
}
exports.connectSingleMemberWithAll = connectSingleMemberWithAll;
function connectMembersAllWithAll(group) {
    const resultGroup = (0, group_candidate_editing_1.copyGroupCandidate)(group);
    resultGroup.users.forEach(user => {
        resultGroup.users.forEach(userToConnect => {
            (0, group_candidate_editing_1.connectUsers)(user, userToConnect);
        });
    });
    return resultGroup;
}
exports.connectMembersAllWithAll = connectMembersAllWithAll;
function connectMembersRandomly(group, minConnectionsPerUser, maxConnectionsPerUser) {
    const resultGroup = (0, group_candidate_editing_1.copyGroupCandidate)(group);
    resultGroup.users.forEach((user, i) => {
        const randomIndexes = getRandomArrayIndexes(resultGroup.users.length, generalTools_1.chance.integer({ min: minConnectionsPerUser, max: maxConnectionsPerUser }), 
        // Exclude it's own index so it does not get connected with itself
        i);
        randomIndexes.forEach(randomIndex => {
            (0, group_candidate_editing_1.connectUsers)(user, resultGroup.users[randomIndex]);
        });
    });
    return resultGroup;
}
exports.connectMembersRandomly = connectMembersRandomly;
/**
 * Example: Connects 2 with 1 and 3, and so on...
 * @param loop Connect the last one with the first one generating a "circle"
 */
function connectMembersWithNeighbors(group, loop = false) {
    const resultGroup = (0, group_candidate_editing_1.copyGroupCandidate)(group);
    resultGroup.users.forEach((user, i) => {
        if (i - 1 >= 0) {
            (0, group_candidate_editing_1.connectUsers)(user, resultGroup.users[i - 1]);
        }
        else if (loop) {
            (0, group_candidate_editing_1.connectUsers)(user, resultGroup.users[resultGroup.users.length - 1]);
        }
        if (i + 1 < resultGroup.users.length) {
            (0, group_candidate_editing_1.connectUsers)(user, resultGroup.users[i + 1]);
        }
        else if (loop) {
            (0, group_candidate_editing_1.connectUsers)(user, resultGroup.users[0]);
        }
    });
    return resultGroup;
}
exports.connectMembersWithNeighbors = connectMembersWithNeighbors;
function getRandomArrayIndexes(arrayLength, amount, exclude = null) {
    let result = [];
    for (let i = 0; i < arrayLength; i++) {
        if (i !== exclude) {
            result.push(i);
        }
    }
    result = generalTools_1.chance.shuffle(result);
    result = result.slice(0, amount);
    return result;
}
//# sourceMappingURL=group-candidate-test-editing.js.map