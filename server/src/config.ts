import { type UID } from '@strapi/strapi';
import { errors } from '@strapi/utils';

export interface PermalinkConfig {
  copy?: boolean;
  uids: UID.ContentType[];
  url?: string;
}

export interface PermalinksPluginConfig {
  contentTypes?: PermalinkConfig[] | null;
  lowercase?: boolean;
}

export const defaultConfig: PermalinksPluginConfig = {
  contentTypes: [],
  lowercase: true,
};

export default {
  default: defaultConfig,
  validator: (config: PermalinksPluginConfig) => {
    if (!config.contentTypes) {
      return;
    }

    // Ensure `contentTypes` is an array.
    if (!Array.isArray(config.contentTypes)) {
      throw new errors.ValidationError('Must define contentTypes as an array.');
    }

    // Ensure each config object has a `uids` array defined.
    const uids = config.contentTypes.map((item) => item.uids).flat();

    uids.forEach((uid) => {
      if (!uid) {
        throw new errors.ValidationError(
          'Each contentType must have a uids prop defined as an array.'
        );
      }
    });

    // Ensure UIDs only appear once across the config.
    const duplicateUIDs = uids.filter((uid, i) => uids.indexOf(uid) !== i);
    const uniqueDuplicateUIDs = duplicateUIDs.filter((uid, i) => duplicateUIDs.indexOf(uid) === i);

    if (duplicateUIDs.length) {
      throw new errors.ValidationError(
        `Must not duplicate UIDs in permalinks config: ${uniqueDuplicateUIDs.join(', ')}.`
      );
    }
  },
};
