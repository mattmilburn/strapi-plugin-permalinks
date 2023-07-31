const getPermalink = ( ancestorsPath, slug, lowercase = true ) => {
  // Only lowercase the slug because the rest of the path belongs to another entity.
  const parts = [
    ancestorsPath,
    slug && lowercase ? slug.toLowerCase() : slug,
  ];

  return parts.filter( i => i ).join( '/' );
};

export default getPermalink;
