'use strict';

const getPermalinkSlug = (path) =>
  path
    ? path
        .split('/')
        .filter((i) => i)
        .reverse()[0]
    : '';

module.exports = getPermalinkSlug;
