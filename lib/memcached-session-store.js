//var Memcached = require('memcached');
var oneDay = 86400;

'use strict';

/**
 * Module dependencies.
 */

//var debug = require('debug')('koa:mem');
var Memcached = require('memcached');
var EventEmitter = require('events').EventEmitter;
var util = require('util');

/**
 * Initialize memcached session middleware with `opts`:
 *
 * @param {Object} options
 *   - {Object} client    memcached client
 *   - {String} host      memcached connect host (with out options.client)
 *   - {Number} port      memcached connect port (with out options.client)
 *   - {String} socket    memcached connect socket (with out options.client)
 *   - {String} db        memcached db
 *   - {String} pass      memcached password
 */
var MemcachedStore = module.exports = function (options) {
    if (!(this instanceof MemcachedStore)) {
        return new MemcachedStore(options);
    }
    EventEmitter.call(this);
    options = options || {};
    var client;

    if (!options.client) {
        console.log(options);
        var memcacheHost = (options.host || 'localhost') + (options.port || 11211);
        debug('Init memcached with host: %s', memcacheHost);
        client = new Memcached(memcacheHost, options);
        client = Memcached.createClient(options.port || options.socket,
            options.host, options);
    } else {
        client = options.client;
    }

    options.pass && client.auth(options.pass, function (err) {
        if (err) {
            throw err;
        }
    });

    if (options.db) {
        client.select(options.db);
        client.on("connect", function() {
            client.send_anyways = true;
            client.select(options.db);
            client.send_anyways = false;
        });
    }
    client.on('error', this.emit.bind(this, 'disconnect'));
    client.on('end', this.emit.bind(this, 'disconnect'));
    client.on('connect', this.emit.bind(this, 'connect'));

    //wrap redis
    this._redisClient = client;
    this.client = require('co-redis')(client);
};

util.inherits(RedisStore, EventEmitter);

MemcachedStore.prototype.get = function *(sid) {
    var data = yield this.client.get(sid);
    debug('get session: %s', data || 'none');
    if (!data) {
        return null;
    }
    try {
        return JSON.parse(data.toString());
    } catch (err) {
        // ignore err
        debug('parse session error: %s', err.message);
    }
};

MemcachedStore.prototype.set = function *(sid, sess, ttl) {
    if (typeof ttl === 'number') {
        ttl = ttl / 1000;
    }
    sess = JSON.stringify(sess);
    if (ttl) {
        debug('SETEX %s %s %s', sid, ttl, sess);
        yield this.client.setex(sid, ttl, sess);
    } else {
        debug('SET %s %s', sid, sess);
        yield this.client.set(sid, sess);
    }
    debug('SET %s complete', sid);
};

MemcachedStore.prototype.destroy = function *(sid, sess) {
    debug('DEL %s', sid);
    yield this.client.del(sid);
    debug('DEL %s complete', sid);
};
