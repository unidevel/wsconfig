'use strict';

module.exports = {
  CMD_CONNECT: 1,
  CMD_DISCONNECT: 2,
  CMD_GET: 3,
  CMD_UPDATE: 4,

  DEFAULT_HOST: '127.0.0.1',
  DEFAULT_PORT: 9011,
  DEFAULT_TIMEOUT: 10000,

  EVENT_CONNECTED: 'connected',
  EVENT_CHANGED  : 'changed',
  EVENT_DISCONNECTED: 'disconnected',
  EVENT_REGISTER : '/client/register',
  EVENT_SETCONFIG : '/config/set',

  END_OF_FILE: 0
};
