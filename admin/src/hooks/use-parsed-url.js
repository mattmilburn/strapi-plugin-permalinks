import { useEffect, useState } from 'react';
import { useStrapiApp } from '@strapi/helper-plugin';

import { HOOK_BEFORE_BUILD_URL } from '../constants';
import { usePluginConfig } from '../hooks';
import { parseUrl } from '../utils';

const useParsedUrl = ( uid, data, isCreatingEntry ) => {
  const { runHookWaterfall } = useStrapiApp();
  const { config, isLoading } = usePluginConfig();
  const [ url, setUrl ] = useState( null );

  const { urls, layouts } = config;
  const attr = layouts[ uid ];

  if ( ! attr ) {
    return null;
  }

  useEffect( () => {
    if ( isLoading || isCreatingEntry || ! attr ) {
      return;
    }

    const stateFromConfig = { url: urls[ uid ] ?? null };
    const { state } = runHookWaterfall( HOOK_BEFORE_BUILD_URL, { state: stateFromConfig, data } );
    const url = parseUrl( state, data );

    if ( ! url ) {
      return;
    }

    setUrl( url );
  }, [ isCreatingEntry, isLoading, data ] );

  return {
    isLoading,
    url,
  };
};

export default useParsedUrl;
