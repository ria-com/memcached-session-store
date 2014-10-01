//module.exports = require('./lib/memcached-session-store');
'use strict';

var parser = require('groan');
var oneDay = 86400000;

module.exports = function (options) {
    var client = require('co-memcached')(options);
    console.log(options);
    var MemcachedStore = {
        get : function *(sid) {
            var data  = yield client.get(sid);
//            console.log("GET FROM MEMCACHED -> sid -> data", sid, data);
            if (!data) {
                data = {
                    passport : {}
                };
                return data;
            }

            if(typeof data === "string") {
                try{
                    data = parser(data);
                } catch (e){
                    data = {};
                }
            }
            console.log("GET FROM MEMCACHED PARSED -> sid -> data", sid, data);
            if(data && data.person_id){
                data.passport = {
                    "user":{
                        "user_id":data.person_id
                    }
                }
            }
            return data;
        },
        set : function *(sid, sess, ttl) {
            //        console.log("SET TO MEMCACHED -> sid -> data", sid, sess);
            if(!ttl){
                ttl = oneDay;
            }
            if (typeof ttl === 'number') {
                ttl = ttl / 1000;
            }
            var data  = yield client.get(sid);
            if(!data){
                var data  = yield client.set(sid, sess, ttl);
            }
            return data;
        },
        destroy : function *(sid, sess) {
            console.log("PASSPORT WHANT DELET SESSION!!!!");
            yield client.delete(sid);
        }
    };

    return MemcachedStore;

};