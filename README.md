<div align="center">
  <h1>Strapi Permalinks</h1>
  <p>A plugin for Strapi CMS to enable permalinks for content types with nested relationships.</p>
  <p><em>Kinda like WordPress, but not 👍🏻</em></p>
</div>

## Get Started

* [Features](#features)
* [Installation](#installation)
* [Configuration](#configuration)
* [User Guide](#user-guide)
* [Roadmap](#roadmap)

## <a id="features"></a>✨ Features
* Manage a chain of slugs to build a unique URL path.
* Nested relationships for content types.
* Child relations automatically sync with changes to parents.
* Create parent/child relations from different collections.

## <a id="installation"></a>💎 Installation
```bash
yarn add strapi-plugin-permalinks@latest
```

## <a id="configuration"></a>🔧 Configuration
| property | type (default) | description |
| - | - | - |
| contentTypes | array (`[]`) | An array of objects describing which content types and fields should use permalink features. |

### `contentTypes`
An array of objects describing which content types and fields should use permalink features.

Each object in the array requires a `uid`, `targetField`, and `targetRelation` props. The field name "slug" is recommended for the `targetField` value because it represents the unique part of the URL path, but it is not required. Similarly, the relation name "parent" is recommended for the `targetRelation`, but is not required.

#### Example
Consider we have a `Page` content type which has a `title` field, a `uid` field named `slug`, and relation field named `parent` with a "has one" relationship to other `Pages`.

Let's configure the `Page` content type to use permalinks.

```js
module.exports = {
  'permalinks': {
    enabled: true,
    config: {
      contentTypes: [
        {
          uid: 'api::page.page',
          targetField: 'slug',
          targetRelation: 'parent',
        },
      ],
    },
  },
};
```

#### Example with mixed relations
Let's say we have a separate `Example` collection and we want those entities to have a `Page` as it's `parent`? This is mostly handled automatically, except when related entities are synced, which needs one additional config option `targetUID` to be in place.

```js
module.exports = {
  'permalinks': {
    enabled: true,
    config: {
      contentTypes: [
        {
          uid: 'api::example.example',
          targetField: 'slug',
          targetRelation: 'parent',
          targetUID: 'api::page.page',
        },
        {
          uid: 'api::page.page',
          targetField: 'slug',
          targetRelation: 'parent',
        },
      ],
    },
  },
};
```

## <a id="user-guide"></a>📘 User Guide
Assign a parent relation to a page to automatically generate a URL path that includes the slugs of it's parent pages.

### Syncing pages with child pages
All child pages will automatically have their slug values updated when the slug of their ancestor changes. This extends down to all descendant pages.

### Deleting pages with children
Deleting a page that has children will **orphan** those child pages. The parent relation will be removed from the child pages but no other changes to their data will occur.

**If orphaned pages exist**, you will see their slug value in the content manger list view as a red label instead of plain text.

Editing the orphaned page will display a warning and an error message on the target field. From here you can assign a new parent or no parent at all. Upon saving, any children of the page will also update their target fields to reflect to new parent slugs.

*Better conflict resolution regarding updated/deleted pages is on the roadmap.*

## <a id="roadmap"></a>🚧 Roadmap
* Completely refactor using the custom fields feature in Strapi.
* Config option to limit nesting depth.
* Better conflict resolution for orphaned pages when parent pages are updated or deleted.
* Avoid cloning the core `InputUID` component (currently required to function).
