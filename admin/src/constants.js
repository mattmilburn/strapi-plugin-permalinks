import { pluginId } from './utils/plugin-id';

export const PATH_DELIMITER = '~';
export const PATH_REPLACE_REGEX = new RegExp( /~/, 'g' );
export const RESOLVE_CONFIG = `${pluginId}/resolve-config`;
