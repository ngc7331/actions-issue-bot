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
      (config.rules.greeting as unknown as Record<string, unknown>).ignored
    ).toBeUndefined()
  })

  it('parses global conditions', async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'issue-bot-'))
    const filePath = path.join(tmpDir, 'config.yaml')

    await writeFile(
      filePath,
      [
        'global:',
        '  - event_type: issue_comment',
        'rules:',
        '  ping:',
        '    condition:',
        "      - regex: 'ping'",
        '    action:',
        '      comment:',
        "        message: 'pong'"
      ].join('\n')
    )

    const config = await parseConfig(filePath)

    expect(config.global).toEqual([{ event_type: 'issue_comment' }])
    expect(config.rules.ping.condition).toEqual([{ regex: 'ping' }])
  })

  it('throws when the rules map is missing', async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'issue-bot-'))
    const filePath = path.join(tmpDir, 'config.yaml')

    await writeFile(filePath, 'version: 1')

    await expect(parseConfig(filePath)).rejects.toThrow(
      'Configuration file is empty or invalid'
    )
  })

  it('throws on invalid event_type value', async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'issue-bot-'))
    const filePath = path.join(tmpDir, 'config.yaml')

    await writeFile(
      filePath,
      [
        'global:',
        '  - event_type: wrong',
        'rules:',
        '  noop:',
        '    action:',
        '      comment:',
        "        message: 'hi'"
      ].join('\n')
    )

    await expect(parseConfig(filePath)).rejects.toThrow(
      'Invalid event_type value "wrong"'
    )
  })

  it('throws on invalid state value', async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'issue-bot-'))
    const filePath = path.join(tmpDir, 'config.yaml')

    await writeFile(
      filePath,
      [
        'rules:',
        '  close_if_needed:',
        '    condition:',
        '      - state: pending',
        '    action:',
        '      state:',
        '        reason: completed'
      ].join('\n')
    )

    await expect(parseConfig(filePath)).rejects.toThrow(
      'Invalid state value "pending"'
    )
  })

  it('throws on invalid member value', async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'issue-bot-'))
    const filePath = path.join(tmpDir, 'config.yaml')

    await writeFile(
      filePath,
      [
        'rules:',
        '  triage:',
        '    condition:',
        '      - member: sometimes',
        '    action:',
        '      comment:',
        "        message: 'hi'"
      ].join('\n')
    )

    await expect(parseConfig(filePath)).rejects.toThrow(
      'Invalid member value "sometimes"'
    )
  })
})
