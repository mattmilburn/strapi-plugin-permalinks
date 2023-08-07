'use strict';

const isConnecting = (data, name) => (
  data[ name ] &&
  data[ name ].connect &&
  data[ name ].connect.length
);

module.exports = isConnecting;
