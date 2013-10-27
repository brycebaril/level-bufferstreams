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
      t.equals(parts[0].toString(), "blah")
      t.equals(parts.length, 6, "3 key/value pairs")
      t.end()
    }))
})

test("read reverse", function (t) {
  bufstream.rawReader(db1, {reverse: true})
    .pipe(terminus.concat(function (contents) {
      t.ok(contents, "Now there is stuff")
      var parts = multibuffer.unpack(contents)
      t.equals(parts[0].toString(), "kasdfa")
      t.equals(parts.length, 6, "3 key/value pairs")
      t.end()
    }))
})

test("read limit", function (t) {
  bufstream.rawReader(db1, {limit: 1})
    .pipe(terminus.concat(function (contents) {
      t.ok(contents, "Now there is stuff")
      var parts = multibuffer.unpack(contents)
      t.equals(parts.length, 2, "1 key/value pair (limit 1)")
      t.end()
    }))
})

test("read start/end", function (t) {
  bufstream.rawReader(db1, {start: "c", end: "g"})
    .pipe(terminus.concat(function (contents) {
      t.ok(contents, "Now there is stuff")
      var parts = multibuffer.unpack(contents)
      t.equals(parts[0].toString(), "foo")
      t.equals(parts[1].toString(), "bar")
      t.equals(parts.length, 2, "1 key/value pair {limited to middle}")
      t.end()
    }))
})