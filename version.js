'use strict'

const genfun = require('generate-function')
const semver = require('semver')
const semverStore = require('semver-store')

function Version () {
  this.versions = []
  this.semverStore = semverStore()
}

Version.prototype.add = function add (version, data) {
  this.versions.push({ version, data })
  this.semverStore.set(version, data)
  return this
}

Version.prototype.setDefaultValueOnce = function (defaultValue) {
  if (this.hasOwnProperty('defaultValue')) throw new Error('Default value should be set only once')
  this.defaultValue = defaultValue
  return this
}

function getNextStepName (name, c) {
  if (name === 'FIRST_MAJOR' || name === 'MAJOR') {
    if (c === '.') {
      return 'DOT_BEFORE_MINOR'
    }
    return 'MAJOR'
  }
  if (name === 'DOT_BEFORE_MINOR') {
    return 'FIRST_MINOR'
  }
  if (name === 'FIRST_MINOR' || name === 'MINOR') {
    if (c === '.') {
      return 'DOT_BEFORE_PATCH'
    }
    return 'MINOR'
  }
  if (name === 'DOT_BEFORE_PATCH') {
    return 'FIRST_PATCH'
  }
  if (name === 'FIRST_PATCH') {
    return 'PATCH'
  }
  throw new Error('Unknown step name: ' + name)
}

Version.prototype.compile = function compile ({ debug = false } = {}) {
  const gen = genfun()
  const scope = { defaultValue: this.defaultValue }

  const semverStore = this.semverStore

  function cycle (tree, gen, scope, stepName, path) {
    const children = Object.keys(tree.children)
    if (stepName === 'FIRST_MAJOR' && children.length > 0) {
      if (debug) gen('console.log("FIRST_MAJOR", len, i, ver.charCodeAt(i), %d)', '*'.charCodeAt(0))
      gen('if (len === (i + 1) && ver.charCodeAt(i) === %d) {', '*'.charCodeAt(0))
      scope['w'] = semverStore.get('*')
      gen('return %s', 'w')
      gen('}')
    }
    if (stepName === 'DOT_BEFORE_MINOR') {
      if (debug) gen('console.log("DOT_BEFORE_MINOR", len, i, ver.charCodeAt(i), %d)', 'x'.charCodeAt(0))
      gen('if (len === (i + 1) && ver.charCodeAt(i) === %d) {', 'x'.charCodeAt(0))
      const name = 'v' + path.concat(['x']).join('').replace(/\./g, '_')
      scope[name] = semverStore.get(path.concat(['x']).join(''))
      gen('return %s', name)
      gen('}')
    }
    if (stepName === 'DOT_BEFORE_PATCH') {
      if (debug) gen('console.log("DOT_BEFORE_PATCH", len, i, ver.charCodeAt(i), %d)', 'x'.charCodeAt(0))
      gen('if (len === (i + 1) && ver.charCodeAt(i) === %d) {', 'x'.charCodeAt(0))
      const name = 'v' + path.concat(['x']).join('').replace(/\./g, '_')
      scope[name] = semverStore.get(path.concat(['x']).join(''))
      gen('return %s', name)
      gen('}')
    }
    if (children.length === 0 && stepName !== 'FIRST_MAJOR') { // last
      const name = 'v' + path.join('').replace(/\./g, '_')
      scope[name] = semverStore.get(path.join(''))
      if (debug) gen('console.log("%s", i, len)', path.join(''))
      gen('if (i === len) {')
      gen('return %s', name)
      gen('}')
    }
    for (let i = 0; i < children.length; i++) {
      const c = children[i]
      if (debug) gen('console.log("%s", ver.charCodeAt(i), %d, ver.charCodeAt(i) === %d)', path.join(''), c.charCodeAt(0), c.charCodeAt(0))
      if (debug) gen('// %s', c)
      gen('if (ver.charCodeAt(i) === %d) {', c.charCodeAt(0))
      gen('i++')
      cycle(tree.children[c], gen, scope, getNextStepName(stepName, c), path.concat([c]))
      gen('return defaultValue')
      gen('}')
    }
  }

  const tree = {
    children: {}
  }
  this.versions.sort((a, b) => semver.gt(a.version, b.version) ? -1 : 1)
  for (let i = 0; i < this.versions.length; i++) {
    const version = this.versions[i]

    let root = tree
    for (let j = 0; j < version.version.length; j++) {
      const c = version.version[j]

      if (!root.children[c]) {
        root.children[c] = {
          children: {}
        }
      }
      root = root.children[c]
    }
  }

  gen('function version (ver) {')
  gen('var i = 0')
  gen('var len = ver.length')
  cycle(tree, gen, scope, 'FIRST_MAJOR', [])
  gen('return defaultValue')
  gen('}')

  if (debug) console.log(require('util').inspect(tree, { depth: null }))
  if (debug) console.log(gen.toString())

  return gen.toFunction(scope)
}

module.exports = function (opt = {}) {
  return new Version(opt)
}
