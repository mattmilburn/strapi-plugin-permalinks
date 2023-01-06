import React from 'react';
import { prefixPluginTranslations } from '@strapi/helper-plugin';

import { Initializer } from './components';
import { filterPermalinkColumns } from './contentManagerHooks';
import reducers from './reducers';
import { pluginId, pluginName } from './utils';

export default {
  register( app ) {
    app.addReducers( reducers );

    app.registerPlugin( {
      id: pluginId,
      name: pluginName,
      initializer: Initializer,
      isReady: false,
    } );

    app.customFields.register( {
      pluginId,
      name: 'permalink',
      type: 'uid',
      icon: null,
      intlLabel: {
        id: 'permalink-input.label',
        defaultMessage: 'Permalink',
      },
      intlDescription: {
        id: 'permalink-input.description',
        defaultMessage: 'URL path field with relationship bindings.',
      },
      components: {
        Input: async () => import(
          /* webpackChunkName: "permalink-input" */ './components/PermalinkInput'
        ),
      },

      /**
       * @TODO - I would like to use the same options as the `uid` field in the
       * content-type-builder, which would be accomplished below with the `options`
       * prop. But there is no access to schema or other data in this prop which
       * makes it impossible to dynamically give options for the `targetField`.
       *
       * For now, the `targetField` will need to remain in the plugin config.
       */
      // options: {
      //   base: [
      //     {
      //       sectionTitle: null,
      //       items: [
      //         {
      //           intlLabel: {
      //             id: 'content-type-builder.modalForm.attribute.target-field',
      //             defaultMessage: 'Attached field',
      //           },
      //           name: 'targetField',
      //           type: 'select',
      //           options: [
      //             {
      //               key: '__null_reset_value__',
      //               value: '',
      //               metadatas: {
      //                 intlLabel: {
      //                   id: 'global.none',
      //                   defaultMessage: 'None',
      //                 },
      //               },
      //             },
      //             {
      //               key: 'title',
      //               value: 'title',
      //               metadatas: {
      //                 intlLabel: {
      //                   id: 'title..no-override',
      //                   defaultMessage: 'Title',
      //                 },
      //               },
      //             },
      //           ],
      //         },
      //       ],
      //     },
      //   ],
      // },
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
