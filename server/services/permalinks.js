'use strict';

const get = require( 'lodash/get' );
const isEmpty = require( 'lodash/isEmpty' );
const slugify = require( 'slugify' );

const { getPermalinkSlug, getService } = require( '../utils' );

module.exports = ( { strapi } ) => ( {
  async getAncestor( uid, relationId ) {
    if ( ! relationId ) {
      return null;
    }

    const { targetRelationUID } = await getService( 'config' ).layouts( uid );
    const relationEntity = await strapi.entityService.findOne( targetRelationUID, relationId );

    return relationEntity;
  },

  async getAncestorPath( uid, id, relationEntity ) {
    if ( ! relationEntity ) {
      return '';
    }

    const { name, targetRelationUID } = await getService( 'config' ).layouts( uid );
    const { name: relationPermalinkName } = await getService( 'config' ).layouts( targetRelationUID );
    const path = get( relationEntity, relationPermalinkName, '' );

    return path;
  },

  async getAvailability( uid, value ) {
    const layouts = await getService( 'config' ).layouts();
    const uids = await getService( 'config' ).uids( uid );

    // Check availability in each related collection.
    const promisedAvailables = await Promise.all( uids.map( _uid => {
      const { name } = layouts[ _uid ];

      return getService( 'validation' )
        .validateAvailability( _uid, name, value )
        .then( available => ( {
          uid: _uid,
          available,
        } ) );
    } ) );

    const isAvailable = promisedAvailables.every( ( { available } ) => available );
    let suggestion = null;

    // Provide a unique suggestion if unavailable.
    if ( ! isAvailable ) {
      const { uid: conflictUID } = promisedAvailables.find( ( { available } ) => ! available );

      suggestion = await getService( 'permalinks' ).getSuggestion( [ conflictUID ], value );
    }

    return {
      isAvailable,
      suggestion,
    };
  },

  async getPopulatedEntity( uid, id ) {
    const { targetRelation } = await getService( 'config' ).layouts( uid );

    const entity = await strapi.entityService.findOne( uid, id, {
      populate: [ targetRelation ],
    } );

    return entity;
  },

  async getSuggestion( uids, value ) {
    const layouts = await getService( 'config' ).layouts();
    const slugifyOptions = { lower: true };
    const slug = slugify( value, slugifyOptions );

    const promisedConflicts = await Promise.all( uids.map( uid => {
      const { name } = layouts[ uid ];
      const model = strapi.getModel( uid );
      const defaultValue = get( model, [ 'attributes', name, 'default' ], model.modelName );
      const slugQuery = slugify( slug || defaultValue, slugifyOptions );

      return strapi.entityService
        .findMany( uid, {
          filters: {
            [ name ]: {
              $contains: slugQuery,
            },
          },
        } )
        .then( results => results.map( result => result[ name ] ) );
    } ) );

    const possibleConflicts = promisedConflicts.flat();

    if ( possibleConflicts.length === 0 ) {
      return slug;
    }

    let i = 1;
    let tmpUID = `${slug}-${i}`;
    while ( possibleConflicts.includes( tmpUID ) ) {
      i++;
      tmpUID = `${slug}-${i}`;
    }

    return tmpUID;
  },

  async syncChildren( uid, id, value, field, relationField ) {
    const itemsToUpdate = await strapi.entityService.findMany( uid, {
      filters: {
        [ relationField ]: { id },
      },
    } );

    // Do nothing if there are no immediate children to update.
    if ( ! itemsToUpdate.length ) {
      return;
    }

    const promisedUpdates = itemsToUpdate.map( item => {
      const slug = getPermalinkSlug( item[ field ] );
      const updatedValue = `${value}/${slug}`;

      return strapi.entityService.update( uid, item.id, {
        data: {
          [ field ]: updatedValue,
        },
      } );
    } );

    await Promise.all( promisedUpdates );
  },
} );
