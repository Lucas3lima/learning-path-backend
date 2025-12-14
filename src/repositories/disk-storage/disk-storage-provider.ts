import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { pipeline } from 'node:stream/promises'
import type { StorageProvider } from '../storage-provider.ts'

export class DiskStorageProvider implements StorageProvider {
  async saveFile(
    file: AsyncIterable<Uint8Array> | NodeJS.ReadableStream,
    filename: string,
    folder: string,
  ): Promise<string> {
    // Ex.: folder = "plantSlug/journeySlug/moduleSlug"
    const uploadDir = path.resolve('uploads', folder)

    fs.mkdirSync(uploadDir, { recursive: true })

    const finalName = `${randomUUID()}-${filename}`
    const fullPath = path.join(uploadDir, finalName)

    const writeStream = fs.createWriteStream(fullPath)

    // Mesma lógica antiga: pipeline() -> grava o PDF
    await pipeline(file, writeStream)

    // Retorna URL do mesmo jeito do código antigo:
    // /uploads/plantSlug/journeySlug/moduleSlug/file.pdf
    return `/uploads/${folder}/${finalName}`
  }

  async deleteFile(filePath: string): Promise<void> {
    const absolutePath = path.resolve('',filePath)

    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath)
    }
  }

  async replaceFile(
    oldFilePath: string | null, 
    file: AsyncIterable<Uint8Array> | NodeJS.ReadableStream, 
    filename: string, 
    folder: string) {

      if(oldFilePath !== null) {
        await this.deleteFile(oldFilePath)
      }

      return this.saveFile(file, filename, folder)
  }
}
