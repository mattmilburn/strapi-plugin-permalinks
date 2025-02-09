import get from 'lodash/get';
import { UID } from '@strapi/strapi';

import { PLUGIN_ID, UID_PERMALINK_FIELD } from '../constants';

const getPermalinkAttr = (
  uid: UID.ContentType
): {
  name: string;
  targetField: string;
  targetRelation: string;
  targetRelationUID: UID.ContentType;
} => {
  const model = strapi.getModel(uid);

  const permalinkAttr = Object.entries(model.attributes).find(([, attr]: any) => {
    return attr.customField === UID_PERMALINK_FIELD;
  });

  if (!permalinkAttr) {
    return null;
  }

  const [name, attr] = permalinkAttr;
  const { targetField, targetRelation } = get(attr, ['pluginOptions', PLUGIN_ID]);
  const targetRelationUID = get(model, ['attributes', targetRelation, 'target']);

  return {
    name,
    targetField,
    targetRelation,
    targetRelationUID,
  };
};

export default getPermalinkAttr;
