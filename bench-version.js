'use strict'

const t = require('tap')
const Benchmark = require('benchmark')
const semverStore = require('semver-store')
const versionStore = require('./version')

t.test('version', t => {
  const svs = semverStore()
  const vs = versionStore()
  vs.setDefaultValueOnce(null)

  svs
    .set('1.0.0', 1)
    .set('1.0.1', 2)
    .set('1.1.0', 3)
    .set('2.0.0', 4)
    .set('11.1.0', 5)
    .set('1.111.0', 6)
    .set('1.1.1110', 7)

  vs
    .add('1.0.0', 1)
    .add('1.0.1', 2)
    .add('1.1.0', 3)
    .add('2.0.0', 4)
    .add('11.1.0', 5)
    .add('1.111.0', 6)
    .add('1.1.1110', 7)

  const v = vs.compile()

  const suite = new Benchmark.Suite()
  const V = '2.0.0'
  const V2 = '12.0.0'

  suite
    .add('semver-store - ok', function () {
      svs.get(V)
    })
    .add('version - ok', function () {
      v(V)
    })
    .add('semver-store - not found', function () {
      svs.get(V2)
    })
    .add('version - not found', function () {
      v(V2)
    })
    .on('cycle', function (event) {
      console.log(String(event.target))
    })
    .on('complete', function () {
      console.log('Fastest is ' + this.filter('fastest').map('name'))
      t.end()
    })
    .run({ 'async': true })
})
