import React from 'react';
import { prefixPluginTranslations } from '@strapi/helper-plugin';
import { get } from 'lodash';

import { getTrad, pluginId, pluginName } from './utils';
import { Initializer, Field } from './components';
import { filterPermalinkColumns } from './contentManagerHooks';
import reducers from './reducers';

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

  bootstrap( app ) {
    app.registerHook( 'Admin/CM/pages/ListView/inject-column-in-table', filterPermalinkColumns );
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
