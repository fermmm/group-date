/**
 * Prompts to save a string to a file. When the file is saved a FileHandle object is returned. The file
 * handle object can be used to read and to write to a file using setFileContents() and getFileContents().
 * If the types on this function are not found install @types/wicg-file-system-access
 *
 * @param fileContent
 * @param suggestedFileName
 * @param id Optional. By default, each file picker would open at the last-remembered location. You can circumvent this by storing id values for each type of picker. If an id is specified, the file picker implementation will remember a separate last-used directory for pickers with that same id.
 * @param extension Optional. With this property you can filter the files that the file picker displays.
 */
export async function promptToSaveFile(props: { suggestedName?: string; id?: string; extension?: string }) {
   const { suggestedName, id, extension } = props;

   const options = {
      id,
      suggestedName,
      types: [
         {
            description: `${extension} Files`,
            accept: {
               "text/plain": [`.${extension}`],
            },
         },
      ],
   };

   return await window.showSaveFilePicker(options);
}

/**
 * Prompts to open a file. When the file is opened a FileHandle object is returned. The file
 * handle object can be used to read and to write to a file using setFileContents() and getFileContents().
 * If the types on this function are not found install @types/wicg-file-system-access
 */
export async function promptToLoadFile(): Promise<FileSystemFileHandle> {
   const [fileHandle] = await window.showOpenFilePicker();
   return fileHandle;
}

/**
 * If the types on this function are not found install @types/wicg-file-system-access
 *
 * @param fileHandle
 * @returns
 */
export async function getFileContent(fileHandle: FileSystemFileHandle) {
   const file = await fileHandle.getFile();
   return await file.text();
}

/**
 * If the types on this function are not found install @types/wicg-file-system-access
 *
 * @param fileHandle
 * @param newContent
 */
export async function setFileContent(fileHandle: FileSystemFileHandle, newContent: string) {
   // Create a FileSystemWritableFileStream to write to.
   const writable = await fileHandle.createWritable();
   // Write the contents of the file to the stream.
   await writable.write(newContent);
   // Close the file and write the contents to disk.
   await writable.close();
}
