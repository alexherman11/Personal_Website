// Narrator backend that shells out to the local `claude` CLI in print mode.
//
// It exposes the same tiny surface the route code uses from the Anthropic SDK
// (`client.messages.create({ model, max_tokens, system, messages })`) so the
// narrator gets *exactly* the same system prompt and conversation it would get
// over the API — only the transport differs. Enabled with
// NARRATOR_BACKEND=claude-cli, or automatically when no API key / OAuth
// credentials are available but a `claude` binary is on PATH.

import { spawn } from 'child_process'
import { mkdtempSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

const CLI_BIN = process.env.CLAUDE_CLI_BIN || 'claude'
const CLI_TIMEOUT_MS = Number(process.env.CLAUDE_CLI_TIMEOUT_MS || 90_000)

// Run the CLI from an empty directory so no CLAUDE.md / project settings leak
// into the narrator's context.
let workDir = null
function getWorkDir() {
  if (!workDir) workDir = mkdtempSync(join(tmpdir(), 'depths-narrator-'))
  return workDir
}

// The API path sends a real multi-turn message list. Print mode takes one
// prompt, so earlier turns are replayed verbatim as a labelled transcript and
// the newest player message is left as the final user turn.
function flattenMessages(messages) {
  const history = messages.slice(0, -1)
  const last = messages[messages.length - 1]
  if (history.length === 0) return last.content
  const transcript = history
    .map(m => `[${m.role === 'assistant' ? 'YOU (narrator)' : 'PLAYER'}]: ${m.content}`)
    .join('\n\n')
  return [
    'Conversation so far (oldest first; your earlier replies are shown verbatim):',
    transcript,
    '',
    `[PLAYER]: ${last.content}`,
  ].join('\n')
}

function runCli({ model, system, prompt }) {
  return new Promise((resolve, reject) => {
    const args = [
      '-p',
      '--model', model,
      '--tools', '',
      '--output-format', 'json',
      '--no-session-persistence',
      '--permission-mode', 'dontAsk',
      '--system-prompt', system,
    ]
    const env = { ...process.env }
    delete env.CLAUDECODE // allow nesting from inside a Claude Code session
    const child = spawn(CLI_BIN, args, { cwd: getWorkDir(), env, stdio: ['pipe', 'pipe', 'pipe'] })
    let out = ''
    let err = ''
    const timer = setTimeout(() => {
      child.kill('SIGKILL')
      reject(Object.assign(new Error('claude CLI timed out'), { status: 504 }))
    }, CLI_TIMEOUT_MS)
    child.stdout.on('data', d => { out += d })
    child.stderr.on('data', d => { err += d })
    child.on('error', e => { clearTimeout(timer); reject(e) })
    child.on('close', code => {
      clearTimeout(timer)
      let parsed
      try { parsed = JSON.parse(out) } catch {
        return reject(new Error(`claude CLI returned non-JSON (exit ${code}): ${(out || err).slice(0, 300)}`))
      }
      if (parsed.is_error) {
        const e = new Error(`claude CLI error: ${parsed.result}`)
        if (/rate|overloaded|429/i.test(parsed.result || '')) e.status = 429
        if (/auth/i.test(parsed.result || '')) e.status = 401
        return reject(e)
      }
      resolve(parsed)
    })
    child.stdin.end(prompt)
  })
}

export function createCliClient() {
  const messages = {
    // Extra API-only params (betas, fallbacks, output_config) are ignored here.
    async create({ model, system, messages }) {
      const prompt = flattenMessages(messages)
      const result = await runCli({ model, system, prompt })
      return {
        content: [{ type: 'text', text: result.result || '' }],
        usage: result.usage,
        model,
      }
    },
  }
  return { backend: 'claude-cli', messages, beta: { messages } }
}
