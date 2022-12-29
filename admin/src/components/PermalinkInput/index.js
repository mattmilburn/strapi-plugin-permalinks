import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { TextInput } from '@strapi/design-system/TextInput';
import { Typography } from '@strapi/design-system/Typography';
import { useCMEditViewDataManager, useNotification } from '@strapi/helper-plugin';
import CheckCircle from '@strapi/icons/CheckCircle';
import ExclamationMarkCircle from '@strapi/icons/ExclamationMarkCircle';
import Loader from '@strapi/icons/Loader';
import Refresh from '@strapi/icons/Refresh';

import {
  getPermalinkAncestors,
  getPermalinkSlug,
} from '../../utils';
import AncestorsPath from './AncestorsPath';

const PermalinkInput = ( {
  attribute,
  contentTypeUID,
  description,
  disabled,
  error,
  intlLabel,
  labelAction,
  name,
  onChange,
  placeholder,
  required,
  value,
} ) => {
  const { formatMessage } = useIntl();
  const { initialData } = useCMEditViewDataManager();

  const initialValue = initialData[ name ];
  const initialAncestorsPath = getPermalinkAncestors( initialValue );
  const initialSlug = getPermalinkSlug( initialValue );

  const [ parentError, setParentError ] = useState( null );
  const [ ancestorsPath, setAncestorsPath ] = useState( initialAncestorsPath );
  const [ slug, setSlug ] = useState( initialSlug );

  const label = intlLabel.id
    ? formatMessage(
        { id: intlLabel.id, defaultMessage: intlLabel.defaultMessage },
        { ...intlLabel.values }
      )
    : name;

  const hint = description
    ? formatMessage(
        { id: description.id, defaultMessage: description.defaultMessage },
        { ...description.values }
      )
    : '';

  const formattedPlaceholder = placeholder
    ? formatMessage(
        { id: placeholder.id, defaultMessage: placeholder.defaultMessage },
        { ...placeholder.values }
      )
    : '';

  const formattedError = error
    ? formatMessage( { id: error, defaultMessage: error } )
    : undefined;

  return (
    <TextInput
      disabled={ disabled }
      error={ parentError ?? formattedError }
      hint={ hint }
      label={ label }
      labelAction={ labelAction }
      name={ name }
      onChange={ () => {} }
      placeholder={ formattedPlaceholder }
      value={ slug ?? '' }
      required={ required }
      startAction={ ancestorsPath ? (
        <AncestorsPath
          path={ ancestorsPath }
          hasError={ !! parentError || !! error }
        />
      ) : null }
    />
  );
};

PermalinkInput.defaultProps = {
  description: undefined,
  disabled: false,
  error: undefined,
  labelAction: undefined,
  placeholder: undefined,
  required: false,
  value: '',
};

PermalinkInput.propTypes = {
  attribute: PropTypes.shape( {
    targetField: PropTypes.string,
    required: PropTypes.bool,
  } ).isRequired,
  contentTypeUID: PropTypes.string.isRequired,
  description: PropTypes.shape( {
    id: PropTypes.string.isRequired,
    defaultMessage: PropTypes.string.isRequired,
    values: PropTypes.object,
  } ),
  disabled: PropTypes.bool,
  error: PropTypes.string,
  intlLabel: PropTypes.shape( {
    id: PropTypes.string.isRequired,
    defaultMessage: PropTypes.string.isRequired,
    values: PropTypes.object,
  } ).isRequired,
  labelAction: PropTypes.element,
  name: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.shape( {
    id: PropTypes.string.isRequired,
    defaultMessage: PropTypes.string.isRequired,
    values: PropTypes.object,
  } ),
  required: PropTypes.bool,
  value: PropTypes.string,
};

export default PermalinkInput;
