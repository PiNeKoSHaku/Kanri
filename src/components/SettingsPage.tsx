import { useState } from 'react'
import { exportBackup, importBackup } from '../lib/backup'

export function SettingsPage() {
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState<File>()

  const download = async () => {
    const blob = await exportBackup()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `kanri-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const restore = async () => {
    if (!pending) return
    try {
      await importBackup(pending)
      setMessage('復元しました')
    } catch (e) {
      setMessage(`復元できませんでした: ${(e as Error).message}`)
    }
    setPending(undefined)
  }

  return (
    <section className="panel">
      <h2>バックアップ</h2>
      <p className="hint">データはこの端末のブラウザ内だけに保存されています。機種変更や別の端末で使うときは、ここで書き出して読み込んでください。</p>
      <button className="primary" onClick={download}>
        バックアップを書き出す
      </button>
      <label className="field">
        <span>バックアップから復元（今のデータは置き換わります）</span>
        <input type="file" accept="application/json,.json" onChange={(e) => setPending(e.target.files?.[0])} />
      </label>
      {pending && (
        <button className="danger" onClick={restore}>
          {pending.name} で置き換える
        </button>
      )}
      {message && <p className="ok">{message}</p>}
    </section>
  )
}
