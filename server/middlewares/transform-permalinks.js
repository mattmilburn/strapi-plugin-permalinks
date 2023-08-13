'use strict';

const get = require('lodash/get');
const has = require('lodash/has');
const head = require('lodash/head');
const omit = require('lodash/omit');

const { getService, isApiRequest, parseUrl } = require('../utils');

// Transform function used to transform the response object.
const transform = (data, uid, config) => {
  if (!data) {
    return data;
  }

  // Entity or relation wrapper.
  if (has(data, 'data')) {
    return {
      ...data,
      data: transform(data.data, uid, config),
    };
  }

  // Entity or relation data.
  if (has(data, 'attributes')) {
    return {
      ...data,
      attributes: transform(data.attributes, uid, config),
    };
  }

  // Support strapi-plugin-transformer features which might remove `attributes`
  // and `data` wrappers.
  if (has(data, 'id')) {
    return {
      ...data,
      // Must omit the id otherwise it creates an infinite loop.
      ...transform(omit(data, 'id'), uid, config),
    };
  }

  // Collection of entities, relations, or components.
  if (
    Array.isArray(data) &&
    (has(head(data), 'attributes') || has(head(data), 'id') || has(head(data), '__component'))
  ) {
    return data.map((item) => transform(item, uid, config));
  }

  const uidConfig = config.contentTypes.find(item => item.uids.includes(uid));
  const { name, targetRelation, targetRelationUID } = config.layouts[uid];

  // Transform permalink field.
  if (has(data, name)) {
    data[name] = parseUrl(uidConfig, data);
  }

  // Transform target relation field.
  if (has(data, targetRelation)) {
    data[targetRelation] = transform(data[targetRelation], targetRelationUID, config);
  }

  // Transform localizations array.
  if (has(data, 'localizations')) {
    data.localizations = data.localizations.map((item) => transform(item, uid, config));
  }

  return data;
};

// Transform API response.
module.exports = ({ strapi }) => {
  strapi.server.use(async (ctx, next) => {
    await next();

    if (!ctx.body || !ctx.body.data || !isApiRequest(ctx)) {
      return;
    }

    // Determine if this request should transform the data response.
    const { contentTypes } = await getService('config').get();
    const layouts = await getService('config').layouts();
    const uids = await getService('config').uids();
    const uid = uids.find(_uid => ctx.state.route.handler.includes(_uid));

    if (!uid) {
      return;
    }

    const config = { contentTypes, layouts };

    ctx.body.data = transform(ctx.body.data, uid, config);
  });
};
