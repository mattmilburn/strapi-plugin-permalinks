'use strict';

const qs = require( 'qs' );

const config = require( '../config' );
const { PATH_SEPARATOR } = require( '../constants' );
const { getPermalinkSlug, pluginId } = require( '../utils' );

module.exports = ( { strapi } ) => ( {
  async getConfig() {
    const data = await strapi.config.get( `plugin.${pluginId}`, config.default );

    return data;
  },

  async getEntity( uid, id ) {
    const entity = await strapi.query( uid ).findOne( {
      where: { id },
    } );

    return entity;
  },

  async findChildren( uid, id, target ) {
    return await strapi.query( uid ).findMany( {
      where: {
        [ target ]: { id },
      },
    } );
  },

  async syncDescendants( uid, rootId, value, options ) {
    const { targetField, targetRelation } = options;

    const updateLoop = ( items, next ) => {
      return items.map( async item => {
        const { id } = item;
        const initialValue = item[ targetField ];
        const slug = getPermalinkSlug( initialValue );
        const updatedValue = `${next}${PATH_SEPARATOR}${slug}`;

        const updatedItem = await strapi.query( uid ).update( {
          where: { id },
          data: {
            [ targetField ]: updatedValue,
          },
        } );

        const nextChildren = await this.findChildren( uid, id, targetRelation );

        // If this item has children that also need to be updated, keep the loop going.
        if ( nextChildren.length ) {
          const nextUpdatedItems = updateLoop( nextChildren, updatedValue );

          return [
            updatedItem,
            ...nextUpdatedItems,
          ];
        }

        return updatedItem;
      } );
    };

    const firstItemsToUpdate = await this.findChildren( uid, rootId, targetRelation );

    // Do nothing if there are no immediate children to update.
    if ( ! firstItemsToUpdate.length ) {
      return Promise.resolve();
    }

    const promisedUpdates = updateLoop( firstItemsToUpdate, value );

    return Promise.all( promisedUpdates );
  },
} );
