import { PATH_SEPARATOR } from '../constants';

const getPermalinkSlug = path => {
  return path ? path.split( PATH_SEPARATOR ).filter( i => i ).reverse()[ 0 ] : '';
};

export default getPermalinkSlug;
