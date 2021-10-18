/**
 * In short these two functions mirror each other, one takes the test file path and returns
 * the snapshot path, the other takes the snapshot path and returns the test file path. The
 * third is a file path example for validation.
 */

const path = require("path");

const rootDir = path.resolve(__dirname, "..");

module.exports = {
   testPathForConsistencyCheck: "build/tests/example.test.js",

   /** resolves from test to snapshot path */
   resolveSnapshotPath: (testPath, snapshotExtension) => {
      return testPath.replace("build/tests/", "src/tests/__snapshots__/") + snapshotExtension;
   },

   /** resolves from snapshot to test path */
   resolveTestPath: (snapshotFilePath, snapshotExtension) => {
      return snapshotFilePath
         .replace("src/tests/__snapshots__/", "build/tests/")
         .slice(0, -snapshotExtension.length);
   },
};
