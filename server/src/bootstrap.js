'use strict';

const { afterUpdate, beforeCreateUpdate } = require('./lifecycles');
const { transformPermalinks } = require('./middlewares');
const { getService } = require('./utils');

module.exports = async (params) => {
  // Startup validation.
  await getService('validation').validateSchema(params);

  // Middlewares.
  await transformPermalinks(params);

  // Lifecycles.
  await beforeCreateUpdate(params);
  await afterUpdate(params);
};
