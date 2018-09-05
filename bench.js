'use strict'

var Benchmark = require('benchmark')

const fr = require('.')({ notFound: () => 'false' })
fr.add('GET', '/', () => 'true')
fr.add('GET', '/a', () => 'true')
fr.add('GET', '/b', () => 'true')
fr.add('GET', '/:id', () => 'true')
const r = fr.compile()

const FindMyWay = require('find-my-way')
const findMyWay = new FindMyWay()
findMyWay.on('GET', '/', () => 'true')
findMyWay.on('GET', '/a', () => 'true')
findMyWay.on('GET', '/b', () => 'true')
findMyWay.on('GET', '/:id', () => 'true')
/*
{
  const suite = new Benchmark.Suite('static')

  const PATH = '/a'
  const METHOD = 'GET'
  const opt = { method: METHOD, url: PATH, headers: {} }

  suite
    .add('findMyWay', function () {
      findMyWay.lookup(opt, null)
    })
    .add('fast-router', function () {
      const a = r(METHOD, PATH)
      a.data(a.params)
    })
    .on('cycle', function (event) {
      console.log(String(event.target))
    })
    .on('complete', function () {
      console.log('Fastest is ' + this.filter('fastest').map('name'))
    })
    .run({ 'async': true })
}
*/
{
  const suite = new Benchmark.Suite('params')

  const PATH = '/my-id'
  const METHOD = 'GET'
  const opt = { method: METHOD, url: PATH, headers: {} }

  suite
    .add('findMyWay', function () {
      findMyWay.lookup(opt, null)
    })
    .add('fast-router', function () {
      const a = r(METHOD, PATH)
      a.data(a.params)
    })
    .on('cycle', function (event) {
      console.log(String(event.target))
    })
    .on('complete', function () {
      console.log('Fastest is ' + this.filter('fastest').map('name'))
    })
    .run({ 'async': true })
}
