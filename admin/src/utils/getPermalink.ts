const getPermalink = (
  ancestorsPath: string | null,
  slug: string,
  lowercase: boolean = true
): string => {
  // Only lowercase the slug because the rest of the path belongs to another entity.
  const parts = [ancestorsPath, slug && lowercase ? slug.toLowerCase() : slug];

  return parts
    .filter((i) => i)
    .join('/')
    .trim();
};

export default getPermalink;
