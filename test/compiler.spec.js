import Compiler from '../src/Compiler'
import { expect } from 'chai'
import Token from '../src/Tokens'
import Modifier from '../src/Modifiers'

describe('Compiler', function () {
  describe('tokenise', function () {
    it('tokenises correctly', function () {
      const compiler = new Compiler()
      const result = compiler.tokenise('start {} mid {{ * _ someRef second) : savedRef }} end')
      expect(result)
        .to.deep.include.ordered.members([
          { token: Token.START },
          { token: Token.TEXT, data: 'start {} mid ', pos: 0 },
          { token: Token.START_REF, pos: 13 },
          { token: Token.MODIFIER, type: Modifier.PLURAL, pos: 16 },
          { token: Token.MODIFIER, type: Modifier.LOWERCASE, pos: 18 },
          { token: Token.IDENTIFIER, identifier: 'someRef', pos: 20 },
          { token: Token.IDENTIFIER, identifier: 'second', pos: 28 },
          { token: Token.UNKNOWN, data: ')', pos: 34 },
          { token: Token.SAVE_DIVIDER, pos: 36 },
          { token: Token.IDENTIFIER, identifier: 'savedRef', pos: 38 },
          { token: Token.END_REF, pos: 47 },
          { token: Token.TEXT, data: ' end', pos: 49 },
          { token: Token.END }
        ])
    })
    it('tokenises correctly', function () {
      const compiler = new Compiler()
      const result = compiler.tokenise('{{firstName}} {{lastName}}')
      expect(result)
        .to.deep.include.ordered.members([
          { token: Token.START },
          { token: Token.START_REF, pos: 0 },
          { token: Token.IDENTIFIER, identifier: 'firstName', pos: 2 },
          { token: Token.END_REF, pos: 11 },
          { token: Token.TEXT, pos: 13, data: ' ' },
          { token: Token.START_REF, pos: 14 },
          { token: Token.IDENTIFIER, identifier: 'lastName', pos: 16 },
          { token: Token.END_REF, pos: 24 },
          { token: Token.END }
        ])
    })
    it('tokenises correctly without space', function () {
      const compiler = new Compiler()
      const result = compiler.tokenise('{{firstName}}{{lastName}}')
      expect(result)
        .to.deep.include.ordered.members([
          { token: Token.START },
          { token: Token.START_REF, pos: 0 },
          { token: Token.IDENTIFIER, identifier: 'firstName', pos: 2 },
          { token: Token.END_REF, pos: 11 },
          { token: Token.START_REF, pos: 13 },
          { token: Token.IDENTIFIER, identifier: 'lastName', pos: 15 },
          { token: Token.END_REF, pos: 23 },
          { token: Token.END }
        ])
    })
    it('tokenises empty string', function () {
      const compiler = new Compiler()
      const result = compiler.tokenise('')
      expect(result)
        .to.deep.include.ordered.members([
          { token: Token.START },
          { token: Token.END }
        ])
    })
  })
  describe('compile', function () {
    it('compiles correctly', function () {
      const compiler = new Compiler()
      const tokens = compiler.tokenise('start {} mid {{ * _ someRef : savedRef }} end')
      const result = compiler.compile('testSet', tokens, [ 'someRef' ])
      expect(result)
        .to.deep.include.ordered.members([
          { text: 'start {} mid ' },
          { dataset: 'someRef', modifiers: [ Modifier.PLURAL, Modifier.LOWERCASE ], variable: 'savedRef' },
          { text: ' end' }
        ])
    })
    it('compiles empty string correctly', function () {
      const compiler = new Compiler()
      const tokens = compiler.tokenise('')
      const result = compiler.compile('testSet', tokens, [ 'someRef' ])
      expect(result)
        .to.deep.include.ordered.members([
        ])
    })
  })
  describe('loadDataset', function () {
    it('loads data', function () {
      const compiler = new Compiler()
      compiler.loadDataset({
        firstName: [ 'Daniel', 'Sam', 'Jack', 'Elizabeth' ],
        lastName: [ 'Jackson', 'Carter', 'O\'Neill', 'Weir' ],
        job: [ 'Archaeologist', 'Scientist', 'Soldier', 'Negotiator' ],
        fullName: '{{ firstName }} {{ lastName }}'
      })
    })
    it('loads data that contains no space', function () {
      const compiler = new Compiler()
      compiler.loadDataset({
        firstName: [ 'Daniel', 'Sam', 'Jack', 'Elizabeth' ],
        lastName: [ 'Jackson', 'Carter', 'O\'Neill', 'Weir' ],
        job: [ 'Archaeologist', 'Scientist', 'Soldier', 'Negotiator' ],
        nameNoSpace: '{{firstName}}{{ lastName}}'
      })
    })
  })

  describe('build', function () {
    it('correctly calcs result', function () {
      const compiler = new Compiler()
      compiler.loadDataset({
        firstName: [ 'Daniel', 'Sam', 'Jack', 'Elizabeth' ],
        lastName: [ 'Jackson', 'Carter', 'O\'Neill', 'Weir' ],
        job: [ 'Archaeologist', 'Scientist', 'Soldier', 'Negotiator' ],
        fullName: '{{ firstName }} {{ lastName }} the {{ job }}'
      })
      expect(compiler.build('fullName', () => 0).text).to.equal('Daniel Jackson the Archaeologist')
    })
    it('saves variable data', function () {
      const compiler = new Compiler()
      compiler.loadDataset({
        firstName: [ 'Daniel', 'Sam', 'Jack', 'Elizabeth' ],
        lastName: [ 'Jackson', 'Carter', 'O\'Neill', 'Weir' ],
        job: [ 'Archaeologist', 'Scientist', 'Soldier', 'Negotiator' ],
        fullName: '{{ firstName : name }} {{ firstName : name }} the {{ job }}'
      })
      let u = 0
      let result = compiler.build('fullName', () => u++)
      expect(result.text).to.equal('Daniel Daniel the Scientist')
      expect(result.variables.name).to.equal('Daniel')
    })
  })
})
