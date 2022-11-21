'use strict';

module.exports = {
  type: 'admin',
  routes: [
    {
      method: 'GET',
      path: '/config',
      handler: 'permalinks.config',
      config: {
        policies: [ 'admin::isAuthenticatedAdmin' ],
      },
    },
    {
      method: 'POST',
      path: '/ancestors-path',
      handler: 'permalinks.ancestorsPath',
      config: {
        policies: [ 'admin::isAuthenticatedAdmin' ],
      },
    },
    {
      method: 'POST',
      path: '/check-availability',
      handler: 'permalinks.checkAvailability',
      config: {
        policies: [ 'admin::isAuthenticatedAdmin' ],
      },
    },
  ],
};
