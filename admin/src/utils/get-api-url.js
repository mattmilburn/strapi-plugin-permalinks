const getApiUrl = path => {
  if ( ! window ) {
    return path;
  }

  return `${window.location.protocol}//${window.location.host}/${path}`;
};

export default getApiUrl;
