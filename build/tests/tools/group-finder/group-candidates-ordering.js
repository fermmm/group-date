"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTestingGroups = exports.getTestingGroupsFilteredAndSorted = exports.analiceFilterAndSortReport = exports.groupAnalysisReport = void 0;
const configurations_1 = require("../../../configurations");
const models_1 = require("../../../components/groups-finder/models");
const group_candidate_analysis_1 = require("../../../components/groups-finder/tools/group-candidate-analysis");
const group_candidate_analysis_2 = require("../../../components/groups-finder/tools/group-candidate-analysis");
const group_candidate_test_editing_1 = require("./group-candidate-test-editing");
const createGroupWith2 = () => (0, group_candidate_test_editing_1.createGroupCandidate)({ amountOfInitialUsers: 2, connectAllWithAll: false });
const createTwoForTwo = () => (0, group_candidate_test_editing_1.createAndAddMultipleUsers)(createGroupWith2(), 2, [0, 1]);
const createGroupWith3 = () => (0, group_candidate_test_editing_1.createGroupCandidate)({ amountOfInitialUsers: 3, connectAllWithAll: false });
const createGroupWith4 = () => (0, group_candidate_test_editing_1.createGroupCandidate)({ amountOfInitialUsers: 4, connectAllWithAll: false });
const createGroupWith5 = () => (0, group_candidate_test_editing_1.createGroupCandidate)({ amountOfInitialUsers: 5, connectAllWithAll: false });
const createGroupWith12 = () => (0, group_candidate_test_editing_1.createGroupCandidate)({ amountOfInitialUsers: 12, connectAllWithAll: false });
const createCircleGroupOf12 = () => (0, group_candidate_test_editing_1.connectMembersWithNeighbors)(createGroupWith12(), true);
const createBigRandomGroup = () => (0, group_candidate_test_editing_1.createAndAddMultipleUsersRandomlyConnected)({
    amountOfUsers: 12,
    minConnectionsPerUser: 4,
    maxConnectionsPerUser: 9,
});
const testGroups = [
    {
        name: "2 for 2",
        group: createTwoForTwo(),
    },
    {
        name: "2 for 2 + 1 extra bisexual",
        group: (0, group_candidate_test_editing_1.createAndAddOneUser)({ group: createTwoForTwo(), connectWith: [1, 0] }),
    },
    {
        name: "2 for 3",
        group: (0, group_candidate_test_editing_1.createAndAddMultipleUsers)(createGroupWith2(), 3, [0, 1]),
    },
    {
        name: "2 for 4",
        group: (0, group_candidate_test_editing_1.createAndAddMultipleUsers)(createGroupWith2(), 4, [0, 1]),
    },
    {
        name: "2 for 5",
        group: (0, group_candidate_test_editing_1.createAndAddMultipleUsers)(createGroupWith2(), 5, [0, 1]),
    },
    {
        name: "2 for 6",
        group: (0, group_candidate_test_editing_1.createAndAddMultipleUsers)(createGroupWith2(), 6, [0, 1]),
    },
    {
        name: "2 for 8",
        group: (0, group_candidate_test_editing_1.createAndAddMultipleUsers)(createGroupWith2(), 8, [0, 1]),
    },
    {
        name: "3 for 3",
        group: (0, group_candidate_test_editing_1.createAndAddMultipleUsers)(createGroupWith3(), 3, "all"),
    },
    {
        name: "3 for 4",
        group: (0, group_candidate_test_editing_1.createAndAddMultipleUsers)(createGroupWith3(), 4, [0, 1, 2]),
    },
    {
        name: "3 for 5",
        group: (0, group_candidate_test_editing_1.createAndAddMultipleUsers)(createGroupWith3(), 5, [0, 1, 2]),
    },
    {
        name: "3 for 6",
        group: (0, group_candidate_test_editing_1.createAndAddMultipleUsers)(createGroupWith3(), 6, [0, 1, 2]),
    },
    {
        name: "3 for 7",
        group: (0, group_candidate_test_editing_1.createAndAddMultipleUsers)(createGroupWith3(), 7, [0, 1, 2]),
    },
    {
        name: "3 for 8",
        group: (0, group_candidate_test_editing_1.createAndAddMultipleUsers)(createGroupWith3(), 8, [0, 1, 2]),
    },
    {
        name: "4 for 5",
        group: (0, group_candidate_test_editing_1.createAndAddMultipleUsers)(createGroupWith4(), 5, [0, 1, 2, 3]),
    },
    {
        name: "4 for 6",
        group: (0, group_candidate_test_editing_1.createAndAddMultipleUsers)(createGroupWith4(), 6, [0, 1, 2, 3]),
    },
    {
        name: "4 for 7",
        group: (0, group_candidate_test_editing_1.createAndAddMultipleUsers)(createGroupWith4(), 7, [0, 1, 2, 3]),
    },
    {
        name: "4 for 8",
        group: (0, group_candidate_test_editing_1.createAndAddMultipleUsers)(createGroupWith4(), 8, [0, 1, 2, 3]),
    },
    {
        name: "4 for 9",
        group: (0, group_candidate_test_editing_1.createAndAddMultipleUsers)(createGroupWith4(), 9, [0, 1, 2, 3]),
    },
    {
        name: "3 All with all",
        group: (0, group_candidate_test_editing_1.createGroupCandidate)({ amountOfInitialUsers: 3, connectAllWithAll: true }),
    },
    {
        name: "3 All with all + 1 with 2 connections",
        group: (0, group_candidate_test_editing_1.createAndAddOneUser)({
            group: (0, group_candidate_test_editing_1.createGroupCandidate)({ amountOfInitialUsers: 3, connectAllWithAll: true }),
            connectWith: [0, 1],
        }),
    },
    {
        name: "5 All with all",
        group: (0, group_candidate_test_editing_1.connectMembersAllWithAll)(createGroupWith5()),
    },
    {
        name: "5 All with all + 1 with 2 connections",
        group: (0, group_candidate_test_editing_1.createAndAddOneUser)({ group: (0, group_candidate_test_editing_1.connectMembersAllWithAll)(createGroupWith5()), connectWith: [0, 2] }),
    },
    {
        name: "1 user with 12 connections, the rest have from 2 to 6 connections",
        group: (0, group_candidate_test_editing_1.createAndAddOneUser)({
            group: (0, group_candidate_test_editing_1.createAndAddMultipleUsersRandomlyConnected)({
                amountOfUsers: 12,
                minConnectionsPerUser: 2,
                maxConnectionsPerUser: 6,
            }),
            connectWith: "all",
        }),
    },
    {
        name: "1 user with 12 connections, the rest have 2 other connections",
        group: (0, group_candidate_test_editing_1.createAndAddOneUser)({ group: createCircleGroupOf12(), connectWith: "all" }),
    },
    {
        name: "12 users with 4 to 9 connections",
        group: createBigRandomGroup(),
    },
    {
        name: "12 users with 4 to 9 connections + 1 of 2",
        group: (0, group_candidate_test_editing_1.createAndAddOneUser)({ group: createBigRandomGroup(), connectWith: [0, 1] }),
    },
];
function groupAnalysisReport() {
    return testGroups.map(item => {
        const group = item.group;
        group.groupId = item.name;
        const groupTrimmed = (0, group_candidate_analysis_1.removeExceedingConnectionsOnGroupCandidate)(item.group, configurations_1.MAX_CONNECTIONS_POSSIBLE_IN_REALITY);
        // Average amount of connections per user, more is a better group as long as inequality is low
        const averageConnections = (0, group_candidate_analysis_1.getAverageConnectionsAmount)(groupTrimmed);
        // (Not used) If this parameter is very close to 1 the group is no 100% heterosexual because it means everybody likes everybody. Also if the number is too low it means a poorly connected group.
        const coverage = (0, group_candidate_analysis_1.getConnectionsCoverageAverage)(group);
        // This is the best algorithm to measure the group quality
        const connectionsMetaconnectionsDistance = (0, group_candidate_analysis_1.getConnectionsMetaconnectionsDistance)(groupTrimmed);
        // (Not used) This is the second best algorithm to measure the group quality
        const inequality = (0, group_candidate_analysis_1.getConnectionsCountInequalityLevel)(groupTrimmed);
        const groupApproved = (0, group_candidate_analysis_2.groupHasMinimumQuality)((0, group_candidate_analysis_1.analiceGroupCandidate)(group));
        const problems = (0, group_candidate_analysis_1.getDataCorruptionProblemsInGroupCandidate)(group);
        return {
            name: group.groupId,
            approvedReport: groupApproved ? "APPROVED" : "NOT MINIMUM QUALITY",
            analysis: {
                inequality: Number(inequality.toFixed(2)),
                conCoverage: Number(coverage.toFixed(2)),
                distConMetaconnection: Number(connectionsMetaconnectionsDistance.toFixed(2)),
                conAmount: Number(averageConnections.toFixed(2)),
            },
            problems: problems.length === 0 ? "OK" : "GROUP ERROR: " + problems,
        };
    });
}
exports.groupAnalysisReport = groupAnalysisReport;
function analiceFilterAndSortReport() {
    const groups = testGroups.map(e => {
        e.group.groupId = e.name;
        return e.group;
    });
    const groupsAnalyzed = (0, models_1.analiceFilterAndSortGroupCandidates)(groups, 0);
    const finalGroups = [];
    groupsAnalyzed.forEach(g => {
        const problems = (0, group_candidate_analysis_1.getDataCorruptionProblemsInGroupCandidate)(g);
        finalGroups.push({
            name: testGroups.findIndex(e => e.group === g.group) === -1
                ? `${g.group.groupId} [MODIFIED]`
                : g.group.groupId,
            usersAmount: g.group.users.length,
            connAmount: Number(g.analysis.averageConnectionsAmount.toFixed(3)),
            connAmountR: g.analysis.averageConnectionsAmountRounded,
            qualityR: g.analysis.qualityRounded,
            quality: Number(g.analysis.quality.toFixed(3)),
            problems: problems.length === 0 ? "OK" : "GROUP ERROR: " + problems,
        });
    });
    return {
        removedGroups: testGroups.length - groupsAnalyzed.toArray().length,
        finalGroups,
    };
}
exports.analiceFilterAndSortReport = analiceFilterAndSortReport;
function getTestingGroupsFilteredAndSorted() {
    const groups = testGroups.map(e => {
        e.group.groupId = e.name;
        return e.group;
    });
    const groupsAnalyzed = (0, models_1.analiceFilterAndSortGroupCandidates)(groups, 0);
    return groupsAnalyzed.toArray();
}
exports.getTestingGroupsFilteredAndSorted = getTestingGroupsFilteredAndSorted;
function getTestingGroups() {
    return testGroups.map(item => {
        const group = item.group;
        group.groupId = item.name;
        return (0, group_candidate_analysis_1.analiceGroupCandidate)(group);
    });
}
exports.getTestingGroups = getTestingGroups;
//# sourceMappingURL=group-candidates-ordering.js.map