module.exports = createReader

var multibuffer = require("multibuffer")
var spigot = require("stream-spigot")
function noop () {}

// TODO check if open?

/**
 * Create a stream instance that streams data out of a level instance as multibuffers
 * @param {LevelDOWN} db      A LevelDOWN instance
 * @param {Object} options Read range options (start, end, reverse, limit)
 */
function createReader(db, options) {
  if (options == null) options = {}

  var iterator = db.iterator(options)

  function _read(next) {
    iterator.next(function (err, key, value) {
      if (err) {
        iterator.end(noop)
        return next(err)
      }
      if (key == null && value == null) {
        iterator.end(noop)
        return next(null)
      }

      var record = multibuffer.pack([key, value])
      return next(err, record)
    })
  }
  return spigot(_read)
}