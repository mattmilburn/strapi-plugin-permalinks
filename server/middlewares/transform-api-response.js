'use strict';

const get = require( 'lodash/get' );
const has = require( 'lodash/has' );
const head = require( 'lodash/head' );
const isArray = require( 'lodash/isArray' );
const set = require( 'lodash/set' );

const { PATH_SEPARATOR, SLASH_SEPARATOR } = require( '../constants' );
const { getService, isApiRequest, parseUrl } = require( '../utils' );

// Transform API response by parsing data string to JSON for rich text fields.
module.exports = ( { strapi } ) => {
  const sanitize = ( data, keys, url ) => {
    const value = url
      ? parseUrl( url, data )
      : get( data, keys, '' );

    return value.replace( new RegExp( PATH_SEPARATOR, 'g' ), SLASH_SEPARATOR );
  };

  const transform = ( data, uid, config ) => {
    const layout = config.layouts[ uid ];
    const { url } = config.contentTypes.flat().find( item => item.uid === uid );
    const { name, targetRelation, targetRelationUID } = layout;

    if ( ! uid ) {
      return data;
    }

    // Single entry.
    if ( has( data, 'attributes' ) ) {
      return transform( data.attributes, uid, config );
    }

    // Collection of entries.
    if ( isArray( data ) && data.length ) {
      const firstItem = head( data );

      if ( has( firstItem, 'attributes' ) || has( firstItem, name ) ) {
        return data.map( item => transform( item, uid, config ) );
      }
    }

    // Maybe transform entries from the `localizations` array, which may only
    // apply if the API request populated the localized entries.
    if ( has( data, 'localizations' ) ) {
      data.localizations = data.localizations.map( entry => transform( entry, uid, config ) );
    }

    // Maybe sanitize the `targetRelation` permalink field, which may only apply
    // if the API request populated the relation.
    const { name: relationPermalinkName } = config.layouts[ targetRelationUID ];

    if ( has( data, [ targetRelation, relationPermalinkName ] ) ) {
      data[ targetRelation ] = transform( data[ targetRelation ], targetRelationUID, config );
    }

    // Sanitize permalink field by replacing ~ with / and maybe parse into full permalink.
    data[ name ] = sanitize( data, name, url );

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
    const uids = contentTypes.flat().map( ( { uid } ) => uid );
    const uid = uids.find( _uid => ctx.state.route.handler.includes( _uid ) );

    if ( ! uid ) {
      return;
    }

    const config = { contentTypes, layouts };

    ctx.body.data = transform( ctx.body.data, uid, config );
  } );
};
