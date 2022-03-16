import React from 'react';
import { useSelector } from 'react-redux';
import { useCMEditViewDataManager } from '@strapi/helper-plugin';

import { InputUID, PermalinkUID } from '../';
import { pluginId } from '../../utils';

const Field = props => {
  const { layout } = useCMEditViewDataManager();
  const { attributes, uid } = layout;
  const { attribute, name } = props;
  const { contentTypes } = useSelector( state => state[ `${pluginId}_config` ].config );
  const pluginOptions = contentTypes.find( type => type.uid === uid && type.targetField === name );

  // If permalink is not enabled for the current uid, fallback to Strapi's core
  // InputUID, which is 99.99% cloned from Strapi's core files into this plugin.
  if ( ! pluginOptions ) {
    return <InputUID { ...props } />;
  }

  // Use custom UID field to work with permalinks.
  return <PermalinkUID pluginOptions={ pluginOptions } { ...props } />;
};

export default Field;
