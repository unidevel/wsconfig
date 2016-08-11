'use strict'

var config = require('../lib/config');
var logger = require('../lib/logger');
var co = require('co');
class Client {
  *register(meta, ctx){
    var sid = yield config.register(meta);
    logger.info('new session', sid);
    ctx.socket.sid = sid;
    return {
      sid: sid
    }
  }

  onConnect(socket, ctx){
    logger.info('websocket connected')
  }

  onDisconnect(socket, ctx){
    var sid = socket.sid;
    if ( sid ) {
      logger.info('unregister session', socket.sid);
      co(function*(){
        yield config.unregister(sid);
      }).catch((err)=>{
        logger.error('Error unregister session', err);
      })
    }
    else {
      logger.info('websocket disconnected')
    }
  }
}

module.exports = new Client();
