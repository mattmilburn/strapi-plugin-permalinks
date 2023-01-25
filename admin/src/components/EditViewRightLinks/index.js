import React from 'react';
import { useCMEditViewDataManager } from '@strapi/helper-plugin';

import { useParsedUrl } from '../../hooks';
import { pluginId } from '../../utils';
import { CopyLinkButton } from '../';

const EditViewRightLinks = () => {
  const {
    allLayoutData,
    isCreatingEntry,
    modifiedData,
  } = useCMEditViewDataManager();
  const { uid } = allLayoutData.contentType;
  const { isLoading, isSupported, url } = useParsedUrl( uid, modifiedData, isCreatingEntry );

  if ( isLoading || isCreatingEntry || ! isSupported || ! url ) {
    return null;
  }

  return <CopyLinkButton url={ url } />;
};

export default EditViewRightLinks;
