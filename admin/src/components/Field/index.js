import React from 'react';
import PropTypes from 'prop-types';

import { InputUID, PermalinkUID } from '../';

const Field = props => {
  const target = props.attribute?.permalinkRelation;
  const attr = target && props.attribute[ target ];
  const attrIsValid = attr && attr.type === 'relation';

  // If permalink settings are not enabled, fallback to Strapi's core InputUID.
  if ( ! attrIsValid ) {
    return <InputUID { ...props } />;
  }

  // Maybe use custom UID field to work with permalinks.
  return <PermalinkUID { ...props } />;
};

Field.propTypes = {
  attribute: PropTypes.shape( {
    permalinkRelation: PropTypes.bool,
  } ).isRequired,
};

export default Field;
