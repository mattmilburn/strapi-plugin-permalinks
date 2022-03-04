import React from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useCMEditViewDataManager } from '@strapi/helper-plugin';

import { pluginId } from '../../utils';

const Injector = () => {
  const {
    allLayoutData,
    isCreatingEntry,
  } = useCMEditViewDataManager();
  const { id } = useParams();
  const { uid } = allLayoutData.contentType;
  const { contentTypes } = useSelector( state => state[ `${pluginId}_config` ].config );

  const isSupportedType = contentTypes && contentTypes.includes( uid );
  const shouldRender = isSupportedType && ! isCreatingEntry;

  if ( ! shouldRender ) {
    return null;
  }

  return (
    <p>TESTING</p>
  );
};

export default Injector;
