'use strict'

const t = require('tap')

const methods = require('./methods')
const order = require('./order')
const caseSensitive = require('./case-sensitive')
const querystring = require('./querystring')

methods(t, true)
order(t, true)
caseSensitive(t, true)
querystring(t, true)

methods(t, false)
order(t, false)
caseSensitive(t, false)
querystring(t, false)
