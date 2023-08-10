import React from 'react';
import { useCMEditViewDataManager } from '@strapi/helper-plugin';

import { useParsedUrl } from '../../hooks';
import CopyLinkButton from '../CopyLinkButton';

const EditViewRightLinks = () => {
  const {
    allLayoutData,
    isCreatingEntry,
    modifiedData,
  } = useCMEditViewDataManager();
  const { uid } = allLayoutData.contentType;
  const {
    canCopy,
    isLoading,
    isSupported,
    url,
  } = useParsedUrl( uid, modifiedData, isCreatingEntry );

  if (
    isLoading ||
    isCreatingEntry ||
    ! isSupported ||
    ! canCopy ||
    ! url
  ) {
    return null;
  }

  return <CopyLinkButton url={ url } />;
};

export default EditViewRightLinks;
