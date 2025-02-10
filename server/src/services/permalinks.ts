import get from 'lodash/get';
import slugify from 'slugify';
import { type Core, type UID } from '@strapi/strapi';

import { getPermalinkSlug, getService } from '../utils';

export type PermalinksService = ReturnType<typeof permalinksService>;

const permalinksService = ({ strapi }: { strapi: Core.Strapi }) => ({
  async getAncestor(uid: UID.ContentType, relationId: string): Promise<any> {
    if (!relationId) {
      return null;
    }

    const { targetRelationUID } = await getService('config').layouts(uid);
    const relationEntity = await strapi.entityService.findOne(targetRelationUID, relationId);

    return relationEntity;
  },

  async getAncestorPath(uid: UID.ContentType, relationEntity: any): Promise<string> {
    if (!relationEntity) {
      return '';
    }

    const { targetRelationUID } = await getService('config').layouts(uid);
    const { name } = await getService('config').layouts(targetRelationUID);
    const path = get(relationEntity, name, '');

    return path;
  },

  async getAvailability(
    uid: UID.ContentType,
    value: string
  ): Promise<{
    isAvailable: boolean;
    suggestion: string;
  }> {
    const layouts = await getService('config').layouts();
    const uids = await getService('config').uids(uid);

    // Check availability in each related collection.
    const promisedAvailables = await Promise.all(
      uids.map((_uid) => {
        const { name } = layouts[_uid];

        return getService('validation')
          .validateAvailability(_uid, name, value)
          .then((available) => ({
            uid: _uid,
            available,
          }));
      })
    );

    const isAvailable = promisedAvailables.every(({ available }) => available);
    let suggestion = null;

    // Provide a unique suggestion if unavailable.
    if (!isAvailable) {
      const { uid: conflictUID } = promisedAvailables.find(({ available }) => !available);

      suggestion = await getService('permalinks').getSuggestion([conflictUID], value);
    }

    return {
      isAvailable,
      suggestion,
    };
  },

  async getConnectedEntity(
    uid: UID.ContentType,
    data: any,
    id: string | null = null
  ): Promise<any> {
    const { targetRelation } = await getService('config').layouts(uid);
    const connectionId = get(data, [targetRelation, 'connect', 0, 'id']);
    const isCreating = !id;
    const isConnecting = !!connectionId;

    // Skip if we are creating an entry with no connection.
    if (isCreating && !isConnecting) {
      return null;
    }

    let entry, ancestor;

    // Either get the ancestor from the connecting relation or look it up in the database.
    if (isConnecting) {
      ancestor = await getService('permalinks').getAncestor(uid, connectionId);
    }

    if (!isCreating && !isConnecting) {
      entry = await getService('permalinks').getPopulatedEntity(uid, id);
      ancestor = entry[targetRelation];
    }

    return ancestor;
  },

  async getPopulatedEntity(uid: UID.ContentType, id: string): Promise<any> {
    const { targetRelation } = await getService('config').layouts(uid);

    const entry = await strapi.entityService.findOne(uid, id, {
      populate: [targetRelation],
    });

    return entry;
  },

  async getSuggestion(uids: UID.ContentType[], value: string): Promise<string> {
    const layouts = await getService('config').layouts();
    const slugifyOptions = { lower: true };
    const slugValue = getPermalinkSlug(value);
    const slug = slugify(slugValue, slugifyOptions);

    const promisedConflicts = await Promise.all(
      uids.map((uid) => {
        const { name } = layouts[uid];
        const model = strapi.getModel(uid);
        const defaultValue = get(model, ['attributes', name, 'default'], model.modelName);
        const slugQuery = slugify(slug || defaultValue, slugifyOptions);

        return strapi.entityService
          .findMany(uid, {
            filters: {
              [name]: {
                $contains: slugQuery,
              },
            },
          })
          .then((results) => results.map((result) => result[name]));
      })
    );

    const possibleConflicts = promisedConflicts.flat();

    if (possibleConflicts.length === 0) {
      return slug;
    }

    let i = 1;
    let tmpUID = `${slug}-${i}`;
    while (possibleConflicts.includes(tmpUID)) {
      i += 1;
      tmpUID = `${slug}-${i}`;
    }

    return tmpUID;
  },

  async syncChildren(
    uid: UID.ContentType,
    id: string,
    value: string,
    field: any,
    relationField: any
  ): Promise<any[]> {
    const itemsToUpdate = await strapi.entityService.findMany(uid, {
      filters: {
        [relationField]: { id },
      },
    });

    // Do nothing if there are no immediate children to update.
    if (!itemsToUpdate.length) {
      return;
    }

    const promisedUpdates = itemsToUpdate.map((item) => {
      const slug = getPermalinkSlug(item[field]);
      const updatedValue = `${value}/${slug}`;

      return strapi.entityService.update(uid, item.id, {
        data: {
          [field]: updatedValue,
        },
      });
    });

    await Promise.all(promisedUpdates);
  },
});

export default permalinksService;
