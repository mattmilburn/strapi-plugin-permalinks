import { PermalinkConfig } from '../../../server/src/config';
import interpolate from './interpolate';
import trimSlashes from './trimSlashes';

const parseUrl = (config: PermalinkConfig, data: any): string | null => {
  if (!config?.url || !data) {
    return null;
  }

  const supportedTypes = ['number', 'string'];
  const replacements = Object.entries(data).reduce((acc, [key, val]) => {
    if (!supportedTypes.includes(typeof val)) {
      return acc;
    }

    return {
      ...acc,
      [key]: val,
    };
  }, {});

  const url = interpolate(trimSlashes(config.url), replacements);

  return url;
};

export default parseUrl;
