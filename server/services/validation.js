'use strict';

const get = require('lodash/get');
const has = require('lodash/has');
const { ValidationError } = require('@strapi/utils').errors;

const { UID_PERMALINK_FIELD, URI_COMPONENT_REGEX } = require('../constants');
const {
  getPermalinkAncestors,
  getPermalinkSlug,
  getService,
  isConnecting,
  pluginId,
} = require('../utils');

module.exports = ({ strapi }) => ({
  async validateAncestorConflict(uid, id, path, name, value) {
    const parts = path ? path.split('/') : [];

    // Check for conflict.
    if (parts.includes(value)) {
      const possibleConflict = parts.slice(0, parts.indexOf(value) + 1).join('/');

      const entity = await strapi.db.query(uid).findOne({
        where: {
          [name]: possibleConflict,
        },
      });

      return entity && entity.id === parseInt(id, 10);
    }

    return false;
  },

  async validateAvailability(uid, name, value, id = null, locale = undefined) {
    const model = strapi.db.metadata.get(uid);
    const isLocalized = model.pluginOptions.i18n.localized || false;

    const where = { [name]: value };
    // If `id` is not null, omit it from the results so we aren't comparing against itself.
    if (id) {
      where.id = {
        $ne: id,
      };
    }

    // takes the locale into consideration for uniqueness, if the locale is present, and the model is localized
    if (locale && isLocalized) {
      where.locale = {
        $eq: locale,
      };
    }

    const count = await strapi.db.query(uid).count({ where });

    return !(count > 0);
  },

  async validateConnection(uid, data, id = null) {
    const { name, targetRelation, targetRelationUID } = await getService('config').layouts(uid);
    const { name: relationPermalinkName } = await getService('config').layouts(targetRelationUID);
    const value = data[name];
    const ancestorsPath = getPermalinkAncestors(value);
    const slug = getPermalinkSlug(value);
    const isCreating = !id;

    /**
     * @TODO - Maybe check if `value` is not empty and cancel if nothing?
     */

    // Skip if there is nothing to validate.
    if (!isCreating && !ancestorsPath && !isConnecting(data, targetRelation)) {
      return;
    }

    // Attempt to get the connected entity or do nothing if there is none.
    const connectedEntity = await getService('permalinks').getConnectedEntity(uid, data, id);

    if ((ancestorsPath && !connectedEntity) || (!ancestorsPath && connectedEntity)) {
      throw new ValidationError(
        `Invalid permalink connection. Check ${name} and ${targetRelation} fields.`
      );
    }

    // Compare the current ancestors path against the connected entity's path.
    const connectedAncestorsPath = await getService('permalinks').getAncestorPath(
      uid,
      connectedEntity
    );

    if (ancestorsPath !== connectedAncestorsPath) {
      throw new ValidationError(`Invalid permalink connection. Paths do not match.`);
    }

    // If the UIDs are the same, check if the entity is being assigned as it's own descendant.
    if (!isCreating && uid === targetRelationUID) {
      const hasAncestorConflict = await getService('validation').validateAncestorConflict(
        uid,
        id,
        connectedAncestorsPath,
        name,
        slug
      );

      if (hasAncestorConflict) {
        throw new ValidationError(
          `Cannot assign the ${relationPermalinkName} relation as its own descendant.`
        );
      }
    }
  },

  async validateFormat(uid, value) {
    const { name } = await getService('config').layouts(uid);
    const isValid = URI_COMPONENT_REGEX.test(value);

    if (!isValid) {
      throw new ValidationError(`Invalid characters for permalink in ${name} field.`);
    }
  },

  async validateSchema() {
    const uids = await getService('config').uids();

    uids.forEach((uid) => {
      const model = strapi.db.metadata.get(uid);

      if (!model) {
        throw new ValidationError(`The content type ${uid} does not exist.`);
      }

      const { attributes } = model;

      // Ensure that exactly one permalink attribute is defined for this model.
      const permalinkAttrs = Object.entries(attributes).filter(
        ([, attr]) => attr.customField === UID_PERMALINK_FIELD
      );

      if (permalinkAttrs.length !== 1) {
        throw new ValidationError(`Must have exactly one permalink attribute defined in ${uid}.`);
      }

      // Ensure that permalink attributes have required plugin options defined.
      const [name, attr] = permalinkAttrs[0];
      const pluginOptions = get(attr, ['pluginOptions', pluginId]);

      if (!pluginOptions) {
        throw new ValidationError(`Missing pluginOptions for ${name} field in ${uid}.`);
      }

      if (!pluginOptions.targetField) {
        throw new ValidationError(`Missing targetField for ${name} field in ${uid}.`);
      }

      if (!pluginOptions.targetRelation) {
        throw new ValidationError(`Missing targetRelation for ${name} field in ${uid}.`);
      }

      // Ensure that permalink attributes target an actual string type field.
      const targetFieldAttr = attributes[pluginOptions.targetField];

      if (!targetFieldAttr) {
        throw new ValidationError(`Missing targetField attribute for ${name} in ${uid}.`);
      }

      if (targetFieldAttr.type !== 'string' && targetFieldAttr.type !== 'text') {
        throw new ValidationError(
          `Must use a valid string type for ${name} targetField in ${uid}. Found ${targetFieldAttr.type}.`
        );
      }

      // Ensure that permalink attributes target an actual relation field type that uses a oneToOne relation.
      const targetRelationAttr = attributes[pluginOptions.targetRelation];

      if (!targetRelationAttr) {
        throw new ValidationError(`Missing targetRelation attribute for ${name} in ${uid}.`);
      }

      if (targetRelationAttr.type !== 'relation') {
        throw new ValidationError(
          `Must use a valid relation type for ${name} targetRelation in ${uid}. Found ${targetRelationAttr.type}.`
        );
      }

      if (targetRelationAttr.relation !== 'oneToOne') {
        throw new ValidationError(
          `Must use a oneToOne relation for ${name} targetRelation in ${uid}.`
        );
      }
    });
  },

  async validateUIDInput(uid) {
    const layouts = await getService('config').layouts();

    // Verify this UID is supported in the plugin config.
    const model = strapi.getModel(uid);

    if (!model) {
      throw new ValidationError(`The model ${uid} was not found.`);
    }

    // Verify this UID is supported in the plugin config.
    const isSupported = has(layouts, uid);

    if (!isSupported) {
      throw new ValidationError(
        `The model ${uid} is not supported in the permalinks plugin config.`
      );
    }
  },
});
