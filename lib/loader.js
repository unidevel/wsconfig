'use strict';
var fs = require('fs');
var config = require('./config');

module.exports = function* loadConfig(path){
  var text = fs.readFileSync(path)
  var data = eval('('+text+')');
  return data;
}
