'use strict'

const rm = require('../')

const notFound = 'NOT_FOUND'

module.exports = (t, debug) => {
  t.test('order', t => {
    t.test('static route cames before parametered route', t => {
      t.test('#1', t => {
        const router = rm({ notFound })

        router.add('GET', '/my-static', 1)
        router.add('GET', '/:id', 2)

        const r = router.compile({ debug })

        t.strictSame(r('GET', '/my-static'), { data: 1, params: {} })
        t.strictSame(r('GET', '/my-id'), { data: 2, params: { id: 'my-id' } })

        t.end()
      })

      t.test('static route cames before parametered route #2', t => {
        const router = rm({ notFound })

        router.add('GET', '/:id', 2)
        router.add('GET', '/static', 1)

        const r = router.compile({ debug })

        t.strictSame(r('GET', '/static'), { data: 1, params: {} })
        t.strictSame(r('GET', '/my-id'), { data: 2, params: { id: 'my-id' } })

        t.end()
      })

      t.end()
    })

    t.test('parameter route cames before wildcard route', t => {
      t.test('#1', t => {
        const router = rm({ notFound })

        router.add('GET', '/:id', 1)
        router.add('GET', '/*', 2)

        const r = router.compile({ debug })

        t.strictSame(r('GET', '/my-id'), { data: 1, params: { id: 'my-id' } })
        t.strictSame(r('GET', '/55'), { data: 1, params: { id: '55' } })
        t.strictSame(r('GET', '/55/gg'), { data: 2, params: { '*': '55/gg' } })

        t.end()
      })

      t.test('parameter route cames before wildcard route #2', t => {
        const router = rm({ notFound })

        router.add('GET', '/*', 2)
        router.add('GET', '/:id', 1)

        const r = router.compile({ debug })

        t.strictSame(r('GET', '/my-id'), { data: 1, params: { id: 'my-id' } })
        t.strictSame(r('GET', '/55'), { data: 1, params: { id: '55' } })
        t.strictSame(r('GET', '/55/gg'), { data: 2, params: { '*': '55/gg' } })

        t.end()
      })

      t.end()
    })

    t.test('static route cames before wildcard route', t => {
      t.test('#1', t => {
        const router = rm({ notFound })

        router.add('GET', '/static', 1)
        router.add('GET', '/*', 2)

        const r = router.compile({ debug })

        t.strictSame(r('GET', '/static'), { data: 1, params: { } })
        t.strictSame(r('GET', '/55'), { data: 2, params: { '*': '55' } })
        t.strictSame(r('GET', '/55/gg'), { data: 2, params: { '*': '55/gg' } })

        t.end()
      })

      t.test('#2', t => {
        const router = rm({ notFound })

        router.add('GET', '/*', 2)
        router.add('GET', '/static', 1)

        const r = router.compile({ debug })

        t.strictSame(r('GET', '/static'), { data: 1, params: { } })
        t.strictSame(r('GET', '/55'), { data: 2, params: { '*': '55' } })
        t.strictSame(r('GET', '/55/gg'), { data: 2, params: { '*': '55/gg' } })

        t.end()
      })

      t.end()
    })

    t.test('one parametered route cames before double parametered route', t => {
      t.test('#1', t => {
        const router = rm({ notFound })

        router.add('GET', '/prefix/:id/suffix/:otherId', 1)
        router.add('GET', '/prefix/11/suffix/:otherId', 2)
        router.add('GET', '/prefix/11/suffix/22', 3)

        const r = router.compile({ debug })

        t.strictSame(r('GET', '/prefix/22/suffix/22'), { data: 1, params: { id: '22', otherId: '22' } })
        t.strictSame(r('GET', '/prefix/11/suffix/00'), { data: 2, params: { otherId: '00' } })
        t.strictSame(r('GET', '/prefix/11/suffix/22'), { data: 3, params: { } })

        t.end()
      })

      t.test('#2', t => {
        const router = rm({ notFound })

        router.add('GET', '/prefix/11/suffix/:otherId', 2)
        router.add('GET', '/prefix/:id/suffix/:otherId', 1)
        router.add('GET', '/prefix/11/suffix/22', 3)

        const r = router.compile({ debug })

        t.strictSame(r('GET', '/prefix/22/suffix/22'), { data: 1, params: { id: '22', otherId: '22' } })
        t.strictSame(r('GET', '/prefix/11/suffix/00'), { data: 2, params: { otherId: '00' } })
        t.strictSame(r('GET', '/prefix/11/suffix/22'), { data: 3, params: { } })

        t.end()
      })

      t.test('one parametered route cames before double parametered route #3', t => {
        const router = rm({ notFound })

        router.add('GET', '/prefix/11/suffix/:otherId', 2)
        router.add('GET', '/prefix/11/suffix/22', 3)
        router.add('GET', '/prefix/:id/suffix/:otherId', 1)

        const r = router.compile({ debug })

        t.strictSame(r('GET', '/prefix/22/suffix/22'), { data: 1, params: { id: '22', otherId: '22' } })
        t.strictSame(r('GET', '/prefix/11/suffix/00'), { data: 2, params: { otherId: '00' } })
        t.strictSame(r('GET', '/prefix/11/suffix/22'), { data: 3, params: { } })

        t.end()
      })

      t.test('#4', t => {
        const router = rm({ notFound })

        router.add('GET', '/prefix/11/suffix/22', 3)
        router.add('GET', '/prefix/11/suffix/:otherId', 2)
        router.add('GET', '/prefix/:id/suffix/:otherId', 1)

        const r = router.compile({ debug })

        t.strictSame(r('GET', '/prefix/22/suffix/22'), { data: 1, params: { id: '22', otherId: '22' } })
        t.strictSame(r('GET', '/prefix/11/suffix/00'), { data: 2, params: { otherId: '00' } })
        t.strictSame(r('GET', '/prefix/11/suffix/22'), { data: 3, params: { } })

        t.end()
      })

      t.test('#5', t => {
        const router = rm({ notFound })

        router.add('GET', '/prefix/:id/suffix1', 1)
        router.add('GET', '/prefix/:otherId/suffix2', 2)

        const r = router.compile({ debug })

        t.strictSame(r('GET', '/prefix/22/suffix1'), { data: 1, params: { id: '22' } })
        t.strictSame(r('GET', '/prefix/11/suffix2'), { data: 2, params: { otherId: '11' } })

        t.end()
      })

      t.end()
    })

    t.end()
  })
}
