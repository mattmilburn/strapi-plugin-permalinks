<div align="center">
  <img style="width: 160px; height: auto;" src="public/logo-2x.png" alt="Logo for Strapi permalinks plugin" />
  <h1>Strapi Permalinks Migration Guides</h1>
  <p>Follow our migration guides to keep your permalinks plugin up-to-date.</p>
</div>

## Migrate from v1 to v2

### New `string` type field instead of `uid`
The permalink field type is now `string`.

Previously, the plugin was using a custom `uid` field to manage the permalink value, which comes with some limitations that make sense for a `uid` field, but not a URL path.

> Nothing should be required to accommodate this update in your app.

### Remove tilde characters (~) from permalinks
Because the plugin was previously using a `uid` field, the slash `/` characters were not allowed to be used. Instead, the tilde `~` character was sacrificed as a replacement for slashes to allow the value to validate properly according to the database schema.

Now that the field is a `string` field, the slash character is saved with the value instead of the tilde. If you have permalink values stored in the database that have `~` characters, those need to be replaced with `/`.

#### Example migration script to replace ~ with / characters

```js
// database/migrations/100-migrate-permalinks.js
'use strict';

module.exports = {
  async up( knex ) {
    const rows = await knex( 'pages' );

    await Promise.all( rows.map( row => {
      return knex( uid )
        .where( { id: row.id } )
        .update( {
          slug: row.slug.replace( /~/g, '/' ),
        } );
    } ) );
  },

  down() {},
};
```
