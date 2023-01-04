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
      method: 'GET',
      path: '/ancestors-path/:uid/:id/:relationId/:value',
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
    {
      method: 'GET',
      path: '/check-connection/:uid/:id',
      handler: 'permalinks.checkConnection',
      config: {
        policies: [ 'admin::isAuthenticatedAdmin' ],
      },
    },
  ],
};
