import { PATH_SEPARATOR } from '../constants';

const getPermalinkAncestors = path => {
  if ( ! path ) {
    return null;
  }

  const parts = path.split( PATH_SEPARATOR ).filter( i => i );
  const len = parts.length - 1;

  if ( ! len ) {
    return null;
  }

  return parts.slice( 0, len ).join( PATH_SEPARATOR );
};

export default getPermalinkAncestors;
