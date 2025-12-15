import type { StorageProvider } from '../storage-provider.ts'

export class FakeStorageProvider implements StorageProvider {
  public files: Record<string, Uint8Array[]> = {}

  async saveFile(
    file: AsyncIterable<Uint8Array> | NodeJS.ReadableStream,
    filename: string,
    folder: string,
  ): Promise<string> {
    const chunks: Uint8Array[] = []

    // Caso seja AsyncIterable (Fastify normalmente usa isso em file.part)
    if (Symbol.asyncIterator in file) {
      for await (const chunk of file as AsyncIterable<Uint8Array>) {
        chunks.push(chunk)
      }
    } else {
      // Caso seja ReadableStream do Node (pode ser string ou Buffer)
      const stream = file as NodeJS.ReadableStream

      for await (const rawChunk of stream) {
        let chunk: Uint8Array

        if (typeof rawChunk === 'string') {
          // converter string → Uint8Array
          chunk = new TextEncoder().encode(rawChunk)
        } else {
          // é Buffer → transformar em Uint8Array
          chunk = new Uint8Array(rawChunk)
        }

        chunks.push(chunk)
      }
    }

    // salvar como mock (opcional)
    this.files[`${folder}/${filename}`] = chunks

    return `fake/${folder}/${filename}`
  }

  async deleteFile(filePath: string): Promise<void> {
    delete this.files[filePath]
  }

  async replaceFile(
    oldFilePath: string | null,
    file: AsyncIterable<Uint8Array> | NodeJS.ReadableStream,
    filename: string,
    folder: string,
  ): Promise<string> {
    if (oldFilePath) {
      await this.deleteFile(oldFilePath)
    }

    return this.saveFile(file, filename, folder)
  }

  async deleteFolder(folderPath: string): Promise<void> {
    // normalizar path (remove / inicial e final)
    const normalizedFolder = folderPath.replace(/^\/+/, '').replace(/\/+$/, '')

    for (const key of Object.keys(this.files)) {
      if (key === normalizedFolder || key.startsWith(`${normalizedFolder}/`)) {
        delete this.files[key]
      }
    }
  }
}
