'use strict';

/**
 * Module dependencies.
 */

var Memcached = require('memcached');
var parser = require('groan');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var oneDay = 86400000;

/**
 * Initialize memcached session middleware:
 *
 * @param {Object} options
 *   - {Object} client    memcached client
 *   - {String} host      memcached connect host (with out options.client)
 *   - {Number} port      memcached connect port (with out options.client)
 */
var MemcachedStore = module.exports = function (options) {
    if (!(this instanceof MemcachedStore)) {
        return new MemcachedStore(options);
    }
    EventEmitter.call(this);
    options = options || {};
    var client;

    if (!options.client) {
        var memcachedHost = (options.host || 'localhost') + ':' + (options.port || 11211);
        client = new Memcached(memcachedHost, options);
    } else {
        client = options.client;
    }

    options.pass && client.auth(options.pass, function (err) {
        if (err) {
            throw err;
        }
    });

    client.on('error', this.emit.bind(this, 'disconnect'));
    client.on('end', this.emit.bind(this, 'disconnect'));
    client.on('connect', this.emit.bind(this, 'connect'));

    this.client = client;
};

util.inherits(MemcachedStore, EventEmitter);


function getMem(sid, client) {
    return function(fn){
        client.get(sid, function (err, data) {
            if (err) return fn(err);
            if(typeof data === "string") {
                data = parser(data);
            }
            if(data && data.person_id){
                data.passport = {
                    "user":{
                        "user_id":data.person_id
                    }
                };
            }
            fn(null, data);
        });
    }
};

function setMem(sid, sess, ttl, client) {
    return function(fn){
        client.set(sid, sess, ttl, function (err) {
            if (err) return fn(err);
            fn();
        });
    }
};

MemcachedStore.prototype.get = function *(sid) {
    var self = this;
    var data = yield getMem(sid, this.client);
    if (!data) {
        console.log('GET RETURN NULL');
        return null;
    }
    return data;
};

MemcachedStore.prototype.set = function *(sid, sess, ttl) {
    if(!ttl){
        ttl = oneDay;
    }
    if (typeof ttl === 'number') {
        ttl = ttl / 1000;
    }
//    var data = yield setMem(sid, sess, ttl, this.client);
    var data = {};
    return data;
};

MemcachedStore.prototype.destroy = function *(sid, sess) {
    this.client.del(sid, function (err) { /* stuff */ });
};
