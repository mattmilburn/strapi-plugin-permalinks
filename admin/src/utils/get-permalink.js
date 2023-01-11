import { PATH_SEPARATOR } from '../constants';

const getPermalink = ( ancestorsPath, slug, lowercase = true ) => {
  // Only lowercase the slug because the rest of the path belongs to another entity.
  const parts = [
    ancestorsPath,
    lowercase ? slug.toLowerCase() : slug,
  ];

  return parts.filter( i => i ).join( PATH_SEPARATOR );
};

export default getPermalink;
