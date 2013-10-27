module.exports = createWriter

var multibuffer = require("multibuffer")
var terminus = require("terminus")

var DEFAULT_WRITE_BUFFER = 4 * 1024 * 1024

// TODO check if open?

/**
 * Create a Writable Stream that accepts multibuffers and writes them to the level instance.
 * @param {LevelDOWN} db   A levelDOWN instance
 * @param {Object} hint An optional set of hints to tweak performance. (sync, batchSize, writeBufferBytes)
 */
function createWriter(db, hint) {
  if (hint == null)
    hint = {}

  var batchSize = hint.batchSize
  var sync = hint.sync || false
  var writeBufferBytes = hint.writeBufferBytes || DEFAULT_WRITE_BUFFER

  var batch = []
  var batchBytes = 0
  var avgBatchBytes = 0
  var chunkCount = 0
  var batchCount = 0

  function _flush(callback) {
    var b = db.batch()
    if (!batch.length) {
      // Nothing to write, asyncly call callback()
      setImmediate(function () {
        callback()
      })
      return
    }

    for (var i = 0; i < batch.length; i++) {
      var kv = multibuffer.unpack(batch[i])
      b.put(kv[0], kv[1], {sync: sync})
    }

    b.write(function (err) {
      if (err) return callback(err)
      batch = []
      batchBytes = 0
      batchCount++
      return callback()
    })
  }

  function _write(chunk, encoding, callback) {
    batch.push(chunk)

    chunkCount++
    batchBytes += chunk.length
    avgBatchBytes = avgBatchBytes - (avgBatchBytes - chunk.length) / chunkCount

    if (batchSize && batch.length >= batchSize)
      return _flush.call(this, callback)
    if (!batchSize && batchBytes + avgBatchBytes >= writeBufferBytes)
      // If average batch size will put it past the requested buffer size, segment here.
      return _flush.call(this, callback)
    return callback()
  }

  var writer = terminus(_write)
  writer.on("finish", _flush.bind(writer, function (err) {
    if (err) return writer.emit("error", err)
    writer.emit("stats", {chunks: chunkCount, avgBatchBytes: avgBatchBytes, batches: batchCount})
  }))

  return writer
}