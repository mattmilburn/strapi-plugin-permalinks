import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { useSelector } from 'react-redux';
import get from 'lodash/get';
import { TextInput } from '@strapi/design-system/TextInput';
import { Typography } from '@strapi/design-system/Typography';
import { useCMEditViewDataManager, useNotification } from '@strapi/helper-plugin';
import CheckCircle from '@strapi/icons/CheckCircle';
import ExclamationMarkCircle from '@strapi/icons/ExclamationMarkCircle';
import Loader from '@strapi/icons/Loader';
import Refresh from '@strapi/icons/Refresh';

import { PATH_SEPARATOR, UID_REGEX } from '../../constants';
import { useDebounce } from '../../hooks';
import {
  axiosInstance,
  getApiUrl,
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
  disabled,
  error,
  hint,
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
  const { layouts, lowercase } = useSelector( state => state[ `${pluginId}_config` ].config );
  const toggleNotification = useNotification();
  const generateUID = useRef();

  const targetFieldConfig = layouts[ contentTypeUID ];
  const targetRelationUID = get( layout, [ 'attributes', targetFieldConfig.targetRelation, 'targetModel' ], null );
  const targetRelationConfig = layouts[ targetRelationUID ];
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
  const [ relationError, setRelationError ] = useState( null );
  const [ ancestorsPath, setAncestorsPath ] = useState( initialAncestorsPath );
  const [ slug, setSlug ] = useState( initialSlug );

  const label = intlLabel.id
    ? formatMessage(
        { id: intlLabel.id, defaultMessage: intlLabel.defaultMessage },
        { ...intlLabel.values }
      )
    : name;

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
      const newSlug = getPermalink( isOrphan ? null : ancestorsPath, slug, lowercase );
      const params = `${contentTypeUID}/${newSlug}`;
      const endpoint = getApiUrl( `${pluginId}/check-availability/${params}` );

      const { data } = await axiosInstance.get( endpoint );

      setAvailability( data );
      setIsLoading( false );
    } catch ( err ) {
      toggleNotification( {
        type: 'warning',
        message: err?.response?.error?.message ?? formatMessage( {
          id: getTrad( 'notification.error' ),
          defaultMessage: 'An error occurred',
        } ),
      } );

      setIsLoading( false );

      console.error( err );
    }
  };

  const checkConnection = async () => {
    if ( ! value || isCreatingEntry ) {
      return;
    }

    try {
      const params = `${contentTypeUID}/${modifiedData.id}`;
      const endpoint = getApiUrl( `${pluginId}/check-connection/${params}` );

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
      toggleNotification( {
        type: 'warning',
        message: err?.response?.error?.message ?? formatMessage( {
          id: getTrad( 'notification.error' ),
          defaultMessage: 'An error occurred',
        } ),
      } );

      console.error( err );
    }
  };

  const handleChange = event => {
    // Remove ~ characters from the input value because they are used as the path separator.
    const newSlug = ( event.target.value ?? '' ).replace( PATH_SEPARATOR, '' );

    if ( newSlug && isCreatingEntry ) {
      setIsCustomized( true );
    }

    setSlug( newSlug );

    onChange( {
      target: {
        name,
        value: getPermalink( ancestorsPath, newSlug, lowercase ),
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
    if ( isOrphan && !! relationError ) {
      setIsOrphan( false );
      setRelationError( null );
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
    setRelationError( null );
    setAncestorsPath( newAncestorsPath );
    setSlug( newSlug );

    // Update field value with ancestors path included.
    onChange( {
      target: {
        name,
        value: getPermalink( newAncestorsPath, newSlug, lowercase ),
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
      const newSlug = getPermalinkSlug( isCreatingEntry ? value : initialValue );
      const params = isCreatingEntry
        ? `${contentTypeUID}/${targetRelationValue.id}`
        : `${contentTypeUID}/${modifiedData.id}/${targetRelationValue.id}/${initialSlug}`;
      const endpoint = getApiUrl( `${pluginId}/ancestors-path/${params}` );

      const {
        data: {
          path: newAncestorsPath,
        },
      } = await axiosInstance.get( endpoint );

      setFieldState( newAncestorsPath, newSlug );
    } catch ( err ) {
      // Maybe set field error to incidate relationship conflict.
      if ( err?.response?.status === 409 ) {
        removeAncestorsPath();

        setRelationError( formatMessage( {
          id: getTrad( 'form.error.parent-child' ),
          defaultMessage: 'Cannot assign the {relation} relation as its own descendant.',
        }, {
          relation: targetFieldConfig.targetRelation,
        } ) );

        return;
      }

      toggleNotification( {
        type: 'warning',
        message: err?.response?.error?.message ?? formatMessage( {
          id: getTrad( 'notification.error' ),
          defaultMessage: 'An error occurred',
        } ),
      } );

      console.error( err );
    }

    setIsLoading( false );
  };

  generateUID.current = async ( shouldSetInitialValue = false ) => {
    setIsLoading( true );

    try {
      const params = `${contentTypeUID}/${debouncedTargetValue}`;
      const endpoint = getApiUrl( `${pluginId}/suggestion/${params}` );

      const {
        data: {
          suggestion: newSlug,
        },
      } = await axiosInstance.get( endpoint );

      const newAncestorsPath = isOrphan ? null : ancestorsPath;

      setFieldState( newAncestorsPath, newSlug, shouldSetInitialValue );
      setIsLoading( false );
    } catch ( err ) {
      toggleNotification( {
        type: 'warning',
        message: err?.response?.error?.message ?? formatMessage( {
          id: getTrad( 'notification.error' ),
          defaultMessage: 'An error occurred',
        } ),
      } );

      setIsLoading( false );

      console.error( err );
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
      setRelationError( formatMessage( {
        id: getTrad( 'form.error.orphan' ),
        defaultMessage: 'This value must be regenerated after being orphaned.',
      } ) );

      toggleNotification( {
        type: 'warning',
        message: formatMessage( {
          id: getTrad( 'notification.warning.orphan' ),
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

    if ( ! debouncedValue || debouncedValue === initialValue ) {
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
    // This is required for scenarios like switching between locales to ensure
    // the field value updates with the locale change.
    const newAncestorsPath = getPermalinkAncestors( initialValue );
    const newSlug = getPermalinkSlug( initialValue );

    setFieldState( newAncestorsPath, newSlug, true );
  }, [ initialData.id ] );

  useEffect( () => {
    // Remove ancestors path if we have selected the current entity as the parent.
    if ( selectedSelfRelation ) {
      removeAncestorsPath();

      setRelationError( formatMessage( {
        id: getTrad( 'form.error.parent-self' ),
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
      error={ relationError ?? formattedError }
      hint={ hint }
      label={ label }
      labelAction={ labelAction }
      name={ name }
      onChange={ handleChange }
      placeholder={ formattedPlaceholder }
      value={ slug ? getPermalink( null, slug, lowercase ) : '' }
      required={ required }
      startAction={ ancestorsPath ? (
        <AncestorsPath
          path={ ancestorsPath }
          hasError={ !! relationError || !! error }
        />
      ) : null }
      endAction={
        <EndActionWrapper>
          { ! regenerateLabel && availability && availability?.isAvailable && (
            <TextValidation alignItems="center" justifyContent="flex-end">
              <CheckCircle />
              <Typography textColor="success600" variant="pi">
                { formatMessage( {
                  id: 'content-manager.components.uid.available',
                  defaultMessage: 'Available',
                } ) }
              </Typography>
            </TextValidation>
          ) }
          { ! regenerateLabel && availability && ! availability?.isAvailable && (
            <TextValidation alignItems="center" justifyContent="flex-end" notAvailable>
              <ExclamationMarkCircle />
              <Typography textColor="danger600" variant="pi">
                { formatMessage( {
                  id: 'content-manager.components.uid.unavailable',
                  defaultMessage: 'Unavailable',
                } ) }
              </Typography>
            </TextValidation>
          ) }
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
  disabled: false,
  error: undefined,
  hint: '',
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
  disabled: PropTypes.bool,
  error: PropTypes.string,
  hint: PropTypes.oneOfType( [
    PropTypes.string,
    PropTypes.array,
  ] ),
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
