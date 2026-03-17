import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'
import Anthropic from '@anthropic-ai/sdk'

const CREDENTIALS_PATH = join(homedir(), '.claude', '.credentials.json')
const CLIENT_ID = '9d1c250a-e61b-44d9-88ed-5944d1962f5e'
const REFRESH_URL = 'https://console.anthropic.com/api/oauth/token'

// Refresh 5 minutes before expiry
const EXPIRY_BUFFER_MS = 5 * 60 * 1000

let cachedClient = null
let cachedExpiresAt = 0

async function refreshAccessToken(refreshToken) {
  const response = await fetch(REFRESH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: CLIENT_ID,
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Token refresh failed (${response.status}): ${body}`)
  }

  return response.json()
}

function getApiKeyClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return null
  console.log('Using ANTHROPIC_API_KEY from environment')
  return new Anthropic({ apiKey })
}

export async function getClient() {
  // Return cached client if token is still valid
  if (cachedClient && Date.now() < cachedExpiresAt - EXPIRY_BUFFER_MS) {
    return cachedClient
  }

  // Try OAuth first
  try {
    const credentials = JSON.parse(readFileSync(CREDENTIALS_PATH, 'utf-8'))
    const oauth = credentials.claudeAiOauth

    if (oauth) {
      let { accessToken, refreshToken, expiresAt } = oauth

      // If token is expired or about to expire, refresh it
      if (Date.now() >= expiresAt - EXPIRY_BUFFER_MS) {
        console.log('OAuth access token expired, refreshing...')
        const refreshed = await refreshAccessToken(refreshToken)

        accessToken = refreshed.access_token
        refreshToken = refreshed.refresh_token || refreshToken
        expiresAt = refreshed.expires_in
          ? Date.now() + refreshed.expires_in * 1000
          : Date.now() + 8 * 60 * 60 * 1000 // default 8h

        // Write refreshed token back to credentials file
        credentials.claudeAiOauth = {
          ...oauth,
          accessToken,
          refreshToken,
          expiresAt,
        }
        writeFileSync(CREDENTIALS_PATH, JSON.stringify(credentials), 'utf-8')
        console.log('OAuth token refreshed successfully')
      }

      cachedClient = new Anthropic({ authToken: accessToken })
      cachedExpiresAt = expiresAt
      return cachedClient
    }
  } catch (err) {
    console.warn('OAuth auth failed:', err.message)
  }

  // Fallback to API key
  const apiClient = getApiKeyClient()
  if (apiClient) {
    cachedClient = apiClient
    cachedExpiresAt = Date.now() + 24 * 60 * 60 * 1000 // re-check daily
    return cachedClient
  }

  throw new Error('No valid auth: OAuth refresh failed and no ANTHROPIC_API_KEY in environment')
}
