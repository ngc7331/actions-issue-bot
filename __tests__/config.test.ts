import { mkdtemp, rm, writeFile } from 'node:fs/promises'
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

  it('resolves relative config paths', async () => {
    const tmpDir = await mkdtemp(path.join(process.cwd(), 'issue-bot-rel-'))
    const filePath = path.join(tmpDir, 'config.yaml')

    await writeFile(
      filePath,
      [
        'rules:',
        '  ping:',
        '    condition:',
        "      - regex: 'ping'",
        '    action:',
        '      comment:',
        "        message: 'pong'"
      ].join('\n')
    )

    const relativePath = path.relative(process.cwd(), filePath)
    const config = await parseConfig(relativePath)

    expect(config.rules.ping.condition).toEqual([{ regex: 'ping' }])

    await rm(tmpDir, { recursive: true, force: true })
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

  it('throws when rule condition is missing', async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'issue-bot-'))
    const filePath = path.join(tmpDir, 'config.yaml')

    await writeFile(
      filePath,
      [
        'rules:',
        '  noop:',
        '    action:',
        '      comment:',
        "        message: 'hi'"
      ].join('\n')
    )

    await expect(parseConfig(filePath)).rejects.toThrow(
      'Rule "noop" is missing a condition block.'
    )
  })

  it('throws when rule action is not an object', async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'issue-bot-'))
    const filePath = path.join(tmpDir, 'config.yaml')

    await writeFile(
      filePath,
      [
        'rules:',
        '  noop:',
        '    condition:',
        '      - regex: hi',
        '    action: false'
      ].join('\n')
    )

    await expect(parseConfig(filePath)).rejects.toThrow(
      'Action for rule "noop" must be an object.'
    )
  })

  it('throws when condition block is not an array', async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'issue-bot-'))
    const filePath = path.join(tmpDir, 'config.yaml')

    await writeFile(
      filePath,
      [
        'rules:',
        '  noop:',
        '    condition: {}',
        '    action:',
        '      comment:',
        "        message: 'hi'"
      ].join('\n')
    )

    await expect(parseConfig(filePath)).rejects.toThrow(
      'Condition block "noop" must be an array.'
    )
  })

  it('throws when global conditions are not an array', async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'issue-bot-'))
    const filePath = path.join(tmpDir, 'config.yaml')

    await writeFile(
      filePath,
      [
        'global: {}',
        'rules:',
        '  noop:',
        '    condition:',
        '      - regex: hi',
        '    action:',
        '      comment:',
        "        message: 'hi'"
      ].join('\n')
    )

    await expect(parseConfig(filePath)).rejects.toThrow(
      'Condition block "global" must be an array.'
    )
  })

  it('throws when condition entry is not an object', async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'issue-bot-'))
    const filePath = path.join(tmpDir, 'config.yaml')

    await writeFile(
      filePath,
      [
        'rules:',
        '  noop:',
        '    condition:',
        '      - 123',
        '    action:',
        '      comment:',
        "        message: 'hi'"
      ].join('\n')
    )

    await expect(parseConfig(filePath)).rejects.toThrow(
      'Condition in "noop" must be an object.'
    )
  })

  it('throws when condition has multiple keys', async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'issue-bot-'))
    const filePath = path.join(tmpDir, 'config.yaml')

    await writeFile(
      filePath,
      [
        'rules:',
        '  noop:',
        '    condition:',
        '      - regex: hi',
        '        member: include',
        '    action:',
        '      comment:',
        "        message: 'hi'"
      ].join('\n')
    )

    await expect(parseConfig(filePath)).rejects.toThrow(
      'Condition in "noop" must have exactly one key; received: regex, member.'
    )
  })

  it('throws when regex condition is not a string', async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'issue-bot-'))
    const filePath = path.join(tmpDir, 'config.yaml')

    await writeFile(
      filePath,
      [
        'rules:',
        '  noop:',
        '    condition:',
        '      - regex: 123',
        '    action:',
        '      comment:',
        "        message: 'hi'"
      ].join('\n')
    )

    await expect(parseConfig(filePath)).rejects.toThrow(
      'regex condition in "noop" must be a string.'
    )
  })

  it('throws when regex_title condition is not a string', async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'issue-bot-'))
    const filePath = path.join(tmpDir, 'config.yaml')

    await writeFile(
      filePath,
      [
        'rules:',
        '  noop:',
        '    condition:',
        '      - regex_title: true',
        '    action:',
        '      comment:',
        "        message: 'hi'"
      ].join('\n')
    )

    await expect(parseConfig(filePath)).rejects.toThrow(
      'regex_title condition in "noop" must be a string.'
    )
  })

  it('throws when nested and/or conditions are invalid', async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'issue-bot-'))
    const filePath = path.join(tmpDir, 'config.yaml')

    await writeFile(
      filePath,
      [
        'rules:',
        '  noop:',
        '    condition:',
        '      - and: {}',
        '    action:',
        '      comment:',
        "        message: 'hi'"
      ].join('\n')
    )

    await expect(parseConfig(filePath)).rejects.toThrow(
      'Condition block "noop.and" must be an array.'
    )
  })

  it('parses complex valid conditions (regex_title/state/member/and/or)', async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'issue-bot-'))
    const filePath = path.join(tmpDir, 'config.yaml')

    await writeFile(
      filePath,
      [
        'global:',
        '  - event_type: issues',
        'rules:',
        '  complex:',
        '    condition:',
        "      - regex_title: 'foo'",
        '      - state: open',
        '      - member: include',
        '      - and:',
        "          - regex: 'bar'",
        '          - or:',
        "              - regex: 'baz'",
        '    action:',
        '      comment:',
        "        message: 'ok'"
      ].join('\n')
    )

    const config = await parseConfig(filePath)

    expect(config.rules.complex.condition?.length).toBe(4)
    expect(config.global).toEqual([{ event_type: 'issues' }])
  })

  it('ignores non-object rule entries during normalization', async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'issue-bot-'))
    const filePath = path.join(tmpDir, 'config.yaml')

    await writeFile(
      filePath,
      [
        'rules:',
        '  valid:',
        '    condition:',
        "      - regex: 'ok'",
        '    action:',
        '      comment:',
        "        message: 'ok'",
        '  invalid: true'
      ].join('\n')
    )

    const config = await parseConfig(filePath)

    expect(config.rules.valid.condition).toEqual([{ regex: 'ok' }])
    expect(config.rules.invalid).toBeUndefined()
  })

  it('allows empty nested condition groups', async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'issue-bot-'))
    const filePath = path.join(tmpDir, 'config.yaml')

    await writeFile(
      filePath,
      [
        'rules:',
        '  noop:',
        '    condition:',
        '      - and:',
        '      - or:',
        '    action:',
        '      comment:',
        "        message: 'hi'"
      ].join('\n')
    )

    const config = await parseConfig(filePath)

    expect(config.rules.noop.condition).toEqual([{ and: null }, { or: null }])
  })

  it('throws on unknown condition key', async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'issue-bot-'))
    const filePath = path.join(tmpDir, 'config.yaml')

    await writeFile(
      filePath,
      [
        'rules:',
        '  nope:',
        '    condition:',
        '      - unknown: value',
        '    action:',
        '      comment:',
        "        message: 'hi'"
      ].join('\n')
    )

    await expect(parseConfig(filePath)).rejects.toThrow(
      'Unknown condition key "unknown" in nope.'
    )
  })
})
