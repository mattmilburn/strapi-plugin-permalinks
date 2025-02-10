import get from 'lodash/get';
import { type UID } from '@strapi/strapi';
import { errors } from '@strapi/utils';

import { getService } from '../utils';

const permalinksController = () => ({
  async config(ctx: any) {
    const config = await getService('config').get();
    const layouts = await getService('config').layouts();

    ctx.send({
      config: {
        ...config,
        layouts,
      },
    });
  },

  async ancestorsPath(ctx: any) {
    const { uid, id, relationId, value } = ctx.params;
    const decodedValue = decodeURIComponent(value);
    const isCreating = !id;

    // Validate UID.
    await getService('validation').validateUIDInput(uid);

    // Get connected relation.
    const { name, targetRelationUID } = await getService('config').layouts(uid);
    const { name: relationPermalinkName } = await getService('config').layouts(
      targetRelationUID as UID.ContentType
    );
    const ancestor = await getService('permalinks').getAncestor(uid, relationId);

    if (!ancestor) {
      throw new errors.NotFoundError(
        `The relation ${targetRelationUID}/${relationId} for ${name} was not found.`
      );
    }

    const path = await getService('permalinks').getAncestorPath(uid, ancestor);

    // If the UIDs are the same, check if the entry is being assigned as it's own descendant.
    if (!isCreating && uid === targetRelationUID) {
      const hasAncestorConflict = await getService('validation').validateAncestorConflict(
        uid,
        id,
        path,
        name,
        decodedValue
      );

      if (hasAncestorConflict) {
        return ctx.conflict(
          `Cannot assign the ${relationPermalinkName} relation as its own descendant.`,
          {
            path,
          }
        );
      }
    }

    ctx.send({ path });
  },

  async checkAvailability(ctx: any) {
    const { uid, value } = ctx.request.params;
    const decodedValue = decodeURIComponent(value);

    // Validate UID.
    await getService('validation').validateUIDInput(uid);

    // Check availability and maybe provide a suggestion.
    const { isAvailable, suggestion } = await getService('permalinks').getAvailability(
      uid,
      decodedValue
    );

    ctx.send({
      isAvailable,
      suggestion,
    });
  },

  async checkConnection(ctx: any) {
    const { uid, id } = ctx.request.params;

    // Validate UID.
    await getService('validation').validateUIDInput(uid);

    // Get connected relation.
    const entry = await getService('permalinks').getPopulatedEntity(uid, id);

    if (!entry) {
      throw new errors.NotFoundError(`The entry ${uid}/${id} was not found.`);
    }

    // Maybe get the connected ancestor's path.
    const { targetRelation } = await getService('config').layouts(uid);
    const relationId = get(entry, [targetRelation, 'id']);
    const ancestor = await getService('permalinks').getAncestor(uid, relationId);

    if (!relationId || !ancestor) {
      return ctx.send({ path: '' });
    }

    const path = await getService('permalinks').getAncestorPath(uid, ancestor);

    // Return path.
    ctx.send({ path });
  },

  async suggestion(ctx: any) {
    const { uid, value } = ctx.params;
    const decodedValue = decodeURIComponent(value);

    // Validate UID.
    await getService('validation').validateUIDInput(uid);

    // Provide a unique suggestion.
    const uids = await getService('config').uids(uid);
    const suggestion = await getService('permalinks').getSuggestion(uids, decodedValue);

    // Return suggested path.
    ctx.send({ suggestion });
  },
});

export default permalinksController;
