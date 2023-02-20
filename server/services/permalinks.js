'use strict';

const get = require( 'lodash/get' );
const isEmpty = require( 'lodash/isEmpty' );
const slugify = require( 'slugify' );
const { ValidationError } = require( '@strapi/utils' ).errors;

const { PATH_SEPARATOR } = require( '../constants' );
const { getPermalinkSlug, getService } = require( '../utils' );

module.exports = ( { strapi } ) => ( {
  async checkAncestorConflict( id, uid, path, field, value ) {
    const parts = path ? path.split( PATH_SEPARATOR ) : [];

    // Check for conflict.
    if ( parts.includes( value ) ) {
      const possibleConflict = parts.slice( 0, parts.indexOf( value ) + 1 ).join( PATH_SEPARATOR );

      const entity = await strapi.db.query( uid ).findOne( {
        where: {
          [ field ]: possibleConflict,
        },
      } );

      return entity && entity.id === parseInt( id );
    }

    return false;
  },

  async checkAvailability( uid, field, value ) {
    const count = await strapi.db.query( uid ).count( {
      where: { [ field ]: value },
    } );

    return count > 0 ? false : true;
  },

  async findUniquePermalink( uids, value ) {
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
      const updatedValue = `${value}${PATH_SEPARATOR}${slug}`;

      return strapi.entityService.update( uid, item.id, {
        data: {
          [ field ]: updatedValue,
        },
      } );
    } );

    await Promise.all( promisedUpdates );
  },
} );
