module.exports = BufStream
module.exports.read = read
module.exports.write = write
module.exports.replicate = replicate

var Read = require("./read")
var Write = require("./write")

function noop() {}

/**
 * Open a LevelDOWN interface on a database for read or write streaming.
 * @param {string or LevelUP instance} path    Either the path to the database, or a LevelUp instance.
 * @param {object} options Options to send to LevelDOWN when opening or creating the database.
 */
function BufStream(path, options) {
  if (!(this instanceof BufStream)) return new BufStream(path, options)
  if (options == null) options = {}

  if (typeof path == "object" && path.db) {
    this.db = path.db
  }
  else if (options.db) {
    this.db = new options.db(path)
    this.db.open(options, noop)
  }
  else
    throw new Error("You must either provide a levelup instance or a levelDOWN interface")
}
/**
 * Create a read stream that will stream multibuffers
 * @param  {object} options Range options (start, end, reverse, limit)
 * @return {ReadableSrteam}         A ReadableStream that streams records as multibuffers
 */
BufStream.prototype.read = function (options) {
  return Read(this.db, options)
}
/**
 * Create a write stream that will accept multibuffers and write them to the db
 * @param  {object} hint hint for batch size
 * @return {WritableStream}      A WritableStream that will accept multibuffers and write them.
 */
BufStream.prototype.write = function (hint) {
  return Write(this.db, hint)
}

function read(path, options) {
  return BufStream(path, options).read(options)
}

function write(path, options) {
  return BufStream(path, options).write(options)
}

function replicate(source, target, options) {
  return read(source, options).pipe(write(target, options))
}