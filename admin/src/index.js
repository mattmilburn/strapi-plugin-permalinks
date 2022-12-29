import React from 'react';
import get from 'lodash/get';
import { prefixPluginTranslations, request } from '@strapi/helper-plugin';

import { Initializer, Field } from './components';
import { filterPermalinkColumns } from './contentManagerHooks';
import reducers from './reducers';
import { pluginId, pluginName } from './utils';

export default {
  register( app ) {
    app.addReducers( reducers );

    /**
     * @TODO - Remove `addField` and related components one custom field is complete.
     */
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
