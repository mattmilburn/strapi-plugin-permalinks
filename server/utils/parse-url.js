'use strict';

const interpolate = require( './interpolate' );
const trimSlashes = require( './trim-slashes' );

const parseUrl = ( str, data ) => {
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

  const url = interpolate( trimSlashes( str ), replacements );

  return url;
};

module.exports = parseUrl;
