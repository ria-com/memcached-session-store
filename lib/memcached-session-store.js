'use strict';

/**
 * Module dependencies.
 */

var Memcached = require('memcached');
var parser = require('groan');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var oneDay = 8640000;

/**
 * Initialize memcached session middleware with `opts`:
 *
 * @param {Object} options
 *   - {Object} client    memcached client
 *   - {String} host      memcached connect host (with out options.client)
 *   - {Number} port      memcached connect port (with out options.client)
 *   - {String} socket    memcached connect socket (with out options.client)
 */
var MemcachedStore = module.exports = function (options) {
    if (!(this instanceof MemcachedStore)) {
        return new MemcachedStore(options);
    }
    EventEmitter.call(this);
    options = options || {};
    var client;

    if (!options.client) {
        var memcacheHost = (options.host || 'localhost') + ':' + (options.port || 11211);
        client = new Memcached(memcacheHost, options);
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
            console.log('typeof data ---> ', typeof data);
            console.log(data);
            if(typeof data === "string") {
//                console.log('GET string parser(data) -->>>',parser(data));
                data = parser(data);
            }
            console.log(data);

            data.passport = {
                "user":{
                    "user_id":data.person_info.email,
                    "email":data.person_id,
                    "state_id":data.person_info.stateID,
                    "city_id":data.person_info.cityID,
                    "name":data.person_name,
                    "avatar":data.person_info.photo
                }
            };
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
    var data = yield setMem(sid, sess, ttl, this.client);
    return data;
};

MemcachedStore.prototype.destroy = function *(sid, sess) {
    this.client.del(sid, function (err) { /* stuff */ });
};
