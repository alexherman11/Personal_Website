// Append-only flat-file store for flyer submissions.
// Format: one JSON record per line (JSONL). Resilient to crashes mid-write
// (a partial last line is just skipped on read), trivial to back up, and
// requires zero native dependencies — perfect for low-volume capture from
// a personal flyer QR code.

import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, '..', 'data')
const SUBMISSIONS_PATH = path.join(DATA_DIR, 'submissions.jsonl')

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

export function appendSubmission(record) {
  ensureDir()
  const entry = {
    id: crypto.randomUUID(),
    ts: new Date().toISOString(),
    ...record,
  }
  // Single fs.appendFileSync call is atomic at the OS level for line-sized
  // writes, so concurrent submissions cannot interleave.
  fs.appendFileSync(SUBMISSIONS_PATH, JSON.stringify(entry) + '\n', 'utf8')
  return entry
}

export function listSubmissions() {
  ensureDir()
  if (!fs.existsSync(SUBMISSIONS_PATH)) return []
  const raw = fs.readFileSync(SUBMISSIONS_PATH, 'utf8')
  const out = []
  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue
    try {
      out.push(JSON.parse(trimmed))
    } catch {
      // Skip corrupt / partial lines silently.
    }
  }
  return out
}
