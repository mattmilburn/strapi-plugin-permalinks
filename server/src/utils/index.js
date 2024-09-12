'use strict';

const getPermalinkAncestors = require('./get-permalink-ancestors');
const getPermalinkAttr = require('./get-permalink-attr');
const getPermalinkSlug = require('./get-permalink-slug');
const getService = require('./get-service');
const interpolate = require('./interpolate');
const isApiRequest = require('./is-api-request');
const isConnecting = require('./is-connecting');
const parseUrl = require('./parse-url');
const pluginId = require('./plugin-id');
const trimSlashes = require('./trim-slashes');

module.exports = {
  getPermalinkAncestors,
  getPermalinkAttr,
  getPermalinkSlug,
  getService,
  interpolate,
  isApiRequest,
  isConnecting,
  parseUrl,
  pluginId,
  trimSlashes,
};
