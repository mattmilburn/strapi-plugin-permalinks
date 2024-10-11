const getPermalinkAncestors = (path) => {
  if (!path) {
    return null;
  }

  const parts = path.split(/(?:\/|~)+/).filter((i) => i);
  const len = parts.length - 1;

  if (!len) {
    return null;
  }

  return parts.slice(0, len).join('/');
};

export default getPermalinkAncestors;
