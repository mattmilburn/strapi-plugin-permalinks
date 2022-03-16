'use strict';

module.exports = ( { strapi } ) => {
  // TBD
  const afterUpdate = event => {
    console.log( event );
    // @TODO - Find other entities that use this one as their parent and update their permalinks.
  };

  // Subscribe to lifecycle hook.
  strapi.db.lifecycles.subscribe( {
    afterUpdate,
  } );
};
