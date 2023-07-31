import pluginId from './utils/plugin-id';

export const ACTION_RESOLVE_CONFIG = `${pluginId}/resolve-config`;

export const HOOK_BEFORE_BUILD_URL = 'plugin/permalinks/before-build-url';

export const URL_SEGMENT_REGEX = /^[A-Za-z0-9-_.~!$&'()*+,;=:@%]*$/;
