'use strict';

const get = require( 'lodash/get' );
const uniq = require( 'lodash/uniq' );

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

  async ancestorsPath2( ctx ) {
    const { uid, id, relationId, value } = ctx.params;
    const configService = getService( 'config' );
    const pluginService = getService( 'permalinks' );

    const model = strapi.contentTypes[ uid ];
    const { contentTypes2 } = await configService.get();
    const isConnected = contentTypes2.flat().includes( uid );

    // Return an error if
    if ( ! model ) {
      return ctx.badRequest( `The model ${uid} does not exist.` );
    }

    if ( ! isConnected ) {
      return ctx.badRequest( `The model ${uid} is not connected in the permalinks plugin config.` );
    }

    const { attributes } = model;

    // Identify the permalink field in this model.
    const permalinkAttr = Object.values( attributes ).find( attr => {
      return attr?.customField === 'plugin::permalinks.permalink';
    } );

    if ( ! permalinkAttr ) {
      return ctx.badRequest( `The model ${uid} does not have a permalinks attribute defined.` );
    }

    // Identify the connected relation field in this model.
    const relationAttr = attributes[ permalinkAttr.targetRelation ];

    const relationEntity = await strapi.query( relationAttr.target ).findOne( {
      where: { id: relationId },
    } );

    if ( ! relationEntity ) {
      return ctx.notFound();
    }

    const relationModel = strapi.contentTypes[ relationAttr.target ];

    // Identify the permalink field in the relation field's model.
    const relationPermalinkAttr = Object.entries( relationModel.attributes ).find( ( [ name, attr ] ) => {
      return attr?.customField === 'plugin::permalinks.permalink';
    } );

    if ( ! relationPermalinkAttr ) {
      return ctx.badRequest( `The model ${relationAttr.target} does not have a permalinks attribute defined.` );
    }

    const [ relationPermalinkAttrName ] = relationPermalinkAttr;
    const path = get( relationEntity, relationPermalinkAttrName, '' );

    // Check if the entity in question is being assigned as it's own ancestor, but
    // only if this UID and relation UID are the same.
    // if ( uid === relationAttr.target ) {
    //   const hasParentConflict = await pluginService.checkSameParentConflict(
    //     id,
    //     uid,
    //     path,
    //     value,
    //     supportedType.targetField
    //   );
    //
    //   if ( hasParentConflict ) {
    //     return ctx.conflict();
    //   }
    // }

    // Return final path.
    ctx.send( { path } );
  },

  async ancestorsPath( ctx ) {
    const { uid, id, parentId, parentUID, value } = ctx.request.body;
    const configService = getService( 'config' );
    const pluginService = getService( 'permalinks' );
    const { contentTypes } = await configService.get();
    const supportedType = contentTypes.find( type => type.uid === uid );
    const supportedParentType = contentTypes.find( type => type.uid === parentUID );

    if ( ! supportedType ) {
      return ctx.notFound();
    }

    const parentEntity = await strapi.query( parentUID ).findOne( {
      where: { id: parentId },
    } );

    if ( ! parentEntity ) {
      return ctx.notFound();
    }

    const path = get( parentEntity, supportedParentType.targetField, '' );

    // Check if the entity in question is being assigned as it's own ancestor, but
    // only if `uid` and `parentUID` are the same.
    if ( uid === parentUID ) {
      const hasParentConflict = await pluginService.checkSameParentConflict(
        id,
        uid,
        path,
        value,
        supportedType.targetField
      );

      if ( hasParentConflict ) {
        return ctx.conflict();
      }
    }

    // Return final path.
    ctx.send( { path } );
  },

  async checkAvailability( ctx ) {
    const { uid, parentUID, field, value } = ctx.request.body;
    const configService = getService( 'config' );
    const pluginService = getService( 'permalinks' );
    const { contentTypes } = await configService.get();
    const currentUIDs = [ uid, parentUID ];

    // Determine which supported `uids` could present a possible conflict.
    const otherUIDs = contentTypes
      .filter( type => type.targetUID && ! currentUIDs.includes( type.targetUID ) )
      .map( type => type.uid );

    // Combine unique `uids`.
    const uids = uniq( [ ...currentUIDs, ...otherUIDs ] );

    // Validate that the fields are actually a `uid` fields.
    uids.forEach( _uid => pluginService.validateUIDField( _uid, field ) );

    // Determine availability.
    const promisedAvailables = await Promise.all( uids.map( _uid => {
      return pluginService.checkUIDAvailability( _uid, field, value );
    } ) );

    const isAvailable = promisedAvailables.every( available => available );

    // Maybe provide a suggestion.
    const suggestion = ! isAvailable
      ? await pluginService.findUniqueUID( parentUID, field, value )
      : null;

    ctx.body = {
      isAvailable,
      suggestion,
    };
  },

  async checkConnection( ctx ) {
    const { uid, id, targetField } = ctx.request.body;
    const pluginService = getService( 'permalinks' );

    const entity = await strapi.query( uid ).findOne( {
      where: { id },
      populate: [ targetField ],
    } );

    const target = get( entity, targetField );

    ctx.body = {
      [ targetField ]: target ? target : null,
    };
  },
};
