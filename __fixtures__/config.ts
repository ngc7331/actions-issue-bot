import { jest } from '@jest/globals'
import { parseConfig as _parseConfig } from '../src/config/parser.js'

export const parseConfig = jest.fn<typeof _parseConfig>()
