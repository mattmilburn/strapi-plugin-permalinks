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
      path: '/ancestors-path/:uid/:id/:field',
      handler: 'permalinks.ancestorsPath',
      config: {
        policies: [ 'admin::isAuthenticatedAdmin' ],
      },
    },
  ],
};
