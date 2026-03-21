// POST /api/validate
// Body: { idea: string }
// Streams Claude response as text/event-stream

import Anthropic from '@anthropic-ai/sdk'
import { SYSTEM_PROMPT } from '../systemPrompt.js'

export async function validateRoute(req, res) {
  const { idea } = req.body
  if (!idea || idea.trim().length < 20) {
    return res.status(400).json({ error: 'Idea too short.' })
  }

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  const client = new Anthropic()
  const stream = client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: idea }],
  })

  try {
    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        res.write(chunk.delta.text)
      }
    }
    res.end()
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: 'Validation failed. Please try again.' })
    } else {
      res.end()
    }
  }
}
