import Modifier from './modifiers'
import nlp from 'compromise'
export default class ReferenceBuilder {
  constructor (data) {
    this.dataset = data.dataset
    this.modifiers = data.modifiers.map(u => u)
    this.variable = data.variable
  }

  build (datasets, variables, rand) {
    let result
    if (this.variable && variables[this.variable]) {
      result = variables[this.variable]
    } else {
      result = datasets[this.dataset].build(datasets, variables, rand)
      if (this.variable) {
        variables[this.variable] = result
      }
    }
    this.modifiers.forEach(u => {
      if (u === Modifier.ALL_CAPS) {
        result = result.toUpperCase()
      } else if (u === Modifier.LOWERCASE) {
        result = result.toLowerCase()
      } else if (u === Modifier.PLURAL) {
        result = nlp(result).nouns().toPlural().all().out()
      } else if (u === Modifier.CAPITALISE) {
        result = result.split('')
        let t = result[0].toUpperCase()
        result.shift()
        result.unshift(t)
        result = result.join('')
      }
    })
    return result
  }
}
