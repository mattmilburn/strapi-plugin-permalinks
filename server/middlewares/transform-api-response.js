'use strict';

const get = require( 'lodash/get' );
const has = require( 'lodash/has' );
const head = require( 'lodash/head' );
const isArray = require( 'lodash/isArray' );
const set = require( 'lodash/set' );

const { getService, isApiRequest } = require( '../utils' );

// Transform API response by parsing data string to JSON for rich text fields.
module.exports = ( { strapi } ) => {
  const transform = ( data, uid, layouts ) => {
    const { name, targetRelation, targetRelationUID } = layouts[ uid ];

    if ( ! uid ) {
      return data;
    }

    // Single entry.
    if ( has( data, 'attributes' ) ) {
      return transform( data.attributes, uid, layouts );
    }

    // Collection of entries.
    if ( isArray( data ) && data.length ) {
      const firstItem = head( data );

      if ( has( firstItem, 'attributes' ) || has( firstItem, name ) ) {
        return data.map( item => transform( item, uid, layouts ) );
      }
    }

    // Replace ~ with / in the permalink field.
    data[ name ] = get( data, name, '' ).replace( /~/g, '/' );

    // Maybe replace ~ with / in the relation's permalink field, which may only
    // apply if the API request populated the relation.
    const { name: relationPermalinkName } = layouts[ targetRelationUID ];
    const relationKeys = [ targetRelation, relationPermalinkName ];

    if ( has( data, relationKeys ) ) {
      set(
        data,
        relationKeys,
        get( data, relationKeys ).replace( /~/g, '/' )
      );
    }

    return data;
  };

  strapi.server.use( async ( ctx, next ) => {
    await next();

    if (
      ! ctx.body ||
      ! ctx.body.data ||
      ! isApiRequest( ctx ) ||
      typeof ctx.state.route.handler !== 'string'
    ) {
      return;
    }

    // Determine if this request should transform the data response.
    const configService = getService( 'config' );
    const { contentTypes } = await configService.get();
    const layouts = await configService.layouts();
    const uids = contentTypes.flat();
    const uid = uids.find( _uid => ctx.state.route.handler.includes( _uid ) );

    if ( ! uid ) {
      return;
    }

    ctx.body.data = transform( ctx.body.data, uid, layouts );
  } );
};
