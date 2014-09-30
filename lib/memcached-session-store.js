'use strict';

var parser = require('groan');
var oneDay = 86400000;

var MemcachedStore = module.exports = function (options) {
    if (!(this instanceof MemcachedStore)) {
        return new MemcachedStore(options);
    }
    var options = options || {};

    var memcached = require('co-memcached')(options);

    this.client = memcached;
};

MemcachedStore.prototype.get = function *(sid) {
    var data  = yield this.client.get(sid);
//    console.log("GET FROM MEMCACHED -> sid -> data", sid, data);
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
//    console.log("GET FROM MEMCACHED PARSED -> sid -> data", sid, data);
    if(data && data.person_id){
       return { passport : {
                    "user":{
                        "user_id":data.person_id
                    }
                }
            };
    }else{
        return null;
    }
};

MemcachedStore.prototype.set = function *(sid, sess, ttl) {
//    console.log("SET TO MEMCACHED -> sid -> data", sid, sess);
    if(!ttl){
        ttl = oneDay;
    }
    if (typeof ttl === 'number') {
        ttl = ttl / 1000;
    }
    var data  = yield this.client.set(sid, sess, ttl);
    return data;
};

MemcachedStore.prototype.destroy = function *(sid, sess) {
    console.log("PASSPORT WHANT DELET SESSION!!!!");
//    yield this.client.delete(sid);
};
