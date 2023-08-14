import pluginId from './utils/plugin-id';

export const ACTION_RESOLVE_CONFIG = `${pluginId}/resolve-config`;

export const HOOK_BEFORE_BUILD_URL = `plugin/${pluginId}/before-build-url`;

export const UID_PERMALINK_FIELD = 'plugin::permalinks.permalink';

export const URI_COMPONENT_REGEX = /^[A-Za-z0-9-_.~!$&'()*+,;=:@%/]*$/;
export const URI_COMPONENT_REGEX_DENY = /[^A-Za-z0-9-_.~!$&'()*+,;=:@%/]*/g;
