import { PATH_SEPARATOR } from '../constants';

const getPermalink = ( ancestorsPath, slug, lowercase = true ) => {
  const permalink = [ ancestorsPath, slug ].filter( i => i ).join( PATH_SEPARATOR );

  return lowercase ? permalink.toLowerCase() : permalink;
};

export default getPermalink;
