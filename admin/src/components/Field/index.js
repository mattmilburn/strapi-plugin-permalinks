import React from 'react';
import PropTypes from 'prop-types';

import { InputUID, PermalinkUID } from '../';

const Field = props => {
  if ( props.attribute?.permalinkMode === true ) {
    return <PermalinkUID { ...props } />;
  }

  return <InputUID { ...props } />;
};

Field.propTypes = {
  attribute: PropTypes.shape( {
    permalinkMode: PropTypes.bool,
  } ).isRequired,
};

export default Field;
