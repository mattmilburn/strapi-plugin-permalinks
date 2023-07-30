'use strict';

const get = require( 'lodash/get' );
const has = require( 'lodash/has' );
const head = require( 'lodash/head' );
const omit = require('lodash/omit');
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
    const { url } = config.contentTypes.find( item => item.uids.includes( uid ) );
    const { name, targetRelation, targetRelationUID } = layout;

    if ( ! data || ! uid ) {
      return data;
    }

    // Entity or relation wrapper.
    if ( has( data, 'data' ) ) {
      return {
        ...data,
        data: transform( data.data, uid, config ),
      };
    }

    // Entity or relation data.
    if ( has( data, 'attributes' ) ) {
      return {
        ...data,
        attributes: transform( data.attributes, uid, config ),
      };
    }

    // Support strapi-plugin-transformer features which might remove `attributes`
    // and `data` wrappers.
    if ( has( data, 'id' ) ) {
      return {
        ...data,
        // Must omit the id otherwise it creates an infinite loop.
        ...transform( omit( data, 'id' ), uid, config ),
      };
    }

    // Collection of entities, relations, or components.
    if ( Array.isArray( data ) && (
      has( head( data ), 'attributes' ) ||
      has( head( data ), 'id' ) ||
      has( head( data ), '__component' )
    ) ) {
      return data.map( item => transform( item, uid, config ) );
    }

    // Maybe transform entries from the `localizations` array, which may only
    // apply if the API request populated the localized entries.
    if ( has( data, 'localizations' ) ) {
      data.localizations = transform( data.localizations, uid, config );
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
    const uids = await configService.uids();
    const uid = uids.find( _uid => ctx.state.route.handler.includes( _uid ) );

    if ( ! uid ) {
      return;
    }

    const config = { contentTypes, layouts };

    ctx.body.data = transform( ctx.body.data, uid, config );
  } );
};
