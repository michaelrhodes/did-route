var test = require('tape')
var http = require('simple-get')
var did = require('../')()

// Home
did.get('/',
  function (req, res, params) {
    res.setHeader('x-test', 'home')
    res.setHeader('x-test-params', typeof params)
    res.end()
  }
)

// Dog
did.get('/dog/:speak(w[o0]{2,}f)',
  function (req, res, params) {
    res.setHeader('x-test', 'dog')
    res.setHeader('x-test-speak', params.speak)
  }
)

// Item
did.get('/:id([a-f0-9]{16})',
  function (req, res, params) {
    res.setHeader('x-test', 'item')
    res.setHeader('x-test-id', params.id)
    res.end()
  }
)

// Sub-item
did.get('/:id([a-f0-9]{16})/:sub',
  function (req, res, params) {
    res.setHeader('x-test', 'sub-item')
    res.setHeader('x-test-id', params.id)
    res.setHeader('x-test-sub', params.sub)
    res.end()
  }
)

did.del('/', function (req, res) {
  res.setHeader('x-test', 'deleted')
  res.end()
})

var server = require('http').createServer(function (req, res) {
  res.setHeader('Connection', 'close')
  if (!did.route(req, res)) {
    res.setHeader('x-test', 'no')
    res.end()
  }
})

server.listen(4444, function () {
  test('it works', function (assert) {
    var base = 'http://localhost:4444'

    var home = base + '/'
    http.get(home, function (err, res) {
      assert.equal(
        res.headers['x-test'], 'home',
        'correct route: home'
      )
      assert.equal(
        res.headers['x-test-params'], 'object',
        'typeof params: object'
      )
    })

    var dog = base + '/dog/w0o0Of#hash'
    http.get(dog, function (err, res) {
      assert.equal(
        res.headers['x-test'], 'dog',
        'correct route: dog'
      )
      assert.equal(
        res.headers['x-test-speak'], 'w0o0Of',
        'correct param: speak'
      )
    })

    var item = base + '/aBcdEf1234567890?has=query'
    http.get(item, function (err, res) {
      assert.equal(
        res.headers['x-test'], 'item',
        'correct route: item'
      )
      assert.equal(
        res.headers['x-test-id'],
        'aBcdEf1234567890',
        'correct param: id'
      )
    })

    var sub = base + '/aBcdEf1234567890/beep?has=query'
    http.get(sub, function (err, res) {
      assert.equal(
        res.headers['x-test'], 'sub-item',
        'correct route: sub-item'
      )
      assert.equal(
        res.headers['x-test-id'],
        'aBcdEf1234567890',
        'correct param: id'
      )
      assert.equal(
        res.headers['x-test-sub'], 'beep',
        'correct param: sub'
      )
    })

    try {
      // Duplicate route declaration
      did.get('/dog/:speak(w[o0]{2,}f)',
        function (req, res, params) {
          res.setHeader('x-test', 'dog')
          res.setHeader('x-test-speak', params.speak)
          res.end()
        }
      )
    }
    catch (error) {
      assert.ok(!!error, 'doesn’t create duplicates')
    }

    var no = base + '/blah'
    http.get(no, function (err, res) {
      return
      assert.equal(
        res.headers['x-test'], 'no',
        'returns false if didn’t route'
      )
    })

    http.delete(base + '/', function (err, res) {
      assert.equal(
        res.headers['x-test'], 'deleted',
        'creates del alias for delete method'
      )
      assert.end()
      process.exit(0)
    })
  })
})
