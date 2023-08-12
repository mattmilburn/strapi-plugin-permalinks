'use strict';

const { UID_PERMALINK_FIELD } = require('../../constants');
const getPermalinkAttr = require('../get-permalink-attr');

describe('getPermalinkAttr', () => {
  // eslint-disable-next-line no-unused-vars
  let strapi;

  beforeAll(async () => {
    global.strapi = {
      getModel: jest.fn().mockReturnValue({
        attributes: {
          title: {
            type: 'string',
          },
          slug: {
            type: 'customField',
            customField: UID_PERMALINK_FIELD,
            pluginOptions: {
              permalinks: {
                targetField: 'title',
                targetRelation: 'parent',
              },
            },
          },
          summary: {
            type: 'text',
          },
          content: {
            type: 'richtext',
          },
          image: {
            type: 'media',
            multiple: false,
            allowedTypes: ['images'],
          },
          publish_date: {
            type: 'date',
          },
          parent: {
            type: 'relation',
            relation: 'oneToOne',
            target: 'api::page.page',
          },
        },
      }),
    };
  });

  it('should return the permalink attribute configuration for a `uid`', () => {
    const uid = 'api::page.page';
    const output = {
      name: 'slug',
      targetField: 'title',
      targetRelation: 'parent',
      targetRelationUID: 'api::page.page',
    };
    const result = getPermalinkAttr(uid);

    expect(result).toEqual(output);
  });
});
