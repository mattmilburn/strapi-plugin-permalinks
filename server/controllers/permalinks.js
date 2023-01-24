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
    const configService = getService( 'config' );
    const pluginService = getService( 'permalinks' );
    const validationService = getService( 'validation' );

    await validationService.validateUIDInput( uid );

    const isCreating = ! id;
    const layouts = await configService.layouts();
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
    const validationService = getService( 'validation' );

    await validationService.validateUIDInput( uid );

    const layouts = await configService.layouts();
    const uids = await configService.uids( uid );

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

    // Maybe provide a unique suggestion.
    let suggestion = null;

    if ( ! isAvailable ) {
      const { uid: conflictUID } = promisedAvailables.find( ( { available } ) => ! available );

      suggestion = await pluginService.findUniquePermalink( [ conflictUID ], value );
    }

    ctx.body = {
      isAvailable,
      suggestion,
    };
  },

  async checkConnection( ctx ) {
    const { uid, id } = ctx.request.params;
    const configService = getService( 'config' );
    const validationService = getService( 'validation' );

    await validationService.validateUIDInput( uid );

    const layouts = await configService.layouts();
    const { name, targetRelation, targetRelationUID } = layouts[ uid ];
    const { name: relationPermalinkName } = layouts[ targetRelationUID ];

    // Check connection with `targetRelation`.
    const entity = await strapi.entityService.findOne( uid, id, {
      populate: [ targetRelation ],
    } );

    if ( ! entity ) {
      throw new NotFoundError( `The relation entity for ${name} was not found.` );
    }

    const path = get( entity, [ targetRelation, relationPermalinkName ], '' );

    // Return path.
    ctx.send( { path } );
  },

  async suggestion( ctx ) {
    const { uid, value } = ctx.params;
    const configService = getService( 'config' );
    const pluginService = getService( 'permalinks' );
    const validationService = getService( 'validation' );

    await validationService.validateUIDInput( uid );

    const layouts = await configService.layouts();
    const uids = await configService.uids( uid );

    // Provide a unique suggestion.
    const suggestion = await pluginService.findUniquePermalink( uids, value );

    // Return final path.
    ctx.send( { suggestion } );
  },
};
