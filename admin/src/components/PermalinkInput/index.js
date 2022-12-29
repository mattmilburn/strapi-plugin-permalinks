import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import get from 'lodash/get';
import { TextInput } from '@strapi/design-system/TextInput';
import { Typography } from '@strapi/design-system/Typography';
import { useCMEditViewDataManager, useNotification } from '@strapi/helper-plugin';
import CheckCircle from '@strapi/icons/CheckCircle';
import ExclamationMarkCircle from '@strapi/icons/ExclamationMarkCircle';
import Loader from '@strapi/icons/Loader';
import Refresh from '@strapi/icons/Refresh';

import { useDebounce, useFieldConfig } from '../../hooks';
import {
  axiosInstance,
  getPermalink,
  getPermalinkAncestors,
  getPermalinkSlug,
  getRelationValue,
  getTrad,
  pluginId,
} from '../../utils';

import UID_REGEX from './regex';
import AncestorsPath from './AncestorsPath';
import {
  EndActionWrapper,
  FieldActionWrapper,
  LoadingWrapper,
  TextValidation,
} from './styled';

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
  const { initialData, isCreatingEntry, layout, modifiedData } = useCMEditViewDataManager();
  const targetFieldConfig = useFieldConfig( contentTypeUID );
  const targetRelationUID = get( layout, [ 'attributes', targetFieldConfig.targetRelation, 'targetModel' ] );
  const targetRelationConfig = useFieldConfig( targetRelationUID );
  const generateUID = useRef();

  const initialValue = initialData[ name ];
  const initialAncestorsPath = getPermalinkAncestors( initialValue );
  const initialSlug = getPermalinkSlug( initialValue );
  const debouncedValue = useDebounce( value, 300 );
  const debouncedTargetValue = useDebounce( modifiedData[ targetFieldConfig.targetField ], 300 );

  const [ isLoading, setIsLoading ] = useState( false );
  const [ isOrphan, setIsOrphan ] = useState( false );
  const [ isCustomized, setIsCustomized ] = useState( false );
  const [ regenerateLabel, setRegenerateLabel ] = useState( null );
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

  const checkConnection = async () => {
    if ( ! value || isCreatingEntry ) {
      return;
    }

    try {
      const { data } = await axiosInstance.post( `${pluginId}/check-connection`, {
        uid: contentTypeUID,
        id: initialData.id,
        targetField: targetFieldConfig.targetRelation,
      } );

      const targetRelationValue = data[ targetFieldConfig.targetRelation ];

      if ( ! targetRelationValue ) {
        setIsOrphan( true );
        return;
      }

      const newSlug = getPermalinkSlug( value );
      const newAncestorsPath = targetRelationValue[ targetRelationConfig.targetField ];

      setFieldState( newAncestorsPath, newSlug, true );
    } catch ( err ) {
      console.error( { err } );
    }
  };

  const handleChange = event => {
    const newSlug = event.target.value;

    if ( newSlug && isCreatingEntry ) {
      setIsCustomized( true );
    }

    setSlug( newSlug );

    onChange( {
      target: {
        name,
        value: getPermalink( ancestorsPath, newSlug ),
        type: 'text',
      },
    } );
  };

  const handleGenerateMouseEnter = () => {
    setRegenerateLabel(
      formatMessage( {
        id: 'content-manager.components.uid.regenerate',
        defaultMessage: 'Regenerate',
      } )
    );
  };

  const handleGenerateMouseLeave = () => {
    setRegenerateLabel( null );
  };

  const handleRefresh = () => {
    // Clear orphan state when refreshing.
    if ( isOrphan && !! parentError ) {
      setIsOrphan( false );
      setParentError( null );
      return;
    }

    generateUID.current();
  };

  const setFieldState = ( newAncestorsPath, newSlug, shouldSetInitialValue = false ) => {
    // Update field state.
    setParentError( null );
    setAncestorsPath( newAncestorsPath );
    setSlug( newSlug );

    // Update field value with ancestors path included.
    onChange( {
      target: {
        name,
        value: getPermalink( newAncestorsPath, newSlug ),
        type: 'text',
      },
    }, shouldSetInitialValue );
  };

  generateUID.current = async ( shouldSetInitialValue = false ) => {
    setIsLoading( true );

    try {
      const {
        data: { data: newSlug },
      } = await axiosInstance.post( '/content-manager/uid/generate', {
        contentTypeUID,
        field: name,
        data: modifiedData,
      } );

      const newAncestorsPath = isOrphan ? null : ancestorsPath;

      setFieldState( newAncestorsPath, newSlug, shouldSetInitialValue );
      setIsLoading( false );
    } catch ( err ) {
      console.error( { err } );

      setIsLoading( false );
    }
  };

  useEffect( () => {
    // If there is an existing ancestors path in the initial slug value, check
    // this entity's orphan state.
    if ( initialAncestorsPath ) {
      checkConnection();
    }
  }, [] );

  useEffect( () => {
    if ( isOrphan ) {
      setParentError( formatMessage( {
        id: getTrad( 'ui.error.orphan' ),
        defaultMessage: 'This value must be regenerated after being orphaned.',
      } ) );

      toggleNotification( {
        type: 'warning',
        message: formatMessage( {
          id: getTrad( 'ui.warning.orphan' ),
          defaultMessage: 'This {singularName} has been orphaned since it was last saved.',
        }, {
          singularName: layout.info.singularName,
        } ),
        timeout: 3500,
      } );
    }
  }, [ isOrphan ] );

  useEffect( () => {
    if (
      debouncedValue &&
      debouncedValue.trim().match( UID_REGEX ) &&
      debouncedValue !== initialValue
    ) {
      // checkAvailability();
    }

    if ( ! debouncedValue ) {
      // setAvailability( null );
    }
  }, [ debouncedValue, initialValue ] );

  useEffect( () => {
    if (
      ! isCustomized &&
      isCreatingEntry &&
      debouncedTargetValue &&
      modifiedData[ targetFieldConfig.targetField ] &&
      ! value
    ) {
      generateUID.current( true );
    }
  }, [ debouncedTargetValue, isCreatingEntry, isCustomized ] );

  return (
    <TextInput
      disabled={ disabled }
      error={ parentError ?? formattedError }
      hint={ hint }
      label={ label }
      labelAction={ labelAction }
      name={ name }
      onChange={ handleChange }
      placeholder={ formattedPlaceholder }
      value={ slug ?? '' }
      required={ required }
      startAction={ ancestorsPath ? (
        <AncestorsPath
          path={ ancestorsPath }
          hasError={ !! parentError || !! error }
        />
      ) : null }
      endAction={
        <EndActionWrapper>
          { regenerateLabel && (
            <TextValidation alignItems="center" justifyContent="flex-end">
              <Typography textColor="primary600" variant="pi">
                { regenerateLabel }
              </Typography>
            </TextValidation>
          ) }
          <FieldActionWrapper
            label="regenerate"
            onClick={ handleRefresh }
            onMouseEnter={ handleGenerateMouseEnter }
            onMouseLeave={ handleGenerateMouseLeave }
          >
            { isLoading ? (
              <LoadingWrapper>
                <Loader />
              </LoadingWrapper>
            ) : (
              <Refresh />
            ) }
          </FieldActionWrapper>
        </EndActionWrapper>
      }
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
