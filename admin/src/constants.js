import { pluginId } from './utils';

export const RESOLVE_CONFIG = `${pluginId}/resolve-config`;

export const UID_REGEX = new RegExp( /^[A-Za-z0-9-_.~]*$/ );
