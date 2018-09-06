'use strict'

const t = require('tap')
const Benchmark = require('benchmark')
const FindMyWay = require('find-my-way')
const rm = require('.')

t.test('static', t => {
  return t.test('should behave as find-my-way', t => {
    t.plan(6 * 2)

    const _req = { url: '/', method: 'GET', headers: {} }
    const _reqNotFound = { url: '/unknown', method: 'GET', headers: {} }
    const _res = {}
    const _store = {}
    function handler (req, res, params, store) {
      t.equal(req, _req)
      t.equal(res, _res)
      t.strictSame(params, {})
      t.equal(store, _store)
    }
    function notFoundHandler (req, res) {
      t.equal(req, _reqNotFound)
      t.equal(res, _res)
    }
    const findMyWay = new FindMyWay({ defaultRoute: notFoundHandler })

    findMyWay.on('GET', '/', handler, _store)
    findMyWay.on('GET', '/a', handler, _store)
    findMyWay.on('GET', '/b', handler, _store)

    const router = rm({ notFound: { func: notFoundHandler, store: _store } })

    router.add('GET', '/', { func: handler, store: _store })
    router.add('GET', '/a', { func: handler, store: _store })
    router.add('GET', '/b', { func: handler, store: _store })

    const r = router.compile()

    findMyWay.lookup(_req, _res)

    const d = r(_req.method, _req.url)
    d.data.func(_req, _res, d.params, d.data.store)

    findMyWay.lookup(_reqNotFound, _res)

    const d2 = r(_reqNotFound.method, _reqNotFound.url)
    d2.data.func(_reqNotFound, _res, d.params, d.data.store)
  })
    .then(() => {
      t.test('bench', t => {
        const suite = new Benchmark.Suite()

        const method = 'GET'
        const path = '/'

        const findMyWay = new FindMyWay({ defaultRoute: (req, res) => {} })
        const _req = { url: path, method: method, headers: {} }
        const _reqNotFound = { url: '/unknown', method: method, headers: {} }
        const _res = {}
        const _store = {}
        function handler (req, res, params, store) { }
        findMyWay.on('GET', '/', handler, _store)
        findMyWay.on('GET', '/a', handler, _store)
        findMyWay.on('GET', '/b', handler, _store)

        const router = rm({ notFound: { func: (req, res) => {}, store: _store } })

        router.add('GET', '/', { func: handler, store: _store })
        router.add('GET', '/a', { func: handler, store: _store })
        router.add('GET', '/b', { func: handler, store: _store })

        const r = router.compile()

        suite
          .add('findMyWay - ok', function () {
            findMyWay.lookup(_req, _res)
          })
          .add('fast-router - ok', function () {
            const d = r(_req.method, _req.url)
            d.data.func(_req, _res, d.params, d.data.store)
          })
          .add('findMyWay - not found', function () {
            findMyWay.lookup(_reqNotFound, _res)
          })
          .add('fast-router - not found', function () {
            const d = r(_reqNotFound.method, _reqNotFound.url)
            d.data.func(_reqNotFound, _res, d.params, d.data.store)
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
    })
})

t.test('dynamic', t => {
  return t.test('should behave as find-my-way', t => {
    t.plan(6 * 2)

    const _req = { url: '/user/tom', method: 'GET', headers: {} }
    const _reqNotFound = { url: '/unknown', method: 'GET', headers: {} }
    const _res = {}
    const _store = {}
    function handler (req, res, params, store) {
      t.equal(req, _req)
      t.equal(res, _res)
      t.strictSame(params, { id: 'tom' })
      t.equal(store, _store)
    }
    function notFoundHandler (req, res) {
      t.equal(req, _reqNotFound)
      t.equal(res, _res)
    }
    const findMyWay = new FindMyWay({ defaultRoute: notFoundHandler })

    findMyWay.on('GET', '/', handler, _store)
    findMyWay.on('GET', '/user/:id', handler, _store)

    const router = rm({ notFound: { func: notFoundHandler, store: _store } })

    router.add('GET', '/', { func: handler, store: _store })
    router.add('GET', '/user/:id', { func: handler, store: _store })

    const r = router.compile()

    findMyWay.lookup(_req, _res)

    const d = r(_req.method, _req.url)
    d.data.func(_req, _res, d.params, d.data.store)

    findMyWay.lookup(_reqNotFound, _res)

    const d2 = r(_reqNotFound.method, _reqNotFound.url)
    d2.data.func(_reqNotFound, _res, d.params, d.data.store)
  })
    .then(() => {
      t.test('bench', t => {
        const suite = new Benchmark.Suite()

        const method = 'GET'
        const path = '/user/tom'

        const findMyWay = new FindMyWay({ defaultRoute: (req, res) => {} })
        const _req = { url: path, method: method, headers: {} }
        const _reqNotFound = { url: '/unknown', method: method, headers: {} }
        const _reqNotFound2 = { url: '/user/tom/unknown', method: method, headers: {} }
        const _res = {}
        const _store = {}
        function handler (req, res, params, store) { }
        findMyWay.on('GET', '/', handler, _store)
        findMyWay.on('GET', '/user/:id', handler, _store)

        const router = rm({ notFound: { func: (req, res) => {}, store: _store } })

        router.add('GET', '/', { func: handler, store: _store })
        router.add('GET', '/user/id', { func: handler, store: _store })
        router.add('GET', '/b', { func: handler, store: _store })

        const r = router.compile()

        suite
          .add('findMyWay - ok', function () {
            findMyWay.lookup(_req, _res)
          })
          .add('fast-router - ok', function () {
            const d = r(_req.method, _req.url)
            d.data.func(_req, _res, d.params, d.data.store)
          })
          .add('findMyWay - not found', function () {
            findMyWay.lookup(_reqNotFound, _res)
          })
          .add('fast-router - not found', function () {
            const d = r(_reqNotFound.method, _reqNotFound.url)
            d.data.func(_reqNotFound, _res, d.params, d.data.store)
          })
          .add('findMyWay - not found - 2', function () {
            findMyWay.lookup(_reqNotFound2, _res)
          })
          .add('fast-router - not found - 2', function () {
            const d = r(_reqNotFound2.method, _reqNotFound2.url)
            d.data.func(_reqNotFound2, _res, d.params, d.data.store)
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
    })
})

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
*/
