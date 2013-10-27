module.exports = BufStream
module.exports.rawReader = rawReader
module.exports.rawWriter = rawWriter
module.exports.replicate = replicate

var Read = require("./read")
var Write = require("./write")
var through2 = require("through2")

/**
 * Return an object that provides read and write streams to a LevelUP instance. Streams multibuffers of key/value pairs.
 * @param {LevelUP instance} lvlup    A LevelUp instance.
 * @param {object} options Options to send to LevelDOWN when opening or creating the database.
 */
function BufStream(lvlup) {
  if (!(this instanceof BufStream)) return new BufStream(lvlup)

  this.pending = []
  this.open = false

  if (typeof lvlup == "object" && lvlup.db) {
    if (lvlup.isOpen()) {
      this.db = lvlup.db
      this.open = true
    }
    else
      lvlup.once("ready", this._go.bind(this, lvlup))
  }
  else
    throw new Error("Please provide a LevelUP instance")
}
BufStream.prototype._go = function (lvlup) {
  this.open = true
  this.db = lvlup.db
  for (var i = 0; i < this.pending.length; i++) {
    var operation = this.pending[i]
    if (operation.mode == "read")
      this.rawReader(operation.options).pipe(operation.promise)
    else if (operation.mode == "write") {
      // forward stats event on promise
      var ws = this.rawWriter(operation.options)
      ws.on("stats", function (stats) {
        operation.promise.emit("stats", stats)
      })
      operation.promise.pipe(ws)
    }
  }
}
/**
 * Create a read stream that will stream multibuffers
 * @param  {object} options Range options (start, end, reverse, limit)
 * @return {ReadableSrteam}         A ReadableStream that streams records as multibuffers
 */
BufStream.prototype.rawReader = function (options) {
  if (this.open) {
    return Read(this.db, options)
  }
  var promise = through2()
  this.pending.push({mode: "read", options: options, promise: promise})
  return promise
}
/**
 * Create a write stream that will accept multibuffers and write them to the db
 * @param  {object} hint Hint for batch size
 * @return {WritableStream}      A WritableStream that will accept multibuffers and write them.
 */
BufStream.prototype.rawWriter = function (hint) {
  if (this.open) {
    return Write(this.db, hint)
  }
  var promise = through2()
  this.pending.push({mode: "write", options: hint, promise: promise})
  return promise
}

function rawReader(path, options) {
  return BufStream(path, options).rawReader(options)
}

function rawWriter(path, options) {
  return BufStream(path, options).rawWriter(options)
}

function replicate(source, target, options) {
  if (options == null) options = {}
  //options.reverse = true
  return rawReader(source, options).pipe(rawWriter(target, options))
}