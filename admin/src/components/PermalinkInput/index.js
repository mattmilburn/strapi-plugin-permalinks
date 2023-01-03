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

import { UID_REGEX } from '../../constants';
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
  const toggleNotification = useNotification();
  const generateUID = useRef();

  const targetFieldConfig = useFieldConfig( contentTypeUID );
  const targetRelationUID = get( layout, [ 'attributes', targetFieldConfig.targetRelation, 'targetModel' ], null );
  const targetRelationConfig = useFieldConfig( targetRelationUID );
  const targetRelationValue = getRelationValue( modifiedData, targetFieldConfig.targetRelation );

  const hasDifferentRelationUID = targetRelationUID && contentTypeUID !== targetRelationUID;
  const selectedSelfRelation = ! isCreatingEntry && ! hasDifferentRelationUID && targetRelationValue?.id === modifiedData.id;

  const initialValue = initialData[ name ];
  const initialRelationValue = getRelationValue( initialData, targetFieldConfig.targetRelation );
  const initialAncestorsPath = getPermalinkAncestors( initialValue );
  const initialSlug = getPermalinkSlug( initialValue );
  const debouncedValue = useDebounce( value, 300 );
  const debouncedTargetValue = useDebounce( modifiedData[ targetFieldConfig.targetField ], 300 );

  const [ isLoading, setIsLoading ] = useState( false );
  const [ isOrphan, setIsOrphan ] = useState( false );
  const [ isCustomized, setIsCustomized ] = useState( false );
  const [ availability, setAvailability ] = useState( null );
  const [ regenerateLabel, setRegenerateLabel ] = useState( null );
  const [ connectionError, setConnectionError ] = useState( null );
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

  const checkAvailability = async () => {
    if ( ! value || selectedSelfRelation ) {
      return;
    }

    setIsLoading( true );

    try {
      const { data } = await axiosInstance.post( `${pluginId}/check-availability`, {
        uid: contentTypeUID,
        parentUID: targetRelationUID,
        field: name,
        value: getPermalink( isOrphan ? null : ancestorsPath, slug ),
      } );

      setAvailability( data );
      setIsLoading( false );
    } catch ( err ) {
      console.error( { err } );

      setIsLoading( false );
    }
  };

  const checkConnection = async () => {
    if ( ! value || isCreatingEntry ) {
      return;
    }

    try {
      const params = `${contentTypeUID}/${modifiedData.id}`;
      const endpoint = `${pluginId}/check-connection2/${params}`;

      const {
        data: {
          path: newAncestorsPath,
        },
      } = await axiosInstance.get( endpoint );

      if ( ! newAncestorsPath ) {
        setIsOrphan( true );
        return;
      }

      const newSlug = getPermalinkSlug( value );

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
    if ( isOrphan && !! connectionError ) {
      setIsOrphan( false );
      setConnectionError( null );
      return;
    }

    generateUID.current();
  };

  const removeAncestorsPath = () => {
    const newSlug = getPermalinkSlug( value );

    // Update field state.
    setIsOrphan( false );
    setFieldState( null, newSlug );
  };

  const setFieldState = ( newAncestorsPath, newSlug, shouldSetInitialValue = false ) => {
    // Update field state.
    setConnectionError( null );
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

  const updateAncestorsPath = async () => {
    setIsLoading( true );
    setIsOrphan( false );

    // Maybe remove ancestors path.
    if ( ! targetRelationValue ) {
      removeAncestorsPath();
      setIsLoading( false );
      return;
    }

    // Maybe fetch a new ancestors path.
    try {
      const newSlug = getPermalinkSlug( value );
      const params = `${contentTypeUID}/${modifiedData.id}/${targetRelationValue.id}/${newSlug}`;
      const endpoint = `${pluginId}/ancestors-path2/${params}`;

      const {
        data: {
          path: newAncestorsPath,
        },
      } = await axiosInstance.get( endpoint );

      setFieldState( newAncestorsPath, newSlug );
    } catch ( err ) {
      // Maybe set error to incidate relationship conflict.
      if ( err.response.status === 409 ) {
        removeAncestorsPath();

        // Set field error.
        setConnectionError( formatMessage( {
          id: getTrad( 'ui.error.selfChild' ),
          defaultMessage: 'Cannot assign the {relation} relation to its own descendant.',
        }, {
          relation: targetFieldConfig.targetRelation,
        } ) );
      }

      console.log( err );
    }

    setIsLoading( false );
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
      setConnectionError( formatMessage( {
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
      checkAvailability();
    }

    if ( ! debouncedValue ) {
      setAvailability( null );
    }
  }, [ debouncedValue, initialValue ] );

  useEffect( () => {
    let timer;

    if ( availability && availability.isAvailable ) {
      timer = setTimeout( () => {
        setAvailability( null );
      }, 4000 );
    }

    return () => {
      if ( timer ) {
        clearTimeout( timer );
      }
    };
  }, [ availability ] );

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

  useEffect( () => {
    // Remove ancestors path if we have selected the current entity as the parent.
    if ( selectedSelfRelation ) {
      removeAncestorsPath();

      setConnectionError( formatMessage( {
        id: getTrad( 'ui.error.selfParent' ),
        defaultMessage: 'Cannot assign the {relation} relation to itself.',
      }, {
        relation: targetFieldConfig.targetRelation,
      } ) );

      return;
    }

    // Maybe update the input value. If this entity is an orphan, we need to
    // leave the ancestors path visible until a new value is set.
    if ( ! targetRelationValue && ! isOrphan ) {
      removeAncestorsPath();
    }

    // Maybe set new ancestors path.
    if ( targetRelationValue && targetRelationValue !== initialRelationValue ) {
      updateAncestorsPath();
    }
  }, [ targetRelationValue, initialRelationValue ] );

  return (
    <TextInput
      disabled={ disabled }
      error={ connectionError ?? formattedError }
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
          hasError={ !! connectionError || !! error }
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
