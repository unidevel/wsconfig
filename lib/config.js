'use strict'

const Const = require('./const')
const Redis = require('ioredis')
const uuid = require('uuid-js')
const logger = require('./logger')
const json = require('./json')

class ConfigMemoryAdapter {
  constructor(args){
    this.data = {};
  }
  *get(key){
    return this.data[key];
  }
  *set(key, value){
    return this.data[key] = value;
  }
  *delete(key){
    delete this.data[key];
  }
  *clear(){
    this.data = {};
  }
}


class ConfigRedisAdapter {
  constructor(args){
    this.mainKey = '__CONFIG__';
    this.redis = new Redis(args.redis);
  }
  get(key){
    return function redisGet(callback) {
      this.redis.hget(this.mainKey, key, (err, data)=>{
        try {
          callback(null, json.parse(data));
        }
        catch(err){
          callback(err);
        }
      });
    }.bind(this);
  }

  set(key, value){
    return function redisSet(callback) {
      this.redis.hset(this.mainKey, key, json.stringify(value), callback);
    }.bind(this);
  }

  delete(key){
    return function redisDel(callback) {
      this.redis.hdel(this.mainKey, key, callback);
    }.bind(this);
  }

  clear(){
    return function redisClear(callback){
      this.redis.del(this.mainKey, callback);
    }.bind(this);
  }
}

function SKEY(sid){ return '/config/sessions/'+sid }
function CKEY(service) { return '/config/services/'+service }
function matchString(match, value){
  if ( match.startsWith('"') ){
    var re = eval('('+JSON.parse(match)+')');
    if ( re.test(value) ) {
      return true;
    }
  }
  else {
    if ( value == match ) {
      return true;
    }
  }
  return false;
}
function findConfig(service, configs, meta){
  var count = 0;
  var defaultConfig = null;
  var foundConfig = null;
  var matchCount = 0;
  for ( var i = 0; i < configs.length; ++i ) {
    var config = configs[i];
    var match = config.match;
    if ( !match ) {
      if ( defaultConfig != null ) logger.warn('Multiple default configuration for service - ',service)
      defaultConfig = config;
      continue;
    }
    logger.info('Matching', match, meta);
    if ( typeof match == 'string' ){
      //only match host
      if ( matchCount >= 1 ) continue;
      if ( matchString(match, meta.host) ) {
        matchCount = 1;
        foundConfig = config;
      }
    }
    else {
      var count = 0;
      for ( var key in match ) {
        var entry = match[key];
        var value = meta[key];
        if ( typeof entry == 'string' ){
          if ( matchString(entry, value) ) {
            count++;
          }
          else {
            count = 0;
            break;
          }
        }
        else {
          if ( value == entry ) count ++;
          else {
            count = 0; break;
          }
        }
      }
      if ( matchCount < count ) {
        matchCount = count;
        foundConfig = config;
      }
    }
  }
  var matchConfig = matchCount?foundConfig:defaultConfig;
  if ( matchConfig != null ) {
    matchConfig = Object.assign({}, matchConfig);
    delete matchConfig.match;
  }
  return matchConfig;
}

class Config {
  constructor(){
  }

  initialize(opts){
    this.adapter = opts.redis ? new ConfigRedisAdapter(opts):new ConfigMemoryAdapter(opts);
    this.timeout = opts.timeout || Const.DEFAULT_TIMEOUT;
    logger.info('Using '+(opts.redis?'redis':'memory')+' adapter!', opts.redis);
  }

  *register(meta){
    var sid = uuid.create().toString();
    yield this.adapter.set(SKEY(sid), meta);
    return sid;
  }

  *unregister(sid){
    yield this.adapter.delete(SKEY(sid));
  }

  *set(service, config){
    var items;
    if ( config instanceof Array ){
      items = config;
    }
    else {
      items = [config];
    }
    yield this.adapter.set(CKEY(service), items);
  }

  *get(service, sid){
    var configs = yield this.adapter.get(CKEY(service));
    var meta = yield this.adapter.get(SKEY(sid));
    if ( !meta ) throw new Error('Config session not found!');
    if ( configs == null ) return null; 
    var matchConfig = findConfig(service, configs, meta);
    return matchConfig;
  }

  *clear(){
    yield this.adapter.clear();
  }
}

module.exports = new Config();
