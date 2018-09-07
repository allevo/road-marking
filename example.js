'use strict'

const http = require('http')
const qs = require('qs')

function notFoundHandler (req, res, params, query) {
  res.end(JSON.stringify({ where: 'Not found!', query }))
}
function rootHandler (req, res, params, query) {
  res.end(JSON.stringify({ where: 'root', params, query }))
}
function userHandler (req, res, params, query) {
  res.end(JSON.stringify({ where: 'user', params, query }))
}
function customerHandler (req, res, params, query) {
  res.end(JSON.stringify({ where: 'customer', params, query }))
}
function assetsHandler (req, res, params, query) {
  res.end(JSON.stringify({ where: 'assets', params, query }))
}

const rm = require('.')({ notFound: notFoundHandler })
rm.add('GET', '/', rootHandler)
rm.add('GET', '/user/:userId', userHandler)
rm.add('GET', '/customer/:name-:surname/:age(^\\d+$)', customerHandler)
rm.add('GET', '/assets/*', assetsHandler)

const router = rm.compile()

const server = http.createServer(function (req, res) {
  const [ path, querystring ] = req.url.split('?')
  const s = router(req.method, path)
  s.data(req, res, s.params, qs.parse(querystring))
})

server.listen(3000)
