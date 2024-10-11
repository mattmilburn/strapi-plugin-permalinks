'use strict';

module.exports = {
  type: 'admin',
  routes: [
    {
      method: 'GET',
      path: '/config',
      handler: 'permalinks.config',
      config: {
        policies: ['admin::isAuthenticatedAdmin'],
      },
    },
    {
      method: 'GET',
      path: '/ancestors-path/:uid/:id/:relationId/:value',
      handler: 'permalinks.ancestorsPath',
      config: {
        policies: ['admin::isAuthenticatedAdmin'],
      },
    },
    {
      method: 'GET',
      path: '/ancestors-path/:uid/:relationId',
      handler: 'permalinks.ancestorsPath',
      config: {
        policies: ['admin::isAuthenticatedAdmin'],
      },
    },
    {
      method: 'GET',
      path: '/check-availability/:uid/:value/:locale?',
      handler: 'permalinks.checkAvailability',
      config: {
        policies: ['admin::isAuthenticatedAdmin'],
      },
    },
    {
      method: 'GET',
      path: '/check-connection/:uid/:id',
      handler: 'permalinks.checkConnection',
      config: {
        policies: ['admin::isAuthenticatedAdmin'],
      },
    },
    {
      method: 'GET',
      path: '/suggestion/:uid/:value',
      handler: 'permalinks.suggestion',
      config: {
        policies: ['admin::isAuthenticatedAdmin'],
      },
    },
  ],
};
