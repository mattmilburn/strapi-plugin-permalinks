'use strict';

const get = require( 'lodash/get' );
const uniq = require( 'lodash/uniq' );
const { NotFoundError, ValidationError } = require('@strapi/utils').errors;

const { getService } = require( '../utils' );

module.exports = {
  async config( ctx ) {
    const { contentTypes, contentTypes2 } = await getService( 'config' ).get();

    const config = {
      contentTypes,
      contentTypes2,
    };

    ctx.send( { config } );
  },

  async ancestorsPath( ctx ) {
    const { uid, id, relationId, value } = ctx.params;
    const pluginService = getService( 'permalinks' );
    const model = strapi.getModel( uid );
    const isCreating = ! id;

    if ( ! model ) {
      throw new ValidationError( `The model ${uid} was not found.` );
    }

    const isSupported = await pluginService.validateSupport( uid );

    if ( ! isSupported ) {
      throw new ValidationError( `The model ${uid} is not supported in the permalinks plugin config.` );
    }

    const { attributes } = model;
    const [ name, attr ] = pluginService.getPermalinkAttr( uid );
    const relationAttr = attributes[ attr.targetRelation ];
    const relationEntity = await strapi.query( relationAttr.target ).findOne( {
      where: { id: relationId },
    } );

    if ( ! relationEntity ) {
      throw new NotFoundError( `The relation entity for ${name} was not found.` );
    }

    // Get the permalink field in the relation field's model.
    const [ relationPermalinkName ] = pluginService.getPermalinkAttr( relationAttr.target );
    const path = get( relationEntity, relationPermalinkName, '' );

    // If the UIDs are the same, check if the entity is being assigned as it's own descendant.
    if ( ! isCreating && uid === relationAttr.target ) {
      const hasAncestorConflict = await pluginService.checkAncestorConflict(
        id,
        uid,
        path,
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
    const { contentTypes2 } = await getService( 'config' ).get();
    const uids = contentTypes2.find( uids => uids.includes( uid ) );
    const pluginService = getService( 'permalinks' );

    const isSupported = await pluginService.validateSupport( uid );

    if ( ! isSupported ) {
      throw new ValidationError( `The model ${uid} is not supported in the permalinks plugin config.` );
    }

    // Check availability in each related collection.
    const promisedAvailables = await Promise.all( uids.map( _uid => {
      return pluginService.checkAvailability( _uid, value );
    } ) );

    const isAvailable = promisedAvailables.every( available => available );

    // Maybe provide a suggestion.
    // const suggestion = ! isAvailable
    //   ? await pluginService.findUniqueUID( uid, value )
    //   : null;

    ctx.body = {
      isAvailable,
      suggestion: '',
    };
  },

  async checkConnection( ctx ) {
    const { uid, id } = ctx.request.params;
    const pluginService = getService( 'permalinks' );
    const model = strapi.getModel( uid );

    if ( ! model ) {
      throw new ValidationError( `The model ${uid} was not found.` );
    }

    const isSupported = await pluginService.validateSupport( uid );

    if ( ! isSupported ) {
      throw new ValidationError( `The model ${uid} is not supported in the permalinks plugin config.` );
    }

    const { attributes } = model;
    const [ name, attr ] = pluginService.getPermalinkAttr( uid );
    const relationAttr = attributes[ attr.targetRelation ];
    const [ relationPermalinkName ] = pluginService.getPermalinkAttr( relationAttr.target );
    const entity = await strapi.query( uid ).findOne( {
      where: { id },
      populate: [ attr.targetRelation ],
    } );

    if ( ! entity ) {
      throw new NotFoundError( `The relation entity for ${name} was not found.` );
    }

    const path = get( entity, [ attr.targetRelation, relationPermalinkName ], '' );

    // Return final path (might be empty).
    ctx.send( { path } );
  },
};
