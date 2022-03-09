import { pluginId } from './utils';

export const RESOLVE_CONFIG = `${pluginId}/resolve-config`;

export const PERMALINK_REGEX = new RegExp( /^[A-Za-z0-9-_.~\/]*$/ );
