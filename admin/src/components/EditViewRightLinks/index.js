import React from 'react';
import { useCMEditViewDataManager } from '@strapi/helper-plugin';

import { usePermalink } from '../../hooks';
import CopyLinkButton from '../CopyLinkButton';

const EditViewRightLinks = () => {
  const { allLayoutData, isCreatingEntry, modifiedData } = useCMEditViewDataManager();
  const { uid } = allLayoutData.contentType;
  const { isLoading, isSupported, copy, url } = usePermalink(uid, modifiedData, isCreatingEntry);

  if (!isSupported || isLoading || isCreatingEntry || !copy || !url) {
    return null;
  }

  return <CopyLinkButton url={url} />;
};

export default EditViewRightLinks;
