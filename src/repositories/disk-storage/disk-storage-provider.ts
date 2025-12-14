import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { pipeline } from 'node:stream/promises'
import type { StorageProvider } from '../storage-provider.ts'

const UPLOADS_ROOT = path.resolve(process.cwd(), 'uploads')

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
    const absolutePath = path.resolve(
      process.cwd(),
      filePath.replace(/^\/+/, '') // remove "/" inicial
    )
    console.log(absolutePath)
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath)

      const dirPath = path.dirname(absolutePath)

      if (fs.existsSync(dirPath) && fs.readdirSync(dirPath).length === 0) {
        fs.rmdirSync(dirPath)
      }
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

  

  async deleteFolder(folderPath: string): Promise<void> {
    // remove barras iniciais
    const safePath = folderPath.replace(/^\/+/, '')

    // resolve sempre a partir de uploads/
    const absolutePath = path.resolve(UPLOADS_ROOT, safePath.replace(/^uploads[\\/]/, ''))

    // 🔒 segurança: não deixar sair de uploads
    if (!absolutePath.startsWith(UPLOADS_ROOT)) {
      throw new Error('Caminho inválido para deleção')
    }

    if (!fs.existsSync(absolutePath)) {
      return // idempotente
    }

    fs.rmSync(absolutePath, {
      recursive: true,
      force: true,
    })
  }
}
