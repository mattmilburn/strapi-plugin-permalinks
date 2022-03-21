import { PATH_SEPARATOR } from '../constants';

const getPermalink = ( ancestorsPath, slug ) => {
  return [ ancestorsPath, slug ].filter( i => i ).join( PATH_SEPARATOR );
};

export default getPermalink;
