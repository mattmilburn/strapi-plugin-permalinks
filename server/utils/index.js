'use strict';

const getPermalinkSlug = require( './get-permalink-slug' );
const getService = require( './get-service' );
const isApiRequest = require( './is-api-request' );
const pluginId = require( './plugin-id' );

module.exports = {
  getPermalinkSlug,
  getService,
  isApiRequest,
  pluginId,
};
