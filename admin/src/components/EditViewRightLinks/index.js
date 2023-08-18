import React from 'react';
import { useCMEditViewDataManager } from '@strapi/helper-plugin';

import { useParsedUrl } from '../../hooks';
import CopyLinkButton from '../CopyLinkButton';

const EditViewRightLinks = () => {
  const { allLayoutData, isCreatingEntry, modifiedData } = useCMEditViewDataManager();
  const { uid } = allLayoutData.contentType;
  const { isLoading, isSupported, canCopy, url } = useParsedUrl(uid, modifiedData, isCreatingEntry);

  if (!isSupported || isLoading || isCreatingEntry || !canCopy || !url) {
    return null;
  }

  return <CopyLinkButton url={url} />;
};

export default EditViewRightLinks;
