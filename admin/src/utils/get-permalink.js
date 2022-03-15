import { PATH_DELIMITER } from '../constants';

const getPermalink = ( ancestorsPath, slug ) => {
  return [ ancestorsPath, slug ].filter( i => i ).join( PATH_DELIMITER );
};

export default getPermalink;
