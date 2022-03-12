import { PATH_DELIMITER } from '../constants';

const getPermalink = ( data, field, relation ) => {
  const value = data[ field ] ?? '';
  const basePath = value.split( PATH_DELIMITER ).filter( i => i ).reverse()[ 0 ];

  const parts = [ basePath ];
  const parent = data[ relation ];

  // The parent entity will already have it's `[field]` value set to the remaining path.
  if ( parent ) {
    parts.push( parent[ field ] ?? '' );
  }

  // Join parts together for final path.
  const path = parts.filter( i => i ).reverse().join( PATH_DELIMITER );

  return path ?? '';
};

export default getPermalink;
