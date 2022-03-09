import { prefixPluginTranslations } from '@strapi/helper-plugin';

import { getTrad, pluginId, pluginName } from './utils';
import { Initializer, Field } from './components';
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

  bootstrap() {},

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
