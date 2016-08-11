'use strict';
var Const = require('./const');
var uuid = require('uuid-js');

class Tasks {
  constructor(){
    this.tasks = {};
  }

  push(handle, timeout){
    var id = uuid.create().toString();
    timeout = timeout || Const.DEFAULT_TIMEOUT;
    var timer = setTimeout(()=>{
      delete this.tasks[id];
      handle(new Error('Timeout after ' + timeout + 'ms!'));
    }, timeout)
    this.tasks[id] = {
      handle: handle,
      timeout: timeout,
      timer: timer
    }
    return id;
  }

  pop(id){
    var task = this.tasks[id];
    var handle = null;
    var timer = null;
    if ( task ) {
      handle = task.handle;
      timer = task.timer;
      if ( timer ) clearTimeout(timer);
      delete task.timer;
    }
    delete this.tasks[id];
    return handle;
  }
}

module.export = new Tasks();
