'use strict';

const isApiRequest = ctx => (
  ctx.state &&
  ctx.state.route &&
  ctx.state.route.info &&
  ctx.state.route.info.type === 'content-api'
);

module.exports = isApiRequest;
