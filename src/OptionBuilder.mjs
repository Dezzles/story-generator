export default class OptionBuilder {
  constructor (datasets) {
    this.datasets = datasets
  }

  build (datasets, variables, rand) {
    let toBuild = this.datasets[0]
    if (this.datasets.length > 1) {
      toBuild = this.datasets[rand(this.datasets.length)]
    }
    return toBuild.map(u => u.build(datasets, variables, rand)).join('')
  }
}
