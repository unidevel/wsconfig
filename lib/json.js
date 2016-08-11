'use strict';

module.exports = {
  parse: function parseJSON(str){
    return eval('('+str+')');
  },
  stringify: function toJSONString(obj){
    return JSON.stringify(obj, (k,v)=>{
      if ( v instanceof RegExp ) {
        return JSON.stringify(v.toString());
      }
      else {
        return v;
      }
    });
  }
}
