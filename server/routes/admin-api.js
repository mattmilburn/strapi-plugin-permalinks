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
  ],
};
