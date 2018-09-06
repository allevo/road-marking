# Road Marking

[![Build Status](https://travis-ci.org/allevo/road-marking.svg?branch=master)](https://travis-ci.org/allevo/road-marking)
[![Coverage Status](https://coveralls.io/repos/github/allevo/road-marking/badge.svg?branch=master)](https://coveralls.io/github/allevo/road-marking?branch=master)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![Greenkeeper badge](https://badges.greenkeeper.io/allevo/road-marking.svg)](https://greenkeeper.io/)

## Install

```
npm i --save road-marking
```

## Usage

```js
'use strict'

const http = require('http')

function notFoundHandler (req, res, params) {
  res.end(JSON.stringify({ where: 'Not found!' }))
}
function rootHandler (req, res, params) {
  res.end(JSON.stringify({ where: 'root', params }))
}
function userHandler (req, res, params) {
  res.end(JSON.stringify({ where: 'user', params }))
}
function customerHandler (req, res, params) {
  res.end(JSON.stringify({ where: 'customer', params }))
}
function assetsHandler (req, res, params) {
  res.end(JSON.stringify({ where: 'assets', params }))
}

const rm = require('road-marking')({ notFound: notFoundHandler })
rm.add('GET', '/', rootHandler)
rm.add('GET', '/user/:userId', userHandler)
rm.add('GET', '/customer/:customerId(^\\d+$)', customerHandler)
rm.add('GET', '/assets/*', assetsHandler)

const router = rm.compile()

const server = http.createServer(function (req, res) {
  const [ path, querystring ] = req.url.split('?')
  const s = router(req.method, path)
  s.data(req, res, s.params)
})

server.listen(3000)
```

See [example.js](./example.js) for run an example.

*NB:* If you need only to find an object instead of calling a function, you can set an object as handler. Anyway you can store the function inside that object. For example:

```js
rm.add('GET', '/', { func: myHandler, config: { key1: 'value1' } })
const router = rm.compile()
const s = router(req.method, path)
s.data.func(req, res, s.params, s.data.config)
```

For performance reason the `405 Method Not Allowed` HTTP status code is not implemented yet. If you like to have, please send a PR!

## Run Benchmark

The benchmark is made against the faster router I know: [`find-my-way`](https://github.com/delvedor/find-my-way/)

```
npm i
npm run bench
```

All benchmarks are wrapped around a tap test in order the be sure the `find-my-way` interface are supported too here.


## License

[MIT](./LICENSE)
