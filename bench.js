'use strict'

const t = require('tap')
const Benchmark = require('benchmark')
const FindMyWay = require('find-my-way')
const roadMarking = require('.')

function handler (req, res, params, store) { }
function notFound (req, res) { }

function createFindMyWay (notFoundHandler, handler, store) {
  const findMyWay = new FindMyWay({ defaultRoute: notFoundHandler })

  findMyWay.on('GET', '/', handler, store)
  findMyWay.on('GET', '/user/:id', handler, store)
  findMyWay.on('GET', '/user/:id/static', handler, store)
  findMyWay.on('GET', '/customer/:name-:surname', handler, store)
  findMyWay.on('GET', '/at/:hour(^\\d+)h:minute(^\\d+)m', handler, store)
  findMyWay.on('GET', '/abc/def/ghi/lmn/opq/rst/uvz', handler, store)
  // findMyWay.on('GET', '/', { version: '1.2.0' }, () => true)

  return findMyWay
}

function createRoadMarking (notFoundHandler, handler, store) {
  const r = roadMarking({ notFound: { func: notFoundHandler, store } })

  r.add('GET', '/', { func: handler, store })
  r.add('GET', '/user/:id', { func: handler, store })
  r.add('GET', '/user/:id/static', { func: handler, store })
  r.add('GET', '/customer/:name-:surname', { func: handler, store })
  r.add('GET', '/at/:hour(^\\d+)h:minute(^\\d+)m', { func: handler, store })
  r.add('GET', '/abc/def/ghi/lmn/opq/rst/uvz', { func: handler, store })

  return r.compile()
}

t.test('static', t => {
  return createTest(t, 'GET', '/', {})
})

t.test('dynamic', t => {
  return createTest(t, 'GET', '/user/tommaso', { id: 'tommaso' })
})

t.test('multi-parametric', t => {
  return createTest(t, 'GET', '/customer/tommaso-allevi', { name: 'tommaso', surname: 'allevi' })
})

t.test('multi-regexp-parametric', t => {
  return createTest(t, 'GET', '/at/12h00m', { hour: '12', minute: '00' })
})

t.test('long-static', t => {
  return createTest(t, 'GET', '/abc/def/ghi/lmn/opq/rst/uvz', { })
})

t.test('long-dynamic', t => {
  return createTest(t, 'GET', '/user/qwertyuiopasdfghjklzxcvbnm/static', { id: 'qwertyuiopasdfghjklzxcvbnm' })
})

function createTest (t, method, path, expectedParams) {
  return t.test('should behave as find-my-way', t => {
    t.plan(6 * 2)

    const _req = { url: path, method: method, headers: {} }
    const _reqNotFound = { url: '/unknown', method: 'GET', headers: {} }
    const _res = {}
    const _store = {}
    const handler = function handler (req, res, params, store) {
      t.equal(req, _req)
      t.equal(res, _res)
      t.strictSame(params, expectedParams)
      t.equal(store, _store)
    }
    function notFoundHandler (req, res) {
      t.equal(req, _reqNotFound)
      t.equal(res, _res)
    }

    const findMyWay = createFindMyWay(notFoundHandler, handler, _store)
    const router = createRoadMarking(notFoundHandler, handler, _store)

    findMyWay.lookup(_req, _res)

    const d = router(_req.method, _req.url)
    d.data.func(_req, _res, d.params, d.data.store)

    findMyWay.lookup(_reqNotFound, _res)

    const d2 = router(_reqNotFound.method, _reqNotFound.url)
    d2.data.func(_reqNotFound, _res, d.params, d.data.store)
  })
    .then(() => {
      t.test('bench', t => {
        const suite = new Benchmark.Suite()

        const _req = { url: path, method: method, headers: {} }
        const _reqNotFound = { url: '/unknown', method: method, headers: {} }
        const _res = {}
        const _store = {}

        const findMyWay = createFindMyWay(notFound, handler, _store)
        const r = createRoadMarking(notFound, handler, _store)

        suite
          .add('findMyWay - ok', function () {
            findMyWay.lookup(_req, _res)
          })
          .add('road-marking - ok', function () {
            const d = r(_req.method, _req.url)
            d.data.func(_req, _res, d.params, d.data.store)
          })
          .add('findMyWay - not found', function () {
            findMyWay.lookup(_reqNotFound, _res)
          })
          .add('road-marking - not found', function () {
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
}
