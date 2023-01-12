import React from 'react';
import { useSelector } from 'react-redux';
import { useCMEditViewDataManager } from '@strapi/helper-plugin';

import { pluginId } from '../../utils';
import { CopyLinkButton } from '../';

const EditViewRightLinks = () => {
  const {
    allLayoutData,
    isCreatingEntry,
    modifiedData,
  } = useCMEditViewDataManager();
  const { config, isLoading } = useSelector( state => state[ `${pluginId}_config` ] );
  const { uid } = allLayoutData.contentType;

  if ( isLoading || isCreatingEntry ) {
    return null;
  }

  const attr = config.layouts[ uid ];

  if ( ! attr ) {
    return null;
  }

  return <CopyLinkButton url={ modifiedData[ attr.name ] } />;
};

export default EditViewRightLinks;
