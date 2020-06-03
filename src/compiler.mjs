import Token from './Tokens'
import Modifier from './Modifiers'
import TextBuilder from './TextBuilder'
import ReferenceBuilder from './ReferenceBuilder'
import OptionBuilder from './OptionBuilder'
import ParseError from './ParseError'

export default class Compiler {
  constructor () {
    this.datasets = {}
  }
  isIdentifierChar (char) {
    return char.match(/[a-zA-Z0-9]/)
  }
  asModifier (char, pos) {
    switch (char) {
      case '*':
        return {
          token: Token.MODIFIER,
          type: Modifier.PLURAL,
          pos
        }
      case '^':
        return {
          token: Token.MODIFIER,
          type: Modifier.CAPITALISE,
          pos
        }
      case '_':
        return {
          token: Token.MODIFIER,
          type: Modifier.LOWERCASE,
          pos
        }
      case '!':
        return {
          token: Token.MODIFIER,
          type: Modifier.ALL_CAPS,
          pos
        }
      default:
        return null
    }
  }

  tokenise (text) {
    let result = [
      { token: Token.START }
    ]
    let escaped = false
    let inRef = false
    let current = null
    for (let i = 0; i < text.length; ++i) {
      if ((text[i] === '{') && !escaped && (text[i + 1] === '{')) {
        result.push({
          token: Token.START_REF,
          pos: i
        })
        inRef = true
        current = null
        ++i
      } else if ((text[i] === '}') && !escaped && (text[i + 1] === '}')) {
        result.push({
          token: Token.END_REF,
          pos: i
        })
        inRef = false
        current = null
        ++i
      } else if (!inRef) {
        if (current === null) {
          current = {
            token: Token.TEXT,
            data: '',
            pos: i
          }
          result.push(current)
        }
        current.data += text[i]
      } else {
        if (this.asModifier(text[i], i)) {
          current = null
          result.push(this.asModifier(text[i], i))
        } else if (text[i] === ':') {
          current = null
          result.push({
            token: Token.SAVE_DIVIDER,
            pos: i
          })
        } else if (this.isIdentifierChar(text[i])) {
          if (current === null) {
            current = {
              token: Token.IDENTIFIER,
              identifier: '',
              pos: i
            }
            result.push(current)
          }
          current.identifier += text[i]
        } else if (text[i] === ' ') {
          current = null
        } else {
          current = null
          result.push({
            token: Token.UNKNOWN,
            data: text[i],
            pos: i
          })
        }
      }
    }
    result.push({ token: Token.END })
    return result
  }

  compile (dataset, data, knownSets) {
    let temp = JSON.parse(JSON.stringify(data))
    for (let i = 0; i < temp.length - 1; ++i) {
      temp[i].next = temp[i + 1]
    }
    let builders = []
    let startParser, textParser, startRefParser, endRefParser
    let endParser, modifierParser, referenceParser, saveDividerParser
    let variableParser, unknownParser
    let reference
    startParser = node => {
      if (node.next.token === Token.TEXT) {
        textParser(node.next)
      } else if (node.next.token === Token.START_REF) {
        startRefParser(node.next)
      } else {
        unknownParser(dataset, node.text, 'Expected text, or {{')
      }
    }
    textParser = node => {
      builders.push(new TextBuilder(node.data))
      if (node.next.token === Token.END) {
        endParser(node.next)
      } else if (node.next.token === Token.START_REF) {
        startRefParser(node.next)
      } else {
        unknownParser(dataset, node.next, 'Expected end of string, or {{')
      }
    }
    startRefParser = node => {
      reference = {
        modifiers: [],
        dataset: '',
        variable: null
      }
      if (node.next.token === Token.IDENTIFIER) {
        referenceParser(node.next)
      } else if (node.next.token === Token.MODIFIER) {
        modifierParser(node.next)
      } else {
        unknownParser(dataset, node.next, 'Expected modifier, or reference')
      }
    }
    endRefParser = node => {
      builders.push(new ReferenceBuilder(reference))
      if (node.next.token === Token.START_REF) {
        referenceParser(node.next)
      } else if (node.next.token === Token.TEXT) {
        textParser(node.next)
      } else if (node.next.token === Token.END) {
        endParser(node.next)
      } else {
        unknownParser(dataset, node.next, 'Expected text, or end of string')
      }
    }
    endParser = node => {}
    modifierParser = node => {
      reference.modifiers.push(node.type)
      if (node.next.token === Token.IDENTIFIER) {
        referenceParser(node.next)
      } else if (node.next.token === Token.MODIFIER) {
        modifierParser(node.next)
      } else {
        unknownParser(dataset, node.next, 'Expected modifier, or reference')
      }
    }
    referenceParser = node => {
      reference.dataset = node.identifier
      if (knownSets.indexOf(reference.dataset) === -1) {
        throw new ParseError(`Unknown dataset: ${reference.dataset}`)
      }
      if (node.next.token === Token.END_REF) {
        endRefParser(node.next)
      } else if (node.next.token === Token.SAVE_DIVIDER) {
        saveDividerParser(node.next)
      } else {
        unknownParser(dataset, node.next, 'Expected }} or :')
      }
    }
    saveDividerParser = node => {
      if (node.next.token === Token.IDENTIFIER) {
        variableParser(node.next)
      } else {
        unknownParser(dataset, node.next, 'Expected variable name')
      }
    }
    variableParser = node => {
      reference.variable = node.identifier
      if (node.next.token === Token.END_REF) {
        endRefParser(node.next)
      } else {
        unknownParser(dataset, node.next, 'Expected }}')
      }
    }
    unknownParser = (dataset, node, message) => {
      throw new ParseError(`Unexpected identifier in '${dataset}' at pos ${node.pos}: ${message}`)
    }
    startParser(temp[0])
    return builders
  }

  prepareDataset (name, data, knownSets) {
    let tempData = data
    if (typeof data === 'string') {
      tempData = [data]
    }
    let tokenSets = tempData.map(u => this.tokenise(u))
    this.datasets[name] = new OptionBuilder(tokenSets.map(tokens => this.compile(name, tokens, knownSets)))
  }

  loadDataset (dataset) {
    let knownSets = Object.keys(dataset).concat(Object.keys(this.datasets))
    Object.keys(dataset).forEach(name => {
      this.prepareDataset(name, dataset[name], knownSets)
    })
  }

  build (dataset, rand, variables) {
    if (!variables) {
      variables = {}
    } else {
      variables = JSON.parse(JSON.stringify(variables))
    }
    return {
      text: this.datasets[dataset].build(this.datasets, variables, rand),
      variables
    }
  }
}
