'use strict';

module.exports = {
  /**
   * @NOTE - This regex differs from it's admin counterpart by supporting / characters.
   */
  URI_COMPONENT_REGEX: /^[A-Za-z0-9-_.~!$&'()*+,;=:@%\/]*$/,
};
