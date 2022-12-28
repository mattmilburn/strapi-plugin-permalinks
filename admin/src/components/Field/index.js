import React from 'react';
import { useSelector } from 'react-redux';
import { useCMEditViewDataManager } from '@strapi/helper-plugin';

import { InputUID } from '../../coreComponents';
import { PermalinkUID } from '../';
import { pluginId } from '../../utils';

const Field = props => {
  const { layout } = useCMEditViewDataManager();
  const { uid } = layout;
  const { name } = props;
  const { contentTypes } = useSelector( state => state[ `${pluginId}_config` ].config );
  const fieldOptions = contentTypes.find( type => type.uid === uid && type.targetField === name );

  // If permalink is not enabled for the current uid, fallback to Strapi's core
  // InputUID, which is 99.99% cloned from Strapi's core files into this plugin.
  if ( ! fieldOptions ) {
    return <InputUID { ...props } />;
  }

  // Include the params for the target relation field in case it is connected to
  // a different collection type which may have a different target field.
  const targetRelationOptions = contentTypes.find( type => type.uid === fieldOptions.uid );

  // Use custom UID field to work with permalinks.
  return (
    <PermalinkUID
      fieldOptions={ fieldOptions }
      targetRelationOptions={ targetRelationOptions }
      { ...props }
    />
  );
};

export default Field;
