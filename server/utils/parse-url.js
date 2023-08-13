'use strict';

const interpolate = require('./interpolate');
const trimSlashes = require('./trim-slashes');

const parseUrl = (config, data) => {
  if (!config.url || !data) {
    return null;
  }

  const supportedTypes = ['number', 'string'];
  const replacements = Object.entries(data).reduce((acc, [key, val]) => {
    if (!supportedTypes.includes(typeof val)) {
      return acc;
    }

    return {
      ...acc,
      [key]: val,
    };
  }, {});

  const url = interpolate(trimSlashes(config.url), replacements);

  return url;
};

module.exports = parseUrl;
