import { db, type Monster, type OwnedMonster, type Photo } from '../db'

interface BackupFile {
  app: 'kanri'
  version: 2
  exportedAt: string
  monsters: Monster[]
  photos: Photo[]
  owned: OwnedMonster[]
}

/** version 1（図鑑No.をキーにしていた版）のバックアップ */
interface BackupFileV1 {
  app: 'kanri'
  version: 1
  zukan: { no: number; name: string; element: Monster['element']; rarity: number; icon: string; createdAt: number }[]
  owned: (Omit<OwnedMonster, 'monsterId'> & { no: number })[]
}

export async function exportBackup(): Promise<Blob> {
  const data: BackupFile = {
    app: 'kanri',
    version: 2,
    exportedAt: new Date().toISOString(),
    monsters: await db.monsters.toArray(),
    photos: await db.photos.toArray(),
    owned: await db.owned.toArray(),
  }
  return new Blob([JSON.stringify(data)], { type: 'application/json' })
}

function fromV1(v1: BackupFileV1): BackupFile {
  return {
    app: 'kanri',
    version: 2,
    exportedAt: '',
    monsters: v1.zukan.map((z) => ({ ...z, id: z.no })),
    photos: [],
    owned: v1.owned.map(({ no, ...o }) => ({ ...o, monsterId: no })),
  }
}

/** バックアップで今のデータをすべて置き換える */
export async function importBackup(file: Blob): Promise<void> {
  const raw = JSON.parse(await file.text()) as BackupFile | BackupFileV1
  if (raw.app !== 'kanri' || (raw.version !== 1 && raw.version !== 2)) {
    throw new Error('このアプリのバックアップファイルではありません')
  }
  const data = raw.version === 1 ? fromV1(raw) : raw
  await db.transaction('rw', db.monsters, db.photos, db.owned, async () => {
    await db.monsters.clear()
    await db.photos.clear()
    await db.owned.clear()
    await db.monsters.bulkAdd(data.monsters)
    await db.photos.bulkAdd(data.photos)
    await db.owned.bulkAdd(data.owned)
  })
}
