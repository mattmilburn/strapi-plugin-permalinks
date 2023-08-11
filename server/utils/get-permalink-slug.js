'use strict';

const getPermalinkSlug = (path) => {
  return path
    ? path
        .split('/')
        .filter((i) => i)
        .reverse()[0]
    : '';
};

module.exports = getPermalinkSlug;
