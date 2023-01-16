import qs from 'qs';

import interpolate from './interpolate';
import trimSlashes from './trim-slashes';

const parseUrl = ( config, data ) => {
  if ( ! config || ! data ) {
    return null;
  }

  const supportedTypes = [ 'number', 'string' ];
  const replacements = Object.entries( data ).reduce( ( acc, [ key, val ] ) => {
    if ( ! supportedTypes.includes( typeof val ) ) {
      return acc;
    }

    return {
      ...acc,
      [ key ]: val,
    };
  }, {} );

  const url = interpolate( trimSlashes( config.url ), replacements );

  return url;
};

export default parseUrl;
