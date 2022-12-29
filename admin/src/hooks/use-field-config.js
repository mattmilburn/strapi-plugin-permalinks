import { useSelector } from 'react-redux';

import { pluginId } from '../utils';

const useFieldConfig = uid => {
  const { contentTypes } = useSelector( state => state[ `${pluginId}_config` ].config );
  const config = contentTypes.find( type => type.uid === uid );

  return config;
};

export default useFieldConfig;
