'use strict'

const t = require('tap')

const methods = require('./methods')
const order = require('./order')

methods(t, false)
order(t, false)
methods(t, true)
order(t, true)
