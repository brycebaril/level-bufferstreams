var test = require("tape").test

var level = require("level-test")
var terminus = require("terminus")
var multibuffer = require("multibuffer")
var bufstream = require("../")

var db1, db2, db3, db4

test("setup", function (t) {
  db1 = level("source")()
  bufstream.rawReader(db1)
    .pipe(terminus.concat(function (contents) {
      t.notOk(contents.toString(), "Db should be empty")
      // Each record should be 23 bytes
      db1.put("0", Buffer(20))
      db1.put("1", Buffer(20))
      db1.put("2", Buffer(20))
      db1.put("3", Buffer(20))
      db1.put("4", Buffer(20))
      db1.put("5", Buffer(20))
      db1.put("6", Buffer(20))
      db1.put("7", Buffer(20))
      db1.put("8", Buffer(20))
      db1.put("9", Buffer(20))
      t.end()
    }))
})

test("read", function (t) {
  bufstream.rawReader(db1)
    .pipe(terminus.concat(function (contents) {
      t.ok(contents, "Now there is stuff")
      var parts = multibuffer.unpack(contents)
      t.equals(parts.length, 20, "10 key/value pairs")
      t.end()
    }))
})

test("write sync", function (t) {
  db2 = level("target1")()
  var ws = bufstream.rawWriter(db2, {sync: true})
  // TODO yeah... no real way to test if the sync was respected.
  ws.on("stats", function (stats) {
      t.ok(stats)
      t.ok(stats.chunks)
      t.ok(stats.avgBatchBytes)
      t.ok(stats.batches)
      t.end()
    })

  bufstream.rawReader(db1)
    .pipe(ws)
})

test("check sync copy", function (t) {
  bufstream.rawReader(db2)
    .pipe(terminus.concat(function (contents) {
      t.ok(contents, "Stuff copied")
      var parts = multibuffer.unpack(contents)
      t.equals(parts.length, 20, "10 key/value pairs")
      t.end()
    }))
})

test("write batchSize hint", function (t) {
  db3 = level("target2")()
  var ws = bufstream.rawWriter(db3, {batchSize: 3})
  ws.on("stats", function (stats) {
      t.ok(stats)
      t.ok(stats.chunks)
      t.ok(stats.avgBatchBytes)
      // 3, 3, 3, 1
      t.equals(stats.batches, 4)
      t.end()
    })

  bufstream.rawReader(db1)
    .pipe(ws)
})

test("check batchSize hint copy", function (t) {
  bufstream.rawReader(db3)
    .pipe(terminus.concat(function (contents) {
      t.ok(contents, "Stuff copied")
      var parts = multibuffer.unpack(contents)
      t.equals(parts.length, 20, "10 key/value pairs")
      t.end()
    }))
})

test("write writeBufferBytes hint", function (t) {
  db4 = level("target3")()
  var ws = bufstream.rawWriter(db4, {writeBufferBytes: 50})
  ws.on("stats", function (stats) {
      t.ok(stats)
      t.ok(stats.chunks)
      t.ok(stats.avgBatchBytes)
      // 23+23, 23+23, 23+23, 23+23, 23+23
      t.equals(stats.batches, 5)
      t.end()
    })

  bufstream.rawReader(db1)
    .pipe(ws)
})

test("check writeBufferBytes hint copy", function (t) {
  bufstream.rawReader(db4)
    .pipe(terminus.concat(function (contents) {
      t.ok(contents, "Stuff copied")
      var parts = multibuffer.unpack(contents)
      t.equals(parts.length, 20, "10 key/value pairs")
      t.end()
    }))
})