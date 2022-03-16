import { PATH_DELIMITER } from '../constants';

const getPermalinkAncestors = path => {
  if ( ! path ) {
    return null;
  }

  const parts = path.split( PATH_DELIMITER ).filter( i => i );
  const len = parts.length - 1;

  if ( ! len ) {
    return null;
  }

  return parts.slice( 0, len ).join( PATH_DELIMITER );
};

export default getPermalinkAncestors;
