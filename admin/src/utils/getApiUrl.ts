/**
 * @TODO - Fix TS error with global `strapi` and `backendURL`.
 */
const getApiUrl = (path: string): string => `${window.strapi.backendURL}/${path}`;

export default getApiUrl;
