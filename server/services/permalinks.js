'use strict';

const qs = require( 'qs' );

const config = require( '../config' );
const { PATH_SEPARATOR } = require( '../constants' );
const { getPermalinkSlug, pluginId } = require( '../utils' );

module.exports = ( { strapi } ) => ( {
  async checkParentConflicts( id, path, value, config ) {
    const { uid, targetField } = config;
    const parts = path.split( PATH_SEPARATOR );

    // Check for conflict.
    if ( parts.includes( value ) ) {
      const pathConflict = parts.slice( 0, parts.indexOf( value ) + 1 ).join( PATH_SEPARATOR );
      const ancestor = await strapi.query( uid ).findOne( {
        where: {
          [ targetField ]: pathConflict,
        },
      } );

      return ancestor && ancestor.id === id;
    }

    return false;
  },

  async getConfig() {
    const data = await strapi.config.get( `plugin.${pluginId}`, config.default );

    return data;
  },

  async syncChildren( uid, id, value, options ) {
    const { targetField, targetRelation } = options;

    const itemsToUpdate = await strapi.query( uid ).findMany( {
      where: {
        [ targetRelation ]: { id },
      },
    } );

    // Do nothing if there are no immediate children to update.
    if ( ! itemsToUpdate.length ) {
      return;
    }

    const promisedUpdates = itemsToUpdate.map( async item => {
      const slug = getPermalinkSlug( item[ targetField ] );
      const updatedValue = `${value}${PATH_SEPARATOR}${slug}`;

      const updatedItem = await strapi.query( uid ).update( {
        where: { id: item.id },
        data: {
          [ targetField ]: updatedValue,
        },
      } );

      return updatedItem;
    } );

    await Promise.all( promisedUpdates );
  },
} );
