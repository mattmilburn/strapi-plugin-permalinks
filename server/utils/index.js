'use strict';

const getPermalinkSlug = require( './get-permalink-slug' );
const getService = require( './get-service' );
const interpolate = require( './interpolate' );
const isApiRequest = require( './is-api-request' );
const parseUrl = require( './parse-url' );
const pluginId = require( './plugin-id' );
const trimSlashes = require( './trim-slashes' );

module.exports = {
  getPermalinkSlug,
  getService,
  interpolate,
  isApiRequest,
  parseUrl,
  pluginId,
  trimSlashes,
};
