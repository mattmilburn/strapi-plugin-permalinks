<div align="center">
  <mark>@LOGO</mark>
  <h1>Strapi Permalinks</h1>
  <p>A plugin for Strapi CMS to enable permalinks for content types with nested relationships.</p>
  <mark>@SCREENSHOT - COVER</mark>
</div>

## Get Started

* [Features](#features)
* [Installation](#installation)
* [Custom Field](#custom-field)
* [Configuration](#configuration)
* [User Guide](#user-guide)
* [Troubleshooting](#troubleshooting)
* [Support or Donate](#donate)
* [Roadmap](#roadmap)

## <a id="features"></a>✨ Features
* Use a custom field type to manage a chain of URL paths to build a unique permalink.
* Nested relationships for content types.
* Parent/child relations can use different collection types.
* Child relations automatically sync when parents change.

## <a id="installation"></a>💎 Installation
```bash
yarn add strapi-plugin-permalinks@latest
```

## <a id="custom-field"></a>✏️ Custom Field
To get started, let's create a simple `Page` collection that uses permalinks.

<mark>@SCREENSHOT - CONTENT TYPE BUILDER</mark>

#### Schema for `Page`
```js
// ./src/api/page/content-types/page/schema.json

{
  "kind": "collectionType",
  "collectionName": "pages",
  "info": {
    "singularName": "page",
    "pluralName": "pages",
    "displayName": "Page"
  },
  "options": {
    "draftAndPublish": true
  },
  "pluginOptions": {},
  "attributes": {
    "title": {
      "type": "string",
      "required": true
    },
    "slug": {
      "type": "customField",
      "customField": "plugin::permalinks.permalink",
      "required": true
    },
    "content": {
      "type": "richtext"
    },
    "parent": {
      "type": "relation",
      "relation": "oneToOne",
      "target": "api::page.page"
    }
  }
}
```

After generating the permalink attribute through the content type builder in Strapi, there are additional `targetField` and `targetRelation` props that will need to be manually to the permalink schema attribute.

> **NOTE:** Strapi does not currently provide the necessary params to dynamically render a list containing the other field names as select menu options, which is why `targetField` and `targetRelation` need to be added manually for now.

#### Page schema with added props

```js
// ./src/api/page/content-types/page/schema.json

"slug": {
  "type": "customField",
  "customField": "plugin::permalinks.permalink",
  "targetField": "title",
  "targetRelation": "parent",
  "required": true
},
```

### `targetField`
This is the same `targetField` prop used with `uid` field types. It should point to a string type field which will be used to make suggestions for the unique permalink value.

### `targetRelation`
This prop should point to a `oneToOne` relation field which will be used as it's "parent" relation.

## <a id="configuration"></a>🔧 Configuration
| property | type (default) | description |
| - | - | - |
| contentTypes | array (`[]`) | An array of related UIDs that use permalink fields. |
| lowercase | boolean (`true`) | If set to `true`, it will ensure the input value is always lowercased. |
| urls | object (`{}`) | (Optional) An object describing destination URL templates for different UIDs. |

### `contentTypes`
An array of related UIDs that use permalink fields.

#### Example
Let's add the `Page` content type to the plugin config, which will enable it in middlewares, lifecycles, etc. and also help keep related collections synced as data changes.

```js
// ./config/plugins.js

module.exports = {
  'permalinks': {
    config: {
      contentTypes: [
        [ 'api::page.page' ],
      ],
    },
  },
};
```

#### Example with mixed relations
In addition to our generic `Page` collection, let's say we have other collections representing different types of pages, such as `FaqPage` with parent `Pages` and `ProductPage` with parent `ProductPages`.

We will want to keep them all in sync with unique permalinks. Our config might look like the code below:

> Order does not matter here. Parent/child relationships are determined by the custom field attribute.

```js
// ./config/plugins.js

module.exports = {
  'permalinks': {
    config: {
      contentTypes: [
        [ 'api::page.page', 'api::faq-page.faq-page' ],
        [ 'api::product-page.product-page' ],
      ],
    },
  },
};
```

This informs the plugin which collections should avoid permalink conflicts with other collections.

**Here is a recap of what is achieved in this example:**
* `Pages` have parent `Pages` and will sync across `Pages` and `FaqPages`.
* `FaqPages` have parent `Pages` and will sync across `Pages` and `FaqPages`.
* `ProductPages` have parent `ProductPages` and will sync across `ProductPages`.

### `lowercase`
Defaults to `true`. It will ensure the permalink value is always lowercased.

> **NOTE:** If you are setting this option to `true` when it was previously set to `false`, it will not automatically lowercase existing permalinks in the database. You will need to lowercase existing permalinks yourself, which can be easily done with a database migration script.

#### Example migration script to lowercase existing permalinks

```js
// ./database/migrations/100-lowercase-permalinks.js

module.exports = {
  async up( knex ) {
    const entries = await knex( 'pages' );

    const promisedUpdates = entries.map( entry => {
      return knex( uid )
        .where( { id: entry.id } )
        .update( {
          slug: entry.slug.toLowerCase(),
        } );
    } );

    await Promise.all( promisedUpdates );
  },

  down() {},
};
```

### `urls`
An object describing destination URL templates for different UIDs. See section about [mapping data into the URLs](#mapping-values-from-entry-data-into-preview-urls) for greater customization.

This is **required** if you intend to serve a full URL rather than just a relative path. The value will still be stored in the database as a unique, relative path either way.

#### Example

```js
// ./config/plugins.js

module.exports = ( { env } ) => ( {
  'permalinks': {
    config: {
      contentTypes: [
        [ 'api::page.page' ],
        [ 'api::post.post' ],
      ],
      urls: {
        'api::page.page': `${env( 'STRAPI_PERMALINKS_BASE_URL' )}/{slug}`,
        'api::post.post': `${env( 'STRAPI_PERMALINKS_BASE_URL' )}/blog/{slug}`,
      },
    },
  },
} );
```

#### Mapping values from entry data into permalink URLs
By using `{curly_braces}`, you can map values from the entry data into your permalink to customize the URL however you like.

For example, if you are working with localization enabled, you could use the `locale` value in your URL template.

> **Unmatched values** will be replaced with an empty string.

## <a id="user-guide"></a>📘 User Guide
Assign a parent relation to an entity to automatically generate a URL path that includes the slugs of it's parent entities.

### Syncing entities with children
All child entities will automatically have their permalink values updated when the permalink of their ancestor changes. This extends down to all descendants.

### Deleting entities with children
Deleting an entity that has children will **orphan** those children. The parent relation will be removed from the child entities but no other changes to their data will occur.

**If orphaned pages exist**, you will see their slug value in the content manger list view as a red label instead of plain text.

<mark>@SCREENSHOT - Edit view orphan error</mark>

Editing the orphaned page will display a warning and an error message on the permalink field. From here you can assign a new parent or no parent at all. Upon saving, any children of the entity will also update their target fields to reflect to new parent permalinks.

## <a id="troubleshooting"></a>💩 Troubleshooting

#### In general
Remember to **rebuild your app** after making changes to some config or other code.

```bash
yarn build
# OR
yarn develop
```

## <a id="donate"></a>❤️ Support or Donate
If you are enjoying this plugin and feel extra appreciative, you can [buy me a beer or 3 🍺🍺🍺](https://www.buymeacoffee.com/mattmilburn).

## <a id="roadmap"></a>🚧 Roadmap
* Config option to limit nesting depth
* Better conflict resolution for orphaned pages
* Better method for handling complicated localized URLs (currently requires plugin with custom hook and middleware)
* Use same content-type builder options as `uid` field, then deprecate it in plugin config (not currently possible)
