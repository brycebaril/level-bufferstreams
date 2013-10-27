level-bufferstreams
=====

[![NPM](https://nodei.co/npm/level-bufferstreams.png)](https://nodei.co/npm/level-bufferstreams/)

[![david-dm](https://david-dm.org/brycebaril/level-bufferstreams.png)](https://david-dm.org/brycebaril/level-bufferstreams/)
[![david-dm](https://david-dm.org/brycebaril/level-bufferstreams/dev-status.png)](https://david-dm.org/brycebaril/level-bufferstreams#info=devDependencies/)

level-bufferstreams provides lower-level pure-buffer read and write stream interfaces to a [LevelUP](http://npm.im/levelup) instance.

Why do this? `objectMode` streams and key/value conversion add considerable CPU and memory overhead. This allows you to skip the advanced parsing the LevelUP streams do and use pure buffer streams to optimize bulk stream operations with LevelUP.

If all you want to do is create live copies from LevelUP->LevelUP, you should use [level-rawcopy](http://npm.im/level-rawcopy) which uses this library.

```javascript
var level = require("level")
var source = level("./db_with_stuff_in_it")
var target = level("./empty_db")

var bufferstreams = require("level-bufferstreams")

// A faster/lower memory footprint way to copy an open LevelUP instance!
bufferstreams.rawReader(source)
  .pipe(bufferstreams.rawWriter(target))

// For cases like the above, see http://npm.im/level-rawcopy

```

API
===

`bufferstreams(db)`
---

Instantiate a factory for raw read and write streams for LevelUP instance `db`. Returned instance will have methods `.rawReader(options)` and `.rawWriter(hint)` methods that behave identically to the below functions.

`.rawReader(db, options)`
---

Create a raw pure-buffer Readable stream that will stream the contents of the database. The `options` is directly passed to LevelDOWN iterator, and thus supports features such as `start`, `end`, `limit` and others.

The stream content uses [multibuffers](http://npm.im/multibuffer) to avoid `objectMode` streams. Each streamed record will be a multibuffer of the Key+Value, and if you would like to consume the record, will work with the multibuffer's `unpack(chunk)` method.

Emits standard Readable stream events.

`.rawWriter(db, hint)`
---

Create a raw pure-buffer Writable stream that accept multibuffers of Key/Value pairs and save them in batches to the provided LevelUP db instances.

The stream content uses [multibuffers](http://npm.im/multibuffer) to avoid `objectMode` streams. Each streamed record is expected to be a tuple of Key+Value as would be encoded via `multibuffer.pack([key, value])`.

The hints allow you to tune the write operations:

  * `sync: [default: false]` Pass the 'sync' flag to LevelUP's chained `batch` implementation.
  * `batchSize: [default: undefined]` If specified, automatically force batches with this many records.
  * `writeBufferBytes: [default: 4194304]` If specified (and no batchSize specified), attempt to break batches into records no larger than this many bytes. It does this by tracking the average bytes per batch thus far, and if the `current_batch_bytes + average > writeBufferBytes` it will send the batch and start a new one. This means it cannot guarantee the batches will all be <= writeBufferBytes.

Events: When complete, it will emit a `stats` event that will contain some stats about the write operation. Will also emit standard Writable stream events.

Setting your LevelUP instance's `writeBufferSize` to match `writeBufferBytes` is suggested. (They both default to 4194304)

LICENSE
=======

MIT
