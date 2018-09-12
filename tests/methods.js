'use strict'

const roadMarking = require('../')

const notFound = 'NOT_FOUND'

module.exports = (t, debug) => {
  const methods = [ 'GET', 'POST', 'PUT', 'PATCH', 'DELETE' ]
  methods.forEach(method => {
    t.test(method, t => {
      t.test('static', t => {
        const router = roadMarking({ notFound })

        router.add(method, '/', 1)
        router.add(method, '/a', 2)
        router.add(method, '/ab', 3)
        router.add(method, '/abc', 4)
        router.add(method, '/aaaaaaaaaaa', 5)
        router.add(method, '/c', 6)

        const r = router.compile({ debug })

        t.strictSame(r(method, '/'), { data: 1, params: {} })
        t.strictSame(r(method, '/a'), { data: 2, params: {} })
        t.strictSame(r(method, '/ab'), { data: 3, params: {} })
        t.strictSame(r(method, '/abc'), { data: 4, params: {} })
        t.strictSame(r(method, '/aaaaaaaaaaa'), { data: 5, params: {} })
        t.strictSame(r(method, '/c'), { data: 6, params: {} })

        t.strictSame(r(method, '/unknown'), { data: 'NOT_FOUND', params: {} })

        t.end()
      })

      t.test('parametered #1', t => {
        const router = roadMarking({ notFound })

        router.add(method, '/:id', 1)

        const r = router.compile({ debug })

        t.strictSame(r(method, '/my-id'), { data: 1, params: { id: 'my-id' } })

        t.end()
      })

      t.test('parametered #2', t => {
        const router = roadMarking({ notFound })

        router.add(method, '/:id', 1)
        router.add(method, '/prefix/:id', 2)
        router.add(method, '/:id/suffix', 3)
        router.add(method, '/prefix/:id/suffix', 4)

        router.add(method, '/near/:lat-:lon/radius/:r', 5)

        const r = router.compile({ debug })

        t.strictSame(r(method, '/my-id'), { data: 1, params: { id: 'my-id' } })
        t.strictSame(r(method, '/prefix/my-id'), { data: 2, params: { id: 'my-id' } })
        t.strictSame(r(method, '/my-id/suffix'), { data: 3, params: { id: 'my-id' } })
        t.strictSame(r(method, '/prefix/my-id/suffix'), { data: 4, params: { id: 'my-id' } })
        t.strictSame(r(method, '/near/45.5-9.45/radius/55'), { data: 5, params: { lat: '45.5', 'lon': '9.45', r: '55' } })

        t.strictSame(r(method, '/unknown/g'), { data: 'NOT_FOUND', params: { } })

        t.end()
      })

      t.test('regex', t => {
        const router = roadMarking({ notFound })

        router.add(method, '/:id(\\d+)', 1)
        router.add(method, '/prefix/:id(\\d+)', 2)
        router.add(method, '/:id(\\d+)/suffix', 3)

        const r = router.compile({ debug })

        t.strictSame(r(method, '/55'), { data: 1, params: { id: '55' } })
        t.strictSame(r(method, '/prefix/55'), { data: 2, params: { id: '55' } })
        t.strictSame(r(method, '/55/suffix'), { data: 3, params: { id: '55' } })

        t.strictSame(r(method, '/unknown'), { data: 'NOT_FOUND', params: { } })

        t.end()
      })

      t.test('*', t => {
        const router = roadMarking({ notFound })

        router.add(method, '/*', 1)
        router.add(method, '/prefix/*', 2)
        // not supported
        // router.add(method, '/*/suffix', 3)

        const r = router.compile({ debug })

        t.strictSame(r(method, '/55'), { data: 1, params: { '*': '55' } })
        t.strictSame(r(method, '/prefix/55'), { data: 2, params: { '*': '55' } })

        t.strictSame(r(method, 'unknown'), { data: 'NOT_FOUND', params: { } })

        t.end()
      })

      t.test('encode params', t => {
        const router = roadMarking({ notFound })

        router.add(method, '/:id', 1)

        const r = router.compile({ debug })

        t.strictSame(r(method, '/%7B%7Ba%7D%7D'), { data: 1, params: { id: '{{a}}' } })
        t.strictSame(r(method, '/%E2%98%83'), { data: 1, params: { id: '☃' } })
        t.strictSame(r(method, '/Z%CD%91%CD%AB%CD%83%CD%AA%CC%82%CD%AB%CC%BD%CD%8F%CC%B4%CC%99%CC%A4%CC%9E%CD%89%CD%9A%CC%AF%CC%9E%CC%A0%CD%8DA%CD%AB%CD%97%CC%B4%CD%A2%CC%B5%CC%9C%CC%B0%CD%94L%CD%A8%CD%A7%CD%A9%CD%98%CC%A0G%CC%91%CD%97%CC%8E%CC%85%CD%9B%CD%81%CC%B4%CC%BB%CD%88%CD%8D%CD%94%CC%B9O%CD%82%CC%8C%CC%8C%CD%98%CC%A8%CC%B5%CC%B9%CC%BB%CC%9D%CC%B3%21%CC%BF%CC%8B%CD%A5%CD%A5%CC%82%CD%A3%CC%90%CC%81%CC%81%CD%9E%CD%9C%CD%96%CC%AC%CC%B0%CC%99%CC%97'), { data: 1, params: { id: 'Z͑ͫ̓ͪ̂ͫ̽͏̴̙̤̞͉͚̯̞̠͍A̴̵̜̰͔ͫ͗͢L̠ͨͧͩ͘G̴̻͈͍͔̹̑͗̎̅͛́Ǫ̵̹̻̝̳͂̌̌͘!͖̬̰̙̗̿̋ͥͥ̂ͣ̐́́͜͞' } })
        t.strictSame(r(method, '/%F0%AF%A7%9E'), { data: 1, params: { id: '軔' } })

        t.end()
      })

      t.test('find-my-way tests', t => {
        const router = roadMarking({ notFound })

        router.add(method, '/', 1)
        router.add(method, '/user/:id', 2)
        router.add(method, '/user/:id/static', 3)
        router.add(method, '/customer/:name-:surname', 4)
        router.add(method, '/at/:hour(^\\d+)h:minute(^\\d+)m', 5)
        router.add(method, '/abc/def/ghi/lmn/opq/rst/uvz', 6)

        const r = router.compile({ debug })

        // findMyWay.lookup({ method: 'GET', url: '/', headers: {} }, null)
        t.strictSame(r(method, '/'), { data: 1, params: {} })
        // findMyWay.lookup({ method: 'GET', url: '/user/tomas', headers: {} }, null)
        t.strictSame(r(method, '/user/tomas'), { data: 2, params: { id: 'tomas' } })
        // findMyWay.lookup({ method: 'GET', url: '/customer/john-doe', headers: {} }, null)
        t.strictSame(r(method, '/customer/john-doe'), { data: 4, params: { name: 'john', surname: 'doe' } })
        // findMyWay.lookup({ method: 'GET', url: '/at/12h00m', headers: {} }, null)
        t.strictSame(r(method, '/at/12h00m'), { data: 5, params: { hour: '12', minute: '00' } })
        // findMyWay.lookup({ method: 'GET', url: '/abc/def/ghi/lmn/opq/rst/uvz', headers: {} }, null)
        t.strictSame(r(method, '/abc/def/ghi/lmn/opq/rst/uvz'), { data: 6, params: {} })

        t.end()
      })

      t.end()
    })
  })
}
