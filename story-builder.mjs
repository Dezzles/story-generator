import nlp from 'compromise'

export default class StoryBuilder {
  constructor () {
    this.extraSets = []
    this.data = []
    this.baseData = []
    this.processors = {
      '*': u => nlp(u).nouns().toPlural().all().out(),
      '^': u => u[0].toUpperCase() + u.substr(1).toLowerCase()
    }
  }

  findPatterns (text) {
    let regex = /{{([*^<!]*)\s*(\w+?)\s*(?::\s*(\w+)\s*)?\s*}}/g
    let sch = regex.exec(text)
    let result = []
    while (sch) {
      let n = {
        set: sch[2],
        name: null,
        pattern: sch[0],
        mods: sch[1]
      }
      if (typeof sch[3] !== 'undefined') {
        n.name = sch[3]
      }
      result.push(n)
      sch = regex.exec(text)
    }
    return result
  }

  getItem (set, name, data) {
    let result = `$MISSING:${set}$`

    let possibles = data.stack.filter((l) => l.hasOwnProperty(set))
    if (possibles.length > 0) {
      let usable = possibles[0][set]
      if (typeof usable === 'string') {
        return usable
      }
      let v = data.random(usable.length)
      result = usable[v]
    }
    return result
  }

  processText (text, processes) {
    let repl = text
    processes.split('').forEach((v) => {
      repl = this.processors[v](repl)
    })
    return repl
  }

  getSavedItem (set, name, data) {
    if (name != null) {
      if (!data.variables.hasOwnProperty(name)) {
        let result = this.getItem(set, name, data)
        data.variables[name] = result
      }
      return data.variables[name]
    }
    return this.getItem(set, name, data)
  }

  create (baseText, random, split, extra) {
    let data = {
      stack: [],
      variables: {},
      random
    }
    data.stack = [this.data, this.baseData]
    for (let idx = this.extraSets.length - 1; idx >= 0; --idx) {
      data.stack.unshift(this.extraSets[idx])
    }
    if (extra) {
      data.stack.unshift(extra)
    }
    let patterns = this.findPatterns(baseText)
    let outputText = baseText
    while (patterns.length > 0) {
      patterns.forEach((pattern) => {
        let repl = this.getSavedItem(pattern.set, pattern.name, data)
        repl = this.processText(repl, pattern.mods)
        outputText = outputText.replace(pattern.pattern, repl)
      })
      patterns = this.findPatterns(outputText)
    }
    return split ? outputText.split('|') : outputText
  }

  addDataset (data) {
    this.extraSets.push(data)
  }
}
