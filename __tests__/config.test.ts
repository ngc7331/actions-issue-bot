import { mkdtemp, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { parseConfig } from '../src/config/index.js'

describe('config.parseConfig', () => {
  it('parses YAML config and normalizes rule entries', async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'issue-bot-'))
    const filePath = path.join(tmpDir, 'config.yaml')

    await writeFile(
      filePath,
      [
        'rules:',
        '  greeting:',
        '    condition:',
        "      - regex: 'bug'",
        '    action:',
        '      comment:',
        "        message: 'Hello {{ issue.author }}'",
        "    ignored: 'should be dropped'"
      ].join('\n')
    )

    const config = await parseConfig(filePath)

    expect(config.rules.greeting.condition).toEqual([{ regex: 'bug' }])
    expect(config.rules.greeting.action?.comment?.message).toBe(
      'Hello {{ issue.author }}'
    )
    expect(
      (config.rules.greeting as Record<string, unknown>).ignored
    ).toBeUndefined()
  })

  it('throws when the rules map is missing', async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'issue-bot-'))
    const filePath = path.join(tmpDir, 'config.yaml')

    await writeFile(filePath, 'version: 1')

    await expect(parseConfig(filePath)).rejects.toThrow(
      'Configuration file is empty or invalid'
    )
  })
})
