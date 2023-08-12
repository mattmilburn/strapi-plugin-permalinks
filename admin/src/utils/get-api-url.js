const getApiUrl = (path) => `${window.strapi.backendURL}/${path}`;

export default getApiUrl;
