'use strict';

const getPermalinkAncestors = (path) => {
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

module.exports = getPermalinkAncestors;
