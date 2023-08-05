<div align="center">
  <img style="width: 160px; height: auto;" src="public/logo-2x.png" alt="Logo for Strapi permalinks plugin" />
  <h1>Strapi Permalinks Migration Guides</h1>
  <p>Follow our migration guides to keep your permalinks plugin up-to-date.</p>
</div>

## Migrate from v1 to v2

The permalink input type is now `string`.

Previously, the plugin was using a custom `uid` field to manage the permalink value, which comes with some limitations that make sense for a `uid` field, but not a URL path.

---

## TODO
* Explain managing ~ and /.
* Sample migration script to update db with new field type.
* Must use `pluginOptions` instead of custom props on attributes.
