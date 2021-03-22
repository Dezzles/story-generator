import Token from './tokens'

export default {
  START: [
    [ Token.TEXT ],
    [ Token.START_REF ]
  ],
  START_REF: [
    Token.IDENTIFIER,
    Token.MODIFIER
  ],
  END_REF: 'END_REF',
  MODIFIER: 'MODIFIER',
  ESCAPE: '\\',
  TEXT: 'TEXT',
  SAVE_DIVIDER: 'SAVE_DIVIDER',
  UNKNOWN: 'UNKNOWN',
  IDENTIFIER: 'IDENTIFIER',
  END: 'END'
}
