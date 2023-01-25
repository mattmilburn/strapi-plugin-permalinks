import { useEffect, useState } from 'react';
import { useStrapiApp } from '@strapi/helper-plugin';

import { HOOK_BEFORE_BUILD_URL } from '../constants';
import { usePluginConfig } from '../hooks';
import { parseUrl } from '../utils';

const useParsedUrl = ( uid, data, isCreatingEntry ) => {
  const { runHookWaterfall } = useStrapiApp();
  const { config, isLoading } = usePluginConfig();
  const [ url, setUrl ] = useState( null );

  const { contentTypes, layouts } = config;
  const attr = layouts[ uid ];

  useEffect( () => {
    if ( isLoading || isCreatingEntry || ! attr ) {
      return;
    }

    const uidConfig = contentTypes.flat().find( item => item.uid === uid );
    const stateFromConfig = { url: uidConfig.url ?? null };
    const { state } = runHookWaterfall( HOOK_BEFORE_BUILD_URL, { state: stateFromConfig, data } );
    const parsedUrl = parseUrl( state, data );

    if ( ! parsedUrl ) {
      return;
    }

    setUrl( parsedUrl );
  }, [ isCreatingEntry, isLoading, data ] );

  return {
    isLoading,
    isSupported: !! attr,
    url,
  };
};

export default useParsedUrl;
