module.exports = createReader

var multibuffer = require("multibuffer")
var spigot = require("stream-spigot")
function noop () {}

/**
 * Create a stream instance that streams data out of a level instance as multibuffers
 * @param {LevelDOWN} db      A LevelDOWN instance
 * @param {Object} options Read range options (start, end, reverse, limit)
 */
function createReader(db, options) {
  if (options == null) options = {}

  var iterator = db.iterator(options)

  function _read(n) {
    // ignore n for now

    var self = this
    iterator.next(function (err, key, value) {
      if (err) {
        iterator.end(noop)
        self.emit("error", err)
        return
      }
      if (key == null && value == null) {
        iterator.end(noop)
        self.push(null)
        return
      }

      var record = multibuffer.pack([key, value])
      self.push(record)
    })
  }

  return spigot(_read)
}