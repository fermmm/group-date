"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearLogsPendingToSave = exports.getLogsPendingToSave = exports.getAllInMemoryLogs = exports.deleteInMemoryLogEntry = exports.setInMemoryLog = exports.getInMemoryLog = void 0;
const config_1 = require("../config");
let logsInMemory = {};
const logsPendingToSave = new Set();
function getInMemoryLog(logId) {
    var _a;
    return (_a = logsInMemory[logId]) !== null && _a !== void 0 ? _a : "";
}
exports.getInMemoryLog = getInMemoryLog;
function setInMemoryLog(logId, newLogContent) {
    logsInMemory[logId] = newLogContent;
    logsPendingToSave.add(logId);
}
exports.setInMemoryLog = setInMemoryLog;
function deleteInMemoryLogEntry(logId, entryId) {
    const currentLogInMem = getInMemoryLog(logId);
    const newLogContent = currentLogInMem
        .split(config_1.ENTRY_SEPARATOR_STRING)
        .filter(log => JSON.parse(log).entryId !== entryId)
        .join(config_1.ENTRY_SEPARATOR_STRING);
    setInMemoryLog(logId, newLogContent);
}
exports.deleteInMemoryLogEntry = deleteInMemoryLogEntry;
function getAllInMemoryLogs() {
    return logsInMemory;
}
exports.getAllInMemoryLogs = getAllInMemoryLogs;
function getLogsPendingToSave() {
    return Array.from(logsPendingToSave);
}
exports.getLogsPendingToSave = getLogsPendingToSave;
function clearLogsPendingToSave() {
    logsPendingToSave.clear();
}
exports.clearLogsPendingToSave = clearLogsPendingToSave;
//# sourceMappingURL=log-storage-memory.js.map