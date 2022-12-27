# Maintenance for core components and files

Certain components or files are cloned directly from Strapi, with their locations listed below:

```
/packages/core/admin/admin/src/content-manager/components/InputUID
```

### How to keep core components and files updated

As Strapi updates, these components and files may also need to be updated in this plugin. Thankfully the updates are minor and easy to describe. See the table below for the current modifications.

| Num | Location | Filename | Description |
|-|-|-|-|
| 1 | InputUID | index.js | The path to `axiosInstance` is updated to use the instance provided in the plugin. |
| 2 | InputUID | index.js | The `getRequestUrl` util will not be used. Instead, we use explicit paths for `/content-manager/` routes. |

Look for `CUSTOM MOD [n]` comments to identify exactly what lines were changed. The number in the comment corresponds to the table above.
