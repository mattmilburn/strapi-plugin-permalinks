'use strict';

const { ValidationError } = require('@strapi/utils').errors;

module.exports = {
  default: {
    contentTypes: [],
    lowercase: true,
  },
  validator(config) {
    if (!config.contentTypes) {
      return;
    }

    // Ensure `contentTypes` is an array.
    if (!Array.isArray(config.contentTypes)) {
      throw new ValidationError('Must define contentTypes as an array.');
    }

    // Ensure each config object has a `uids` array defined.
    const uids = config.contentTypes.map((item) => item.uids).flat();

    uids.forEach((uid) => {
      if (!uid) {
        throw new ValidationError('Each contentType must have a uids prop defined as an array.');
      }
    });

    // Ensure UIDs only appear once across the config.
    const duplicateUIDs = uids.filter((uid, i) => uids.indexOf(uid) !== i);
    const uniqueDuplicateUIDs = duplicateUIDs.filter((uid, i) => duplicateUIDs.indexOf(uid) === i);

    if (duplicateUIDs.length) {
      throw new ValidationError(
        `Must not duplicate UIDs in permalinks config: ${uniqueDuplicateUIDs.join(', ')}.`
      );
    }
  },
};
