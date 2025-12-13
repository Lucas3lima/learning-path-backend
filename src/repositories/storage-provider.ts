export interface StorageProvider {
  saveFile(
    file: AsyncIterable<Uint8Array> | NodeJS.ReadableStream,
    filename: string,
    folder: string,
  ): Promise<string>

  deleteFile(filePath: string): Promise<void>

  replaceFile(
    oldFilePath: string,
    file: AsyncIterable<Uint8Array> | NodeJS.ReadableStream,
    filename: string,
    folder: string,
  ): Promise<string>
}
