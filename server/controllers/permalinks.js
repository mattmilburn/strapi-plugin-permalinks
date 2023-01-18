'use strict';

const get = require( 'lodash/get' );
const has = require( 'lodash/has' );
const uniq = require( 'lodash/uniq' );
const { NotFoundError, ValidationError } = require( '@strapi/utils' ).errors;

const { getService } = require( '../utils' );

module.exports = {
  async config( ctx ) {
    const configService = getService( 'config' );
    const config = await configService.get();
    const layouts = await configService.layouts();

    ctx.send( {
      config: {
        ...config,
        layouts,
      },
    } );
  },

  async ancestorsPath( ctx ) {
    const { uid, id, relationId, value } = ctx.params;
    const layouts = await getService( 'config' ).layouts();
    const pluginService = getService( 'permalinks' );
    const isCreating = ! id;
    const isSupported = has( layouts, uid );
    const model = pluginService.getModel( uid );

    if ( ! isSupported ) {
      throw new ValidationError( `The model ${uid} is not supported in the permalinks plugin config.` );
    }

    const { name, targetRelation, targetRelationUID } = layouts[ uid ];
    const relationEntity = await strapi.entityService.findOne( targetRelationUID, relationId );

    if ( ! relationEntity ) {
      throw new NotFoundError( `The relation entity for ${name} was not found.` );
    }

    // Get the permalink field in the relation field's model.
    const { name: relationPermalinkName } = layouts[ targetRelationUID ];
    const path = get( relationEntity, relationPermalinkName, '' );

    // If the UIDs are the same, check if the entity is being assigned as it's own descendant.
    if ( ! isCreating && uid === targetRelationUID ) {
      const hasAncestorConflict = await pluginService.checkAncestorConflict(
        id,
        uid,
        path,
        name,
        value
      );

      if ( hasAncestorConflict ) {
        return ctx.conflict( `Cannot assign the ${relationPermalinkName} relation as its own descendant.` );
      }
    }

    // Return final path.
    ctx.send( { path } );
  },

  async checkAvailability( ctx ) {
    const { uid, value } = ctx.request.params;
    const configService = getService( 'config' );
    const pluginService = getService( 'permalinks' );
    const { contentTypes } = await configService.get();
    const layouts = await configService.layouts();
    const uids = contentTypes.find( items => !! items.find( item => item.uid === uid ) );
    const isSupported = has( layouts, uid );

    if ( ! isSupported ) {
      throw new ValidationError( `The model ${uid} is not supported in the permalinks plugin config.` );
    }

    // Check availability in each related collection.
    const promisedAvailables = await Promise.all( uids.map( _uid => {
      const { name } = layouts[ _uid ];

      return pluginService
        .checkAvailability( _uid, name, value )
        .then( available => ( {
          uid: _uid,
          available,
        } ) );
    } ) );

    const isAvailable = promisedAvailables.every( ( { available } ) => available );

    // Maybe provide a suggestion.
    let suggestion = null;

    if ( ! isAvailable ) {
      const { uid: conflictUID } = promisedAvailables.find( ( { available } ) => ! available );
      const targetConflictField = get( layouts, [ conflictUID, 'targetField' ] );

      suggestion = await pluginService.findUniquePermalink( conflictUID, targetConflictField, value );
    }

    ctx.body = {
      isAvailable,
      suggestion,
    };
  },

  async checkConnection( ctx ) {
    const { uid, id } = ctx.request.params;
    const layouts = await getService( 'config' ).layouts();
    const pluginService = getService( 'permalinks' );
    const model = pluginService.getModel( uid );
    const isSupported = has( layouts, uid );

    if ( ! isSupported ) {
      throw new ValidationError( `The model ${uid} is not supported in the permalinks plugin config.` );
    }

    const { attributes } = model;
    const { name, targetRelation, targetRelationUID } = layouts[ uid ];
    const { name: relationPermalinkName } = layouts[ targetRelationUID ];

    const entity = await strapi.entityService.findOne( uid, id, {
      populate: [ targetRelation ],
    } );

    if ( ! entity ) {
      throw new NotFoundError( `The relation entity for ${name} was not found.` );
    }

    const path = get( entity, [ targetRelation, relationPermalinkName ], '' );

    // Return final path (might be empty).
    ctx.send( { path } );
  },
};
