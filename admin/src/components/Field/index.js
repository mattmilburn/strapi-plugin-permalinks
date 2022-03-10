import React from 'react';
import PropTypes from 'prop-types';
import { useCMEditViewDataManager } from '@strapi/helper-plugin';

import { InputUID, PermalinkUID } from '../';

const Field = props => {
  const { layout } = useCMEditViewDataManager();
  const { attributes } = layout;
  const { attribute } = props;
  const targetRelation = attribute?.permalink?.targetRelation;
  const relation = targetRelation && attributes[ targetRelation ];
  const relationIsValid = relation && relation.type === 'relation';

  // If permalink settings are not enabled, fallback to Strapi's core InputUID,
  // which is 99.99% cloned from Strapi's core files into this plugin.
  if ( ! relationIsValid ) {
    return <InputUID { ...props } />;
  }

  // Use custom UID field to work with permalinks.
  return <PermalinkUID { ...props } />;
};

Field.propTypes = {
  attribute: PropTypes.shape( {
    permalink: PropTypes.shape( {
      parent: PropTypes.string,
    } ),
  } ).isRequired,
};

export default Field;
