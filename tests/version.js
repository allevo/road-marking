'use strict'

const roadMarking = require('../')

const notFound = 'NOT_FOUND'

module.exports = (t, debug) => {
  t.test('version', t => {
    const router = roadMarking({ notFound })

    router.add('GET', '/a', '1.0.0', 1)
    router.add('GET', '/a', '1.0.1', 2)
    router.add('GET', '/a', '1.2.0', 3)
    router.add('GET', '/a', '2.0.0', 4)

    const r = router.compile({ debug })

    t.strictSame(r('GET', '/a', '1.0.0'), { data: 1, params: {} })
    t.strictSame(r('GET', '/a', '1.0.x'), { data: 2, params: {} })
    t.strictSame(r('GET', '/a', '1.x'), { data: 3, params: {} })
    t.strictSame(r('GET', '/a', '*'), { data: 4, params: {} })
    t.strictSame(r('GET', '/a'), { data: 4, params: {} })
    t.strictSame(r('GET', '/a', undefined), { data: 4, params: {} })

    t.end()
  })
}
