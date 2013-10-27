var test = require("tape").test

var level = require("level-test")
var terminus = require("terminus")
var multibuffer = require("multibuffer")
var bufstream = require("../")

var db1, db2

test("setup", function (t) {
  db1 = level("source")()
  bufstream.rawReader(db1)
    .pipe(terminus.concat(function (contents) {
      t.notOk(contents.toString(), "Db should be empty")
      db1.put("foo", "bar")
      db1.put("blah", "zzzz")
      db1.put("kasdfa", "avasdfasdf")
      t.end()
    }))
})

test("read", function (t) {
  bufstream.rawReader(db1)
    .pipe(terminus.concat(function (contents) {
      t.ok(contents, "Now there is stuff")
      var parts = multibuffer.unpack(contents)
      t.equals(parts.length, 6, "3 key/value pairs")
      t.end()
    }))
})

test("write", function (t) {
  db2 = level("target")()
  var ws = bufstream.rawWriter(db2)
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

test("check copy", function (t) {
  bufstream.rawReader(db2)
    .pipe(terminus.concat(function (contents) {
      t.ok(contents, "Stuff copied")
      var parts = multibuffer.unpack(contents)
      t.equals(parts.length, 6, "3 key/value pairs")
      t.end()
    }))
})