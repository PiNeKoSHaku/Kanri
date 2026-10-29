import { db, type OwnedMonster, type ZukanEntry } from '../db'
import { blobToDataUrl, dataUrlToBlob } from './image'

interface BackupFile {
  app: 'kanri'
  version: 1
  exportedAt: string
  zukan: (Omit<ZukanEntry, 'icon'> & { icon: string })[]
  owned: OwnedMonster[]
}

export async function exportBackup(): Promise<Blob> {
  const zukan = await db.zukan.toArray()
  const data: BackupFile = {
    app: 'kanri',
    version: 1,
    exportedAt: new Date().toISOString(),
    zukan: await Promise.all(zukan.map(async (z) => ({ ...z, icon: await blobToDataUrl(z.icon) }))),
    owned: await db.owned.toArray(),
  }
  return new Blob([JSON.stringify(data)], { type: 'application/json' })
}

/** バックアップで今のデータをすべて置き換える */
export async function importBackup(file: Blob): Promise<void> {
  const data = JSON.parse(await file.text()) as BackupFile
  if (data.app !== 'kanri' || data.version !== 1) throw new Error('このアプリのバックアップファイルではありません')
  const zukan: ZukanEntry[] = await Promise.all(
    data.zukan.map(async (z) => ({ ...z, icon: await dataUrlToBlob(z.icon) })),
  )
  await db.transaction('rw', db.zukan, db.owned, async () => {
    await db.zukan.clear()
    await db.owned.clear()
    await db.zukan.bulkAdd(zukan)
    await db.owned.bulkAdd(data.owned)
  })
}
