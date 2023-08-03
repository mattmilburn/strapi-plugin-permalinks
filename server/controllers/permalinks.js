'use strict';

const get = require( 'lodash/get' );
const has = require( 'lodash/has' );
const uniq = require( 'lodash/uniq' );
const { NotFoundError } = require( '@strapi/utils' ).errors;

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
    const configService = getService( 'config' );
    const pluginService = getService( 'permalinks' );
    const validationService = getService( 'validation' );
    const { uid, id, relationId, value } = ctx.params;
    const isCreating = ! id;

    // Validate UID.
    await validationService.validateUIDInput( uid );

    // Get ancestor's path.
    const { name, targetRelationUID } = await configService.layouts( uid );
    const ancestor = await pluginService.getAncestor( uid, relationId );

    if ( ! ancestor ) {
      throw new NotFoundError( `The relation entity for ${name} was not found.` );
    }

    const path = await pluginService.getAncestorPath( uid, id, ancestor );

    // If the UIDs are the same, check if the entity is being assigned as it's own descendant.
    if ( ! isCreating && uid === targetRelationUID ) {
      const hasAncestorConflict = await validationService.validateAncestorConflict(
        uid,
        path,
        name,
        value
      );

      if ( hasAncestorConflict ) {
        return ctx.badRequest( `Cannot assign the ${relationPermalinkName} relation as its own descendant.` );
      }
    }

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

    /**
     * @START - Refactor logic below into `getAvailability()` service method.
     */

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

    /**
     * @END
     */

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

    /**
     * @START - Refactor logic below into `getParentEntity()` service method.
     */
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

    /**
     * @END
     */

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
