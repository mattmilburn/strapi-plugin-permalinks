import React from 'react';
import { get } from 'lodash';
import { prefixPluginTranslations, request } from '@strapi/helper-plugin';

import { Initializer, Field } from './components';
import { filterPermalinkColumns } from './contentManagerHooks';
import reducers from './reducers';
import { getTrad, pluginId, pluginName } from './utils';

export default {
  register( app ) {
    app.addReducers( reducers );

    app.addFields( {
      type: 'uid',
      Component: Field,
    } );

    app.registerPlugin( {
      id: pluginId,
      name: pluginName,
      initializer: Initializer,
      isReady: false,
    } );
  },

  async bootstrap( app ) {
    try {
      const endpoint = `/${pluginId}/config`;
      const data = await request( endpoint, { method: 'GET' } );
      const pluginConfig = data?.config ?? {};

      // Create callbacks with plugin config included.
      const listViewColumnHook = props => filterPermalinkColumns( props, pluginConfig );

      // Register hooks.
      app.registerHook( 'Admin/CM/pages/ListView/inject-column-in-table', listViewColumnHook );
    } catch ( _err ) {
      // Probably just failed because user is not logged in, which is fine.
      return;
    }
  },

  async registerTrads( { locales } ) {
    const importedTrads = await Promise.all(
      locales.map( locale => {
        return import( `./translations/${locale}.json` )
          .then( ( { default: data } ) => {
            return {
              data: prefixPluginTranslations( data, pluginId ),
              locale,
            };
          } )
          .catch( () => {
            return {
              data: {},
              locale,
            };
          } );
      } )
    );

    return Promise.resolve( importedTrads );
  },
};
