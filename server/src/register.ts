import { type Core } from '@strapi/strapi';

import { PLUGIN_ID } from './constants';

const register = async ({ strapi }: { strapi: Core.Strapi }) => {
  strapi.customFields.register({
    plugin: PLUGIN_ID,
    name: 'permalink',
    type: 'string',
    inputSize: {
      default: 6,
      isResizable: true,
    },
  });
};

export default register;
