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
};

MemcachedStore.prototype.set = function *(sid, sess, ttl) {
//    console.log("SET TO MEMCACHED -> sid -> data", sid, sess);
    if(!ttl){
        ttl = oneDay;
    }
    if (typeof ttl === 'number') {
        ttl = ttl / 1000;
    }

    var stat_sess  = 'lang_mysql_charset|s:4:"utf8";partner_base_href|s:0:"";partner_id|i:1;template_dir|s:3:"ria";partner_hostname|s:17:"autolocal.ria.com";partner_name|s:17:"Autolocal.ria.com";partner_packet|s:1:"0";is_mobile|i:0;lang_code|s:2:"ru";lang_id|s:1:"2";lang_web_charset|s:12:"Windows-1251";lang_url|s:0:"";lang_system_locale|s:12:"ru_RU.CP1251";person_id|i:0;admin_id|i:0;person_name|s:0:"";webPersonId|i:0;person_info|a:0:{}MY_STATE_ID|i:0;MY_CITY_ID|i:0;MY_COUNTRY_ID|i:1;';
    if(sess.passport && sess.passport.user){

    }else{
        var data  = yield this.client.set(sid, stat_sess, ttl);
    }
    return {};
};

MemcachedStore.prototype.destroy = function *(sid, sess) {
    console.log("PASSPORT WHANT DELET SESSION!!!!");
//    yield this.client.delete(sid);
};
