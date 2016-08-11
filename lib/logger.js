'use strict';

var debug = false;

class Logger {
  setDebug(flag){
    debug = flag;
  }

  info(){
    if ( debug ) console.info.apply(console, arguments);
  }

  log(){
    if ( debug ) console.log.apply(console, arguments);
  }

  warn(){
    console.warn.apply(console, arguments);
  }

  error(){
    var args = [];
    for ( var i = 0 ; i < arguments.length; ++ i ) {
      var arg = arguments[i];
      if ( arg instanceof Error ) args.push(arg.stack);
      else args.push(arg);
    }
    console.error.apply(console, args);
  }

  debug(){
    if ( debug ) console.debug.apply(console, arguments);
  }
}

module.exports = new Logger();
