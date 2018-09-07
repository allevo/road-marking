'use strict'

const roadMarking = require('../')

const notFound = 'NOT_FOUND'

module.exports = (t, debug) => {
  t.test('querystring', t => {
    const router = roadMarking({ notFound })

    router.add('GET', '/a', 1)

    const r = router.compile({ debug })

    t.strictSame(r('GET', '/a'), { data: 1, params: {} })
    t.strictSame(r('GET', '/a?foo=bar'), { data: 1, params: {} })
    t.strictSame(r('GET', '/a;foo=bar'), { data: 1, params: {} })

    t.end()
  })
}
