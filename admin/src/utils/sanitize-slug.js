import { URI_COMPONENT_REGEX_DENY } from '../constants';

const sanitizeSlug = value => {
  if ( ! value ) {
    return '';
  }

  return value.replace( URI_COMPONENT_REGEX_DENY, '' );
};

export default sanitizeSlug;
