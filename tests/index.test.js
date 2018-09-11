'use strict'

const t = require('tap')

const methods = require('./methods')
const order = require('./order')
const caseSensitive = require('./case-sensitive')
const querystring = require('./querystring')
const version = require('./version')

methods(t, true)
order(t, true)
caseSensitive(t, true)
querystring(t, true)
version(t, true)

methods(t, false)
order(t, false)
caseSensitive(t, false)
querystring(t, false)
version(t, false)
