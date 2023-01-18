import produce from 'immer';

import { ACTION_RESOLVE_CONFIG } from '../constants';

const initialState = {
  isLoading: true,
  config: {
    contentTypes: [],
    lowercase: true,
  },
};

const configReducer = produce( ( state = initialState, action ) => {
  switch ( action.type ) {
    case ACTION_RESOLVE_CONFIG: {
      state.isLoading = false;
      state.config = action.data;
      break;
    }

    default:
      return state;
  }

  return state;
} );

export default configReducer;
