'use strict';

const isConnecting = (data, name) => {
  const prop = data[name];

  return !!(prop && prop.connect && !!prop.connect.length);
};

module.exports = isConnecting;
