'use strict'

const roadMarking = require('../')

const notFound = 'NOT_FOUND'

module.exports = (t, debug) => {
  t.test('case sensitive - false', t => {
    const router = roadMarking({ notFound, caseSensitive: false })

    router.add('GET', '/A', 1)

    const r = router.compile({ debug })

    t.strictSame(r('GET', '/a'), { data: 1, params: {} })
    t.strictSame(r('GET', '/A'), { data: 1, params: {} })

    t.end()
  })
  t.test('case sensitive - true', t => {
    const router = roadMarking({ notFound, caseSensitive: true })

    router.add('GET', '/A', 1)

    const r = router.compile({ debug })

    t.strictSame(r('GET', '/a'), { data: notFound, params: {} })
    t.strictSame(r('GET', '/A'), { data: 1, params: {} })

    t.end()
  })
  t.test('case insensitive - default', t => {
    const router = roadMarking({ notFound })

    router.add('GET', '/A', 1)

    const r = router.compile({ debug })

    t.strictSame(r('GET', '/a'), { data: notFound, params: {} })
    t.strictSame(r('GET', '/A'), { data: 1, params: {} })

    t.end()
  })
}
