'use strict';
var config = require('../lib/config')

class Config {
  *get(args){
    var sid = args.sid;
    var service = args.service;
    var item = yield config.get(service, sid);
    if ( !item ) throw new Error('Config for service['+service+'] not found!');
    return item;
  }
}

module.exports = new Config();
