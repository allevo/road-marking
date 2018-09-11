'use strict'

const t = require('tap')
const Version = require('../version')

t.test('version', t => {
  const vs = Version()

  vs
    .add('1.0.0', 1)
    .add('1.0.1', 2)
    .add('1.1.0', 3)
    .add('2.0.0', 4)
    .add('11.1.0', 5)

  const v = vs.compile({ debug: false })

  t.equal(v('1.0.0'), 1)
  t.equal(v('2.0.0'), 4)
  t.equal(v('1.0.x'), 2)
  t.equal(v('1.x'), 3)
  t.equal(v('*'), 5)
  t.equal(v('55.55.55'), undefined)

  t.end()
})

t.test('version - default value', t => {
  const vs = Version()
  vs.setDefaultValueOnce(-1)

  vs
    .add('1.0.0', 1)
    .add('1.0.1', 2)
    .add('1.1.0', 3)
    .add('2.0.0', 4)
    .add('11.1.0', 5)

  const v = vs.compile({ debug: false })

  t.equal(v('1.0.0'), 1)
  t.equal(v('2.0.0'), 4)
  t.equal(v('1.0.x'), 2)
  t.equal(v('1.x'), 3)
  t.equal(v('*'), 5)
  t.equal(v('55.55.55'), -1)

  t.end()
})

t.test('version - empty', t => {
  const vs = Version()
  vs.setDefaultValueOnce(-1)

  const v = vs.compile({ debug: false })

  t.equal(v('55.55.55'), -1)

  t.end()
})
