import { useSelector } from 'react-redux';

import { pluginId } from '../utils';

const useFieldConfig = uid => {
  const { layouts } = useSelector( state => state[ `${pluginId}_config` ].config );

  return layouts[ uid ];
};

export default useFieldConfig;
