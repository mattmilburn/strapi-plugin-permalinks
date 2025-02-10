export const PLUGIN_ID = 'permalinks';
export const PLUGIN_NAME = 'Permalinks';

export const ACTION_RESOLVE_CONFIG = `${PLUGIN_ID}/resolve-config`;

export const HOOK_BEFORE_BUILD_URL = `plugin/${PLUGIN_ID}/before-build-url`;

export const UID_PERMALINK_FIELD = 'plugin::permalinks.permalink';

export const URI_COMPONENT_REGEX = /^[A-Za-z0-9-_.~!$&'()*+,;=:@%/]*$/;
export const URI_COMPONENT_REGEX_DENY = /[^A-Za-z0-9-_.~!$&'()*+,;=:@%/]*/g;
