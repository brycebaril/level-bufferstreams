module.exports = BufStream
module.exports.read = read
module.exports.write = write
module.exports.replicate = replicate

var Read = require("./read")
var Write = require("./write")
var through2 = require("through2")

function noop() {}

/**
 * Open a LevelDOWN interface on a database for read or write streaming.
 * @param {string or LevelUP instance} path    Either the path to the database, or a LevelUp instance.
 * @param {object} options Options to send to LevelDOWN when opening or creating the database.
 */
function BufStream(path, options) {
  if (!(this instanceof BufStream)) return new BufStream(path, options)
  if (options == null) options = {}

  this.pending = []
  this.open = false

  if (typeof path == "object" && path.db) {
    if (path.isOpen()) {
      this.db = path.db
      this.open = true
    }
    else
      path.once("ready", this._go.bind(this, path))
  }
  else if (options.db) {
    var db = options.db(path)
    db.open(options, this._go.bind(this, db))
  }
  else
    throw new Error("You must either provide a levelup instance or a levelDOWN interface")
}
BufStream.prototype._go = function (path) {
  this.open = true
  this.db = path.db
  var self = this
  this.pending.forEach(function (operation) {
    if (operation[0] == "read")
      self.read(operation[1]).pipe(operation[2])
    else if (operation[0] == "write")
      operation[2].pipe(self.write(operation[1]))
  })
}
/**
 * Create a read stream that will stream multibuffers
 * @param  {object} options Range options (start, end, reverse, limit)
 * @return {ReadableSrteam}         A ReadableStream that streams records as multibuffers
 */
BufStream.prototype.read = function (options) {
  if (this.open) {
    return Read(this.db, options)
  }
  var promise = through2()
  this.pending.push(["read", options, promise])
  return promise
}
/**
 * Create a write stream that will accept multibuffers and write them to the db
 * @param  {object} hint hint for batch size
 * @return {WritableStream}      A WritableStream that will accept multibuffers and write them.
 */
BufStream.prototype.write = function (hint) {
  if (this.open) {
    return Write(this.db, hint)
  }
  var promise = through2()
  this.pending.push(["write", hint, promise])
  return promise
}

function read(path, options) {
  return BufStream(path, options).read(options)
}

function write(path, options) {
  return BufStream(path, options).write(options)
}

function replicate(source, target, options) {
  if (options == null) options = {}
  //options.reverse = true
  return read(source, options).pipe(write(target, options))
}