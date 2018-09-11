'use strict'

const genfun = require('generate-function')
const fastDecode = require('fast-decode-uri-component')
const versionManager = require('./version')

function Router (opt) {
  this._routes = []
  this.opt = opt || {}
  this.opt.caseSensitive = opt.hasOwnProperty('caseSensitive') ? !!opt.caseSensitive : true
}

Router.prototype.add = function (method, path, version, data) {
  if (typeof method !== 'string') throw new Error('method should be a string')
  if (typeof path !== 'string') throw new Error('path should be a string')
  if (/\*/.test(path) && !/\*$/.test(path)) {
    throw new Error('Unsupported feature: wildcard should be on the end of the path')
  }

  if (arguments.length === 3) {
    data = version
    version = undefined
  }

  if (!this.opt.caseSensitive) path = path.toLowerCase()

  let j = 0
  const paramNames = []
  const paramRegExps = []
  const paramRegexpSources = []
  const paramEndTokens = []
  while (j < path.length) {
    if (path[j] !== ':') {
      j++
      continue
    }
    const currentJ = j
    while (path[j] !== '(' && path[j] !== '/' && path[j] !== '-' && j < path.length) {
      j++
    }
    let name = path.slice(currentJ + 1, j)
    let regex = null
    let regexpSource = null
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
      regexpSource = path.slice(startRegex, j)
      regex = new RegExp(regexpSource)
      endToken = j === path.length ? null : path[j]
    }
    paramNames.push(name)
    paramRegExps.push(regex)
    paramRegexpSources.push(regexpSource)
    paramEndTokens.push(endToken)
  }

  paramRegexpSources.filter(rs => rs)
    .forEach(rs => { path = path.replace(rs, '') })

  let store
  let alreadyRegisteredRoute = this._routes.find(r => r.method === method && r.path === path)
  if (alreadyRegisteredRoute) {
    store = alreadyRegisteredRoute.store
  } else {
    store = versionManager()
  }

  if (version) {
    store.add(version, data)
  } else {
    store.setDefaultValueOnce(data)
  }

  this._routes.push({
    path,
    method,
    paramNames: paramNames,
    paramRegExps: paramRegExps,
    paramRegexpSources: paramRegexpSources,
    paramEndTokens: paramEndTokens,
    store: store,
    hash: 'f' + this._routes.length
  })
  return this
}

function reorderChildren (tree) {
  tree.children = tree.children.map((c, i) => [c, i])
    .sort(function (a, b) {
      const aType = a[0].type
      const bType = b[0].type
      const aIndex = a[1]
      const bIndex = b[1]
      const aComesFirst = -1
      const aComesAfter = 1
      if (aType === 'static' && bType === 'static') {
        if (aIndex < bIndex) return aComesFirst
        if (aIndex > bIndex) return aComesAfter
        throw new Error('Never happen')
      }
      if (aType === 'static' && bType === 'param') {
        return aComesFirst
      }
      if (aType === 'static' && bType === 'wildcard') {
        return aComesFirst
      }
      if (aType === 'param' && bType === 'static') {
        return aComesAfter
      }
      if (aType === 'param' && bType === 'param') {
        if (aIndex < bIndex) return aComesFirst
        if (aIndex > bIndex) return aComesAfter
        throw new Error('Never happen')
      }
      if (aType === 'param' && bType === 'wildcard') {
        return aComesFirst
      }
      if (aType === 'wildcard' && bType === 'static') {
        return aComesAfter
      }
      if (aType === 'wildcard' && bType === 'param') {
        return aComesAfter
      }
      if (aType === 'wildcard' && bType === 'wildcard') {
        throw new Error('Never happen')
      }
      throw new Error('Unknown types')
    })
    .map(v => v[0])
  tree.children.forEach(t => reorderChildren(t))
}

Router.prototype.compile = function ({ debug } = {}) {
  debug = !!debug
  const caseSensitive = this.opt.caseSensitive

  const scope = {
    notFound: versionManager().setDefaultValueOnce(this.opt.notFound).compile({ debug }),
    fastDecode: fastDecode
  }

  function cicle (tree, gen, depth, paramNames) {
    if (tree.isLeaf) {
      scope[tree.isLeaf.hash] = tree.isLeaf.store.compile({ debug })
    }
    if (tree.type === 'static') {
      gen('var c%d = path.charCodeAt(depth)', depth)
      if (debug) gen('console.log(path.charAt(depth), "%s")', tree.char)
      if (debug) gen('// %s', tree.char)
      gen(`if (c%d === %d) {`, depth, tree.char.charCodeAt(0))
      gen('depth++')
      if (tree.isLeaf) {
        if (debug) gen('console.log(depth, len, %d)', depth)
        gen(`if (depth === len) {`)
        gen(`return { data: %s(version), params: { %s } }`, tree.isLeaf.hash, paramNames.map(n => `'${n}': ${n}`).join(', '))
        gen(`}`)
      }
      tree.children.forEach(t => cicle(t, gen, depth + 1, paramNames))
      gen('depth--')
      gen('}')
      return
    }
    if (tree.type === 'param') {
      gen('var i%d = depth', depth)
      gen('var c%d = path.charCodeAt(depth)', depth)
      gen(`while(c%d !== %d && c%d !== %d && depth < len) {`, depth, '/'.charCodeAt(0), depth, (tree.endToken || '/').charCodeAt(0))
      gen('c%d = path.charCodeAt(++depth)', depth)
      gen('}')
      gen('var %s = fastDecode(path.slice(i%d, depth))', tree.name, depth)
      if (debug) gen('console.log(i%d, depth, %s)', depth, tree.name)
      if (tree.source) {
        if (debug) gen('console.log("testing regexp", "%s", %s)', tree.source, tree.name)
        gen('if (/%s/.test(%s)) {', tree.source, tree.name)
      }
      const p = paramNames.concat([tree.name])
      if (tree.isLeaf) {
        if (debug) gen('console.log(depth, len, %d)', depth)
        gen(`if (depth === len) {`)
        gen(`return { data: %s(version), params: { %s } }`, tree.isLeaf.hash, p.map(n => `'${n}': ${n}`).join(', '))
        gen(`}`)
      }
      tree.children.forEach(t => cicle(t, gen, depth + 1, p))
      if (tree.source) {
        gen('}')
      }
      gen('depth = i%d', depth)
      return
    }
    if (tree.type === 'wildcard') {
      gen('var wildcard = fastDecode(path.slice(depth))')
      gen(`return { data: %s(version), params: { %s } }`, tree.isLeaf.hash, paramNames.map(n => `'${n}': ${n}`).concat([`'*': wildcard`]).join(', '))
      return
    }
    throw new Error('Unknwon type: ' + tree.type)
  }

  const gen = genfun()

  const tree = {
    GET: {
      isLeaf: false,
      children: []
    },
    POST: {
      isLeaf: false,
      children: []
    },
    PUT: {
      isLeaf: false,
      children: []
    },
    PATCH: {
      isLeaf: false,
      children: []
    },
    DELETE: {
      isLeaf: false,
      children: []
    }
  }
  const methods = [ 'GET', 'POST', 'PUT', 'PATCH', 'DELETE' ]
  for (let im = 0; im < methods.length; im++) {
    const method = methods[im]

    for (let i = 0; i < this._routes.length; i++) {
      if (this._routes[i].method !== method) continue

      const { path, store, hash, paramNames, paramRegExps, paramEndTokens, paramRegexpSources } = this._routes[i]
      let root = tree[method]

      let paramIndex = 0
      for (let j = 0; j < path.length; j++) {
        const char = path[j]
        if (char === '*') {
          root.children.push({
            type: 'wildcard',
            children: []
          })
          root = root.children[root.children.length - 1]
          break // wildcard is always the last token
        }
        if (char === ':') {
          const endToken = paramEndTokens[paramIndex++]
          j += paramNames[paramIndex - 1].length
          while (path[++j] !== endToken && j < path.length);
          j--
          const c = root.children.find(c => c.type === 'param' && c.name === paramNames[paramIndex - 1])
          if (c) {
            root = c
          } else {
            root.children.push({
              type: 'param',
              name: paramNames[paramIndex - 1],
              regexp: paramRegExps[paramIndex - 1],
              source: paramRegexpSources[paramIndex - 1],
              endToken: endToken,
              children: []
            })
            root = root.children[root.children.length - 1]
          }
          continue
        }
        const c = root.children.find(c => c.type === 'static' && c.char === char)
        if (c) {
          root = c
        } else {
          root.children.push({
            type: 'static',
            char: char,
            children: []
          })
          root = root.children[root.children.length - 1]
        }
      }
      store.setDefaultValueFromWildcard()
      root.isLeaf = { store, hash }
    }

    // Reorder children
    reorderChildren(tree[method])
  }

  gen(`function lookup(method, path, version) {`)
  if (!caseSensitive) {
    gen(`path = path.toLowerCase()`)
  }
  gen(`var len = path.length`)
  gen(`for (var i = 0; i < len; i++) {`)
  gen(`if (path.charCodeAt(i) === %d || path.charCodeAt(i) === %d) {`, '?'.charCodeAt(0), ';'.charCodeAt(0))
  gen(`len = i`)
  gen(`break`)
  gen(`}`)
  gen(`}`)
  if (debug) gen(`console.log('length', len, 'pathlenght', path.length)`)

  gen(`var params = {}`)
  gen(`var depth = 0`)

  for (let im = 0; im < methods.length; im++) {
    const method = methods[im]
    gen('if (method === "%s") {', method)
    tree[method].children.forEach(t => cicle(t, gen, 0, []))
    gen(`return { data: notFound(), params: {} }`)
    gen('}')
  }
  gen(`return { data: notFound(), params: {} }`)
  gen(`}`)

  if (debug) console.log(require('util').inspect(tree, { depth: null }))
  if (debug) console.log(gen.toString())
  return gen.toFunction(scope)
}

module.exports = function (opt) {
  return new Router(opt)
}
