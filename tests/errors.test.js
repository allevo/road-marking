'use strict'

const t = require('tap')
const roadMarking = require('../')

t.test('method has to be a string', t => {
  const r = roadMarking({})
  t.throws(() => r.add(123))
  t.end()
})

t.test('path has to be a string', t => {
  const r = roadMarking({})
  t.throws(() => r.add('GET', 123))
  t.end()
})

t.test('duplicate path', t => {
  const r = roadMarking({})
  r.add('GET', '/')
  t.throws(() => r.add('GET', '/'))
  t.end()
})

t.test('wildcard should be as last char', t => {
  const r = roadMarking({})
  r.add('GET', '/')
  t.throws(() => r.add('GET', '/*/suffix'))
  t.end()
})

t.test('invalid regexp', t => {
  const r = roadMarking({})
  r.add('GET', '/')
  t.throws(() => r.add('GET', '/:id(()'))
  t.end()
})
