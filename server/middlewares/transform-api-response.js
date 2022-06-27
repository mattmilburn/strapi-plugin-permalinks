'use strict';

const { get, has, head, isArray } = require( 'lodash' );

const { getService, isApiRequest } = require( '../utils' );

// Transform function which is used to transform the response object.
const transform = ( data, field ) => {
  // Single entry.
  if ( has( data, 'attributes' ) ) {
    return transform( data.attributes, field );
  }

  // Collection of entries.
  if ( isArray( data ) && data.length && has( head( data ), 'attributes' ) ) {
    return data.map( item => transform( item, field ) );
  }

  // Replace ~ with / in slug fields.
  data[ field ] = data[ field ].replace( '~', '/' );

  return data;
};

// Transform API response by parsing data string to JSON for rich text fields.
module.exports = ( { strapi } ) => {
  strapi.server.use( async ( ctx, next ) => {
    const config = await getService( 'config' ).get();

    await next();

    if ( ! ctx.body || ! config.contentTypes ) {
      return;
    }

    // Determine if this request should transform the data response.
    const { handler } = ctx.state.route;
    const contentType = config.contentTypes.find( ( { uid } ) => handler.includes( uid ) );
    const shouldTransform = ctx.body.data && isApiRequest( ctx ) && !! contentType;

    if ( shouldTransform ) {
      ctx.body.data = transform( ctx.body.data, contentType.targetField );
    }
  } );
};
