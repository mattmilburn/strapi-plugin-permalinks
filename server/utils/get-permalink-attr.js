'use strict';

const get = require('lodash/get');

const { UID_PERMALINK_FIELD } = require('../constants');
const pluginId = require('./plugin-id');

const getPermalinkAttr = (uid) => {
  const model = strapi.getModel(uid);

  const permalinkAttr = Object.entries(model.attributes).find(
    ([, attr]) => attr.customField === UID_PERMALINK_FIELD
  );

  if (!permalinkAttr) {
    return null;
  }

  const [name, attr] = permalinkAttr;
  const { targetField, targetRelation } = get(attr, ['pluginOptions', pluginId]);
  const targetRelationUID = get(model, ['attributes', targetRelation, 'target']);

  return {
    name,
    targetField,
    targetRelation,
    targetRelationUID,
  };
};

module.exports = getPermalinkAttr;
