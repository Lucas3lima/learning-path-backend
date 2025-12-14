export interface StorageProvider {
  saveFile(
    file: AsyncIterable<Uint8Array> | NodeJS.ReadableStream,
    filename: string,
    folder: string,
  ): Promise<string>

  deleteFile(filePath: string): Promise<void>

  replaceFile(
    oldFilePath: string | null,
    file: AsyncIterable<Uint8Array> | NodeJS.ReadableStream,
    filename: string,
    folder: string,
  ): Promise<string>

  deleteFolder(folderPath: string): Promise<void>
}
