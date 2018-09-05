'use strict'

const genfun = require('generate-function')
const fastDecode = require('fast-decode-uri-component')

function Router (opt) {
  this._routes = []
  this.opt = opt
}

Router.prototype.add = function (method, path, func) {
  if (/\*/.test(path) && !/\*$/.test(path)) {
    throw new Error('Unsupported feature: wildcard should be on the end of the path')
  }
  this._routes.push({
    path,
    method,
    func,
    hash: 'f' + this._routes.length,
    parametered: /:/.test(path),
    wildcard: /\*$/.test(path)
  })
  return this
}

Router.prototype.compile = function ({ debug } = {}) {
  debug = !!debug
  function cicle (tree, gen, depth, parametered) {
    gen('var c%d = path.charCodeAt(depth)', depth)

    if (tree.isLeaf && !tree.wildcard) {
      if (debug) gen('console.log(depth, len, %d)', depth)
      gen(`if (depth === len) {`)
      gen(`return { data: %s, params: params }`, tree.isLeaf.hash)
      gen(`return { data: notFound, params: params }`)
      gen(`}`)
    }

    for (var i in tree.children) {
      if (debug) gen('console.log(%d, c%d, %d, c%d === %d, path.charAt(depth))', depth, depth, i.charCodeAt(0), depth, i.charCodeAt(0))
      if (debug) gen('//', i)
      gen(`if (c%d === %d) {`, depth, i.charCodeAt(0))
      gen('depth += 1')

      cicle(tree.children[i], gen, depth + 1, parametered || !!tree.params)

      if (parametered || !!tree.params) {
        gen('depth -= 1')
      } else {
        gen(`return { data: notFound, params: params }`)
      }
      gen(`}`)
    }

    if (tree.params) {
      gen(`var d%d = depth`, depth)
      gen(`var c%d = path.charCodeAt(++depth)`, depth)
      if (debug) gen('//', tree.params.name)
      gen(`while(c%d !== %d && c%d !== %d && depth < len) {`, depth, '/'.charCodeAt(0), depth, (tree.params.endToken || '/').charCodeAt(0))
      gen('c%d = path.charCodeAt(++depth)', depth)
      gen('}')
      gen('params.%s = fastDecode(path.slice(d%d, depth))', tree.params.name, depth)
      if (tree.params.regex) {
        gen(`if (%s.test(params.%s)) {`, tree.params.regex.toString(), tree.params.name)
      }
      cicle(tree.params, gen, depth, true)
      if (tree.params.regex) {
        gen(`}`)
      }
    }

    if (tree.wildcard) {
      gen('params["*"] = path.slice(depth)')
      gen(`return { data: %s, params: params }`, tree.isLeaf.hash)
    }
  }

  const gen = genfun()

  const tree = {
    GET: {
      isLeaf: false,
      children: {}
    },
    POST: {
      isLeaf: false,
      children: {}
    },
    PUT: {
      isLeaf: false,
      children: {}
    },
    PATCH: {
      isLeaf: false,
      children: {}
    },
    DELETE: {
      isLeaf: false,
      children: {}
    }
  }
  const methods = [ 'GET', 'POST', 'PUT', 'PATCH', 'DELETE' ]
  for (let im = 0; im < methods.length; im++) {
    const method = methods[im]

    for (let i = 0; i < this._routes.length; i++) {
      if (this._routes[i].method !== method) continue

      const { path, func, hash, parametered, wildcard } = this._routes[i]
      let root = tree[method]

      if (parametered || wildcard) {
        for (let j = 0; j < path.length; j++) {
          const char = path[j]
          if (char === '*') {
            root.wildcard = true
            root.isLeaf = true
            continue
          }
          if (char === ':') {
            const currentJ = j
            while (path[j] !== '(' && path[j] !== '/' && path[j] !== '-' && j < path.length) {
              j++
            }
            let name = path.slice(currentJ + 1, j)
            let regex = null
            let endToken = j === path.length ? null : path[j]
            if (path[j] === '(') {
              const startRegex = j
              j++
              let bracketCount = 1
              while (bracketCount !== 0 && j < path.length) {
                if (path[j] === '(') bracketCount += 1
                if (path[j] === ')') bracketCount -= 1
                j++
              }
              if (bracketCount !== 0) throw new Error('Invalid regex')
              name = path.slice(currentJ + 1, startRegex)
              regex = new RegExp(path.slice(startRegex, j))
              endToken = j === path.length ? null : path[j]
            }
            if (!root.params) {
              root.params = {
                isLeaf: false,
                name: name,
                regex: regex,
                endToken: endToken,
                children: {}
              }
            }
            root = root.params
            j--
          } else {
            if (!root.children[char]) {
              root.children[char] = { isLeaf: false, children: {} }
            }
            root = root.children[char]
          }
        }
      } else {
        for (let j = 0; j < path.length; j++) {
          const char = path[j]
          if (!root.children[char]) {
            root.children[char] = { isLeaf: false, children: {} }
          }
          root = root.children[char]
        }
      }

      root.isLeaf = { func, hash }
    }
  }

  gen(`function lookup(method, path) {`)
  gen(`var len = path.length`)
  gen(`var params = {}`)
  gen(`var depth = 0`)

  for (let im = 0; im < methods.length; im++) {
    const method = methods[im]
    gen('if (method === "%s") {', method)
    cicle(tree[method], gen, 0, false)
    gen('}')
  }
  gen(`return { data: notFound, params: params }`)
  gen(`}`)

  const scope = {
    notFound: this.opt.notFound,
    fastDecode: fastDecode
  }
  for (let i = 0; i < this._routes.length; i++) {
    scope[this._routes[i].hash] = this._routes[i].func
  }

  if (debug) console.log(require('util').inspect(tree, { depth: null }))
  if (debug) console.log(gen.toString())
  return gen.toFunction(scope)
}

module.exports = function (opt) {
  return new Router(opt)
}
