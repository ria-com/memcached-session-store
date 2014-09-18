'use strict';

var memcached = require('co-memcached');
var parser = require('groan');
var oneDay = 86400000;

var MemcachedStore = module.exports = function () {
    if (!(this instanceof MemcachedStore)) {
        return new MemcachedStore();
    }
    var client = memcached;

    this.client = client;
};

MemcachedStore.prototype.get = function *(sid) {
    var data  = yield this.client.get(sid);
    if (!data) {
        return null;
    }

    if(typeof data === "string") {
        try{
            data = parser(data);
        } catch (e){
            data = {};
        }
    }
    if(data && data.person_id){
        data.passport = {
            "user":{
                "user_id":data.person_id
            }
        };
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
//    var data  = yield this.client.set(sid, sess, ttl);
    var data = {};
    return data;
};

MemcachedStore.prototype.destroy = function *(sid, sess) {
    yield this.client.delete(sid);
};
