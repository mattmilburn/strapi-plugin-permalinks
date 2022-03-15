import { PATH_DELIMITER } from '../constants';

const getPermalinkSlug = path => {
  return path ? path.split( PATH_DELIMITER ).filter( i => i ).reverse()[ 0 ] : '';
};

export default getPermalinkSlug;
