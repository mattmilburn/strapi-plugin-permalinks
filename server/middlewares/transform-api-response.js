'use strict';

const get = require( 'lodash/get' );
const has = require( 'lodash/has' );
const head = require( 'lodash/head' );
const isArray = require( 'lodash/isArray' );
const set = require( 'lodash/set' );

const { getService, isApiRequest } = require( '../utils' );

// Transform API response by parsing data string to JSON for rich text fields.
module.exports = ( { strapi } ) => {
  const transform = ( data, uid ) => {
    const [ name, attr ] = getService( 'permalinks' ).getPermalinkAttr( uid );

    if ( ! uid ) {
      return data;
    }

    // Single entry.
    if ( has( data, 'attributes' ) ) {
      return transform( data.attributes, uid );
    }

    // Collection of entries.
    if ( isArray( data ) && data.length ) {
      const firstItem = head( data );

      if ( has( firstItem, 'attributes' ) || has( firstItem, name ) ) {
        return data.map( item => transform( item, uid ) );
      }
    }

    // Replace ~ with / in the permalink field.
    data[ name ] = get( data, name, '' ).replace( /~/g, '/' );

    // Maybe replace ~ with / in the relation's permalink field, which may only
    // apply if the API request populated the relation.
    const { attributes } = strapi.getModel( uid );
    const relationUID = get( attributes, [ attr.targetRelation, 'target' ] );
    const [ relationName, relationAttr ] = getService( 'permalinks' ).getPermalinkAttr( relationUID );
    const relationKeys = [ attr.targetRelation, relationName ];

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

    if ( ! ctx.body || ! ctx.body.data || ! isApiRequest( ctx ) ) {
      return;
    }

    // Determine if this request should transform the data response.
    const { handler } = ctx.state.route;
    const { contentTypes2 } = await getService( 'config' ).get();
    const uids = contentTypes2.flat();
    const uid = uids.find( _uid => typeof handler === 'string' && handler.includes( _uid ) );

    if ( ! uid ) {
      return;
    }

    ctx.body.data = transform( ctx.body.data, uid );
  } );
};
