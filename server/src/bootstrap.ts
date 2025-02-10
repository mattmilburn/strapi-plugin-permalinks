import { type Core } from '@strapi/strapi';

import { afterUpdate, beforeCreateUpdate } from './lifecycles';
import { transformPermalinks } from './middlewares';
import { getService } from './utils';

const bootstrap = async ({ strapi }: { strapi: Core.Strapi }) => {
  // Startup validation.
  await getService('validation').validateSchema();

  // Middlewares.
  await transformPermalinks(strapi);

  // Lifecycles.
  await beforeCreateUpdate(strapi);
  await afterUpdate(strapi);
};

export default bootstrap;
