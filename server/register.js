'use strict';

module.exports = ( { strapi } ) => {
  strapi.customFields.register( {
    plugin: 'permalinks',
    name: 'permalink',
    type: 'string',
  } );
};
