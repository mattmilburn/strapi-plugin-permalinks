import { URI_COMPONENT_REGEX_DENY } from '../constants';

const sanitizeSlug = (value) => {
  if (!value) {
    return '';
  }

  // Additionally remove the `/` character because this function should be used
  // for sanitizing user input.
  return value.replace(URI_COMPONENT_REGEX_DENY, '').replace('/', '');
};

export default sanitizeSlug;
