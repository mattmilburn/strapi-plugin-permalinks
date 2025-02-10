import has from 'lodash/has';
import head from 'lodash/head';
import omit from 'lodash/omit';
import { type Core, type UID } from '@strapi/strapi';

import { type PermalinksPluginConfig } from '../config';
import { getService, isApiRequest, parseUrl } from '../utils';

export interface PermalinksLayoutsConfig {
  layouts: any;
}
export interface PermalinksTransformConfig
  extends PermalinksPluginConfig,
    PermalinksLayoutsConfig {}

// Transform function used to transform the response object.
const transform = (data: any, uid: UID.ContentType, config: PermalinksTransformConfig) => {
  if (!data) {
    return data;
  }

  // Entity or relation wrapper.
  if (data?.data) {
    return {
      ...data,
      data: transform(data.data, uid, config),
    };
  }

  // Entity or relation data.
  if (data?.attributes) {
    return {
      ...data,
      attributes: transform(data.attributes, uid, config),
    };
  }

  // Support strapi-plugin-transformer features which might remove `attributes`
  // and `data` wrappers.
  if (data?.id) {
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

  const uidConfig = config.contentTypes.find((item) => item.uids.includes(uid));
  const { name, targetRelation, targetRelationUID } = config.layouts[uid];

  // Transform permalink field.
  if (has(data, name)) {
    const parsedValue = parseUrl(uidConfig, data);

    if (parsedValue) {
      data[name] = parsedValue;
    }
  }

  // Transform target relation field.
  if (has(data, targetRelation)) {
    data[targetRelation] = transform(data[targetRelation], targetRelationUID, config);
  }

  // Transform localizations array.
  if (data?.localizations) {
    data.localizations = transform(data.localizations, uid, config);
  }

  return data;
};

// Transform API response.
const transformMiddleware = async (strapi: Core.Strapi) => {
  strapi.server.use(async (ctx, next) => {
    await next();

    if (!ctx.body || !ctx.body.data || !isApiRequest(ctx)) {
      return;
    }

    // Determine if this request should transform the data response.
    const { contentTypes } = await getService('config').get();
    const layouts = await getService('config').layouts();
    const uids = await getService('config').uids();
    const uid = uids.find((_uid) => ctx.state.route.handler.includes(_uid));

    if (!uid) {
      return;
    }

    const config = { contentTypes, layouts };

    ctx.body.data = transform(ctx.body.data, uid, config);
  });
};

export default transformMiddleware;
