import { type Core, type UID } from '@strapi/strapi';

import { defaultConfig, type PermalinksPluginConfig } from '../config';
import { PLUGIN_ID } from '../constants';
import { getPermalinkAttr } from '../utils';

export type ConfigService = ReturnType<typeof configService>;

const configService = ({ strapi }: { strapi: Core.Strapi }) => ({
  async get(): Promise<PermalinksPluginConfig> {
    const config = await strapi.config.get(`plugin::${PLUGIN_ID}`, defaultConfig);

    return config;
  },

  async layouts(uid: UID.ContentType | null = null): Promise<Record<string, any>> {
    const config = await strapi.config.get(`plugin::${PLUGIN_ID}`, defaultConfig);
    const { contentTypes } = config;
    const uids = contentTypes.map((item) => item.uids).flat();

    if (uid) {
      return getPermalinkAttr(uid);
    }

    // Add `layouts` data to config based on content types with a permalink field configured.
    const layouts = uids.reduce(
      (acc, uid) => ({
        ...acc,
        [uid]: getPermalinkAttr(uid),
      }),
      {}
    );

    return layouts;
  },

  async uids(uid: UID.ContentType | null = null): Promise<UID.ContentType[]> {
    const { contentTypes } = await strapi.config.get(`plugin.${PLUGIN_ID}`, defaultConfig);

    // If a `uid` is provided, return UIDs that are connected together.
    if (uid) {
      return contentTypes.find((item) => item.uids.includes(uid)).uids;
    }

    // Otherwise, return all unique UIDs.
    return contentTypes.map((item) => item.uids).flat();
  },
});

export default configService;
