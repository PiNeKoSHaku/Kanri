import { db, type OwnedMonster, type ZukanEntry } from '../db'

interface BackupFile {
  app: 'kanri'
  version: 1
  exportedAt: string
  zukan: ZukanEntry[]
  owned: OwnedMonster[]
}

export async function exportBackup(): Promise<Blob> {
  const data: BackupFile = {
    app: 'kanri',
    version: 1,
    exportedAt: new Date().toISOString(),
    zukan: await db.zukan.toArray(),
    owned: await db.owned.toArray(),
  }
  return new Blob([JSON.stringify(data)], { type: 'application/json' })
}

/** バックアップで今のデータをすべて置き換える */
export async function importBackup(file: Blob): Promise<void> {
  const data = JSON.parse(await file.text()) as BackupFile
  if (data.app !== 'kanri' || data.version !== 1) throw new Error('このアプリのバックアップファイルではありません')
  await db.transaction('rw', db.zukan, db.owned, async () => {
    await db.zukan.clear()
    await db.owned.clear()
    await db.zukan.bulkAdd(data.zukan)
    await db.owned.bulkAdd(data.owned)
  })
}
