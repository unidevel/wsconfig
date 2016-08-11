'use strict';

const config = require('../lib/config')
const Const = require('../lib/const')
const logger = require('../lib/logger')
class Config {
  *set(args, ctx){
    var id = args.id;
    var data = args.data;
    for ( var service in data ) {
      var cfg = data[service];
      logger.info('Updating configuration for', service)
      yield config.set(service, cfg);
      ctx.io.emit(Const.EVENT_CHANGED, {service: service});
    }
    return {id: id};
  }
}

module.exports = new Config();
