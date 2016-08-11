'use strict';

const Const = require('./const')
const os = require('os')
const request = require('request')
const tasks = require('./tasks')
const process = require('process')
const logger = require('./logger')
/*
cmd = { id: id, type: , data: }
*/

function newId(){
  return uuid.create().toString();
}

function onReceive(result){
  var id = result.id;
  var handle = this.pop(id);
  if ( handle ) {
    handle(null, result.data);
  }
}

class ConfigClient {
  constructor(config){
    this.config = Object.assign({}, config);
    this.metadata = Object.assign({
      host: os.hostname(),
      pid : process.pid
    }, config.metadata);
    this.changeMap = {};
    this.sid = null;
  }

  _URL(path){
    return `${this.config.protocol}://${this.config.host}:${this.config.port}${path}`;
  }

  connect(){
    return function connectConfigServer(callback){
      var timer = setTimeout(()=>{
        callback(new Error('Connect to config server timeout!'));
      }, this.config.timeout);
      var io = require('socket.io-client');
      this.socket = io(this._URL(''));
      this.socket.on('connect', ()=>{
        logger.info('client connected!')
        logger.info('register', Const.EVENT_REGISTER, this.metadata)
        this.socket.emit(Const.EVENT_REGISTER, this.metadata);
      });
      this.socket.on('disconnect', ()=>{
        delete this.sid;
      });
      this.socket.on(Const.EVENT_REGISTER, (data)=>{
        var sid = data.sid;
        logger.info('client registered, session', sid);
        this.sid = sid;
        clearTimeout(timer);
        callback(null, sid);
      });
      this.socket.on(Const.EVENT_CHANGED, (args)=>{
        var service = args.service;
        var handles = this.changeMap[service];
        if ( !handles ) return;
        handles.forEach((handle)=>{
          try{
            handle(args.data);
          }
          catch(err){
            console.error('Handle configuration['+service+'] changed error!', err);
          }
        });
      });
    }.bind(this);
  }

  isConnected(){
    return this.sid != null;
  }

  get(service){
    return function getConfig(callback){
      request({url: this._URL("/config/get"), form:{service: service, sid: this.sid}, method:'POST', json: true, timeout: this.config.timeout}, function(err, resp, body){
        if ( resp.statusCode != 200 ) {
          var err = new Error(body || resp.body || resp.message || resp.statusText);
          err.code = resp.statusCode;
          callback(err);
        }
        else {
          callback(err, body);
        }
      });
    }.bind(this);
  }

  onChange(service, callback){
    var handles = this.changeMap[service];
    if ( !handles ) {
      handles = [];
      this.changeMap[service] = handles;
    }
    handles.push(callback);
  }

  disconnect(){
    logger.info('disconnect', this.sid);
    if ( this.sid ) {
      this.socket.disconnect(true);
      delete this.sid;
      delete this.socket;
    }
  }
}


module.exports = function createConfigClient(args, debug){
  var params = {};
  if ( typeof args == "string" ) {
    params.protocol = 'http';
    params.host = args || Const.DEFAULT_HOST;
    params.port = Const.DEFAULT_PORT;
    params.timeout = Const.DEFAULT_TIMEOUT;
  }
  else {
    params.protocol = args.protocol || 'http';
    params.host = args.host || Const.DEFAULT_HOST;
    params.port = args.port || Const.DEFAULT_PORT;
    params.timeout = args.timeout || Const.DEFAULT_TIMEOUT;
  }
  if ( debug ) {
    logger.setDebug(true);
  }
  params.metadata = Object.assign({}, args.metadata || args.meta);
  var client = new ConfigClient(params);
  return client;
}
