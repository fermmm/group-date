import { parseString, Builder } from "xml2js";
import { getFileContent, writeFile } from "../files-tools/files-tools";

/**
 * For some reason TinkerGraph database saves the edges with duplicated
 * ids, so when the backup is loaded it throws errors and loads a
 * corrupted version of the database. This fix loops through all the
 * edges in the xml and modifies their id to make them unique.
 */
export function fixGraphMlBug(filePath: string) {
   const fileContantes = getFileContent(filePath);

   parseString(fileContantes, (err, result) => {
      const edges: any[] = result?.graphml?.graph?.[0]?.edge;
      if (edges == null) {
         return;
      }

      const newEdges = edges.map((edge, i) => {
         const newEdge = { ...edge };

         if (newEdge.$?.id == null) {
            return newEdge;
         }

         newEdge.$.id = i;
         return newEdge;
      });
      result.graphml.graph[0].edge = newEdges;
      var builder = new Builder();
      var xml = builder.buildObject(result);
      writeFile(filePath, xml);
   });
}
