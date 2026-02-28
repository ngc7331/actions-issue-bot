import { jest } from '@jest/globals'
import * as core from '../__fixtures__/core.js'
import { parseConfig } from '../__fixtures__/config.js'
import { ContextEvent } from '../src/context/types.js'

const getOctokit = jest.fn().mockReturnValue({ rest: {} })

const evaluateConditions = jest.fn()
const runActions = jest.fn()
const getContext = jest.fn()

jest.unstable_mockModule('@actions/core', () => core)
jest.unstable_mockModule('@actions/github', () => ({ getOctokit }))
jest.unstable_mockModule('../src/config/index.js', () => ({ parseConfig }))
jest.unstable_mockModule('../src/condition/index.js', () => ({
  evaluateConditions
}))
jest.unstable_mockModule('../src/action/index.js', () => ({ runActions }))
jest.unstable_mockModule('../src/context/index.js', () => ({ getContext }))

const { run } = await import('../src/main.js')

describe('main runner', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    delete process.env.GITHUB_TOKEN
    core.getInput.mockReturnValue('')
    core.info.mockClear()
    core.setFailed.mockClear()
  })

  it('fails when token is missing', async () => {
    await run()

    expect(core.setFailed).toHaveBeenCalledWith(
      'A GitHub token is required (set input "token" or GITHUB_TOKEN).'
    )
    expect(parseConfig).not.toHaveBeenCalled()
  })

  it('skips rules when global conditions fail', async () => {
    core.getInput.mockImplementation((key: string) =>
      key === 'token' ? 't0k3n' : ''
    )

    const config = {
      global: [{ event_type: 'issues' as ContextEvent }],
      rules: {
        noop: {
          condition: [{ regex: 'hi' }],
          action: { comment: { message: 'hello' } }
        }
      }
    }

    parseConfig.mockResolvedValue(config)
    getContext.mockReturnValue({ issue_number: 1, event: 'issue_comment' })
    evaluateConditions.mockReturnValueOnce(false)

    await run()

    expect(evaluateConditions).toHaveBeenCalledWith(config.global, {
      issue_number: 1,
      event: 'issue_comment'
    })
    expect(runActions).not.toHaveBeenCalled()
  })

  it('runs actions when rule matches', async () => {
    core.getInput.mockImplementation((key: string) =>
      key === 'token' ? 't0k3n' : ''
    )

    const config = {
      global: undefined,
      rules: {
        greet: {
          condition: [{ regex: 'hi' }],
          action: { comment: { message: 'hello' } }
        }
      }
    }

    parseConfig.mockResolvedValue(config)
    const ctx = { issue_number: 2, event: 'issues' }
    getContext.mockReturnValue(ctx)
    evaluateConditions.mockReturnValue(true)

    await run()

    expect(evaluateConditions).toHaveBeenCalledWith(
      config.rules.greet.condition,
      ctx
    )
    expect(runActions).toHaveBeenCalledWith(
      expect.anything(),
      config.rules.greet.action,
      ctx
    )
  })
})
