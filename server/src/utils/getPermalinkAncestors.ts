const getPermalinkAncestors = (path: string): string => {
  if (!path) {
    return '';
  }

  const parts = path.split('/').filter((i) => i);
  const len = parts.length - 1;

  if (!len) {
    return '';
  }

  return parts.slice(0, len).join('/');
};

export default getPermalinkAncestors;
