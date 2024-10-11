import { useCallback, useEffect, useState } from 'react';
import get from 'lodash/get';
import has from 'lodash/has';
import { useStrapiApp } from '@strapi/helper-plugin';

import { HOOK_BEFORE_BUILD_URL } from '../constants';
import usePluginConfig from './use-plugin-config';
import { parseUrl } from '../utils';

const usePermalink = (uid, data, isCreatingEntry) => {
  const { runHookWaterfall } = useStrapiApp();
  const { data: config, isLoading } = usePluginConfig();
  const [url, setUrl] = useState(null);
  const [copy, setCopy] = useState(true);

  const contentTypes = get(config, 'contentTypes');
  const layouts = get(config, 'layouts');
  const isSupported = has(layouts, uid);

  const compileWithHook = useCallback(async () => {
    const uidConfig = contentTypes.find((item) => item.uids.includes(uid));
    const stateFromConfig = {
      ...uidConfig,
      url: uidConfig.url ?? null,
    };

    // Run async hook then set state.
    const { state } = await runHookWaterfall(
      HOOK_BEFORE_BUILD_URL,
      { state: stateFromConfig, data },
      true
    );
    const url = parseUrl(state, data);

    if (!url) {
      return;
    }

    setUrl(url);
    setCopy(state?.copy !== false);
  }, [contentTypes, data, uid, setCopy, setUrl, runHookWaterfall]);

  useEffect(() => {
    if (isLoading || isCreatingEntry || !isSupported) {
      return;
    }

    compileWithHook();
  }, [isLoading, isCreatingEntry, isSupported, compileWithHook]);

  return {
    isLoading,
    isSupported,
    copy,
    url,
  };
};

export default usePermalink;
