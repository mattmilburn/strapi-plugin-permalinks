import React from 'react';
import { prefixPluginTranslations } from '@strapi/helper-plugin';

import { EditViewRightLinks, Initializer } from './components';
import { HOOK_BEFORE_BUILD_URL } from './constants';
import { filterPermalinkColumns } from './contentManagerHooks';
import reducers from './reducers';
import { getTrad, pluginId, pluginName } from './utils';

export default {
  register( app ) {
    app.addReducers( reducers );

    app.createHook( HOOK_BEFORE_BUILD_URL );

    app.registerPlugin( {
      id: pluginId,
      name: pluginName,
      initializer: Initializer,
      isReady: false,
    } );

    app.customFields.register( {
      pluginId,
      name: 'permalink',
      type: 'string',
      icon: null,
      intlLabel: {
        id: getTrad( 'register.label' ),
        defaultMessage: 'Permalink',
      },
      intlDescription: {
        id: getTrad( 'register.description' ),
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
       * For now, the `targetField` and `targetRelation` will need to remain
       * in the plugin config.
       */
      options: {
        // base: [
        //   {
        //     sectionTitle: null,
        //     items: [
        //       {
        //         intlLabel: {
        //           id: 'content-type-builder.modalForm.attribute.target-field',
        //           defaultMessage: 'Attached field',
        //         },
        //         name: 'targetField',
        //         type: 'select',
        //         options: [
        //           {
        //             key: '__null_reset_value__',
        //             value: '',
        //             metadatas: {
        //               intlLabel: {
        //                 id: 'global.none',
        //                 defaultMessage: 'None',
        //               },
        //             },
        //           },
        //           {
        //             key: 'title',
        //             value: 'title',
        //             metadatas: {
        //               intlLabel: {
        //                 id: 'title.no-override',
        //                 defaultMessage: 'Title',
        //               },
        //             },
        //           },
        //         ],
        //       },
        //     ],
        //   },
        // ],
        advanced: [
          {
            sectionTitle: {
              id: 'global.settings',
              defaultMessage: 'Settings',
            },
            items: [
              {
                name: 'required',
                type: 'checkbox',
                intlLabel: {
                  id: 'content-type-builder.form.attribute.item.requiredField',
                  defaultMessage: 'Required field',
                },
                description: {
                  id: 'content-type-builder.form.attribute.item.requiredField.description',
                  defaultMessage: 'You won\'t be able to create an entry if this field is empty',
                },
              },
            ],
          },
        ],
      },
    } );
  },

  bootstrap( app ) {
    app.registerHook( 'Admin/CM/pages/ListView/inject-column-in-table', filterPermalinkColumns );

    app.injectContentManagerComponent( 'editView', 'right-links', {
      name: pluginId,
      Component: EditViewRightLinks,
    } );
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
