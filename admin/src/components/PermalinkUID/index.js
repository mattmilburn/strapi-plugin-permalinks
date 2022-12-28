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

// Import certain assets directly from core InputUID component.
import UID_REGEX from '../../coreComponents/InputUID/regex';
import useDebounce from '../../coreComponents/InputUID/useDebounce';
import {
  EndActionWrapper,
  FieldActionWrapper,
  TextValidation,
  LoadingWrapper,
} from '../../coreComponents/InputUID/endActionStyle';

const PermalinkUID = ( {
  attribute,
  contentTypeUID,
  description,
  disabled,
  error,
  fieldOptions,
  intlLabel,
  labelAction,
  name,
  onChange,
  placeholder,
  required,
  targetRelationOptions,
  value,
} ) => {
  const toggleNotification = useNotification();
  const { modifiedData, initialData, layout } = useCMEditViewDataManager();
  const [ isLoading, setIsLoading ] = useState( false );
  const [ availability, setAvailability ] = useState( null );
  const debouncedValue = useDebounce( value, 300 );
  const generateUID = useRef();
  const initialValue = initialData[ name ];
  const { formatMessage } = useIntl();
  const isCreation = ! initialData[ 'createdAt' ];
  const debouncedTargetFieldValue = useDebounce( modifiedData[ attribute.targetField ], 300 );
  const [ isCustomized, setIsCustomized ] = useState( false );
  const [ regenerateLabel, setRegenerateLabel ] = useState( null );

  // Vars for handling permalink.
  const targetRelationField = fieldOptions.targetRelation;
  const targetRelationUID = get( layout, `attributes[${targetRelationField}].targetModel`, null );
  const targetRelationValue = getRelationValue( modifiedData, targetRelationField );
  const hasDifferentParentUID = targetRelationUID && contentTypeUID !== targetRelationUID;
  const initialRelationValue = getRelationValue( initialData, targetRelationField );
  const initialAncestorsPath = getPermalinkAncestors( initialValue );
  const initialSlug = getPermalinkSlug( initialValue );
  const selectedSelfRelation = ! isCreation && ! hasDifferentParentUID && targetRelationValue?.id === modifiedData.id;
  const [ isOrphan, setIsOrphan ] = useState( false );
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
    if ( ! value || isCreation ) {
      return;
    }

    try {
      const { data } = await axiosInstance.post( `${pluginId}/check-connection`, {
        uid: contentTypeUID,
        id: initialData.id,
        targetField: targetRelationField,
      } );

      const targetRelation = data[ targetRelationField ];

      if ( ! targetRelation ) {
        setIsOrphan( true );
        return;
      }

      const newSlug = getPermalinkSlug( value );
      const newAncestorsPath = targetRelation[ targetRelationOptions.targetField ];

      setFieldState( newAncestorsPath, newSlug, true );
    } catch ( err ) {
      console.error( { err } );
    }
  };

  const removeAncestorsPath = () => {
    const newSlug = getPermalinkSlug( value );

    // Update field state.
    setIsOrphan( false );
    setAncestorsPath( null );
    setParentError( null );
    setSlug( newSlug );

    // Update field value with only the current slug (no ancestors).
    onChange( {
      target: {
        name,
        value: newSlug,
        type: 'text',
      },
    } );
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
      const {
        data: {
          path: newAncestorsPath,
        },
      } = await axiosInstance.post( `${pluginId}/ancestors-path`, {
        uid: contentTypeUID,
        id: modifiedData.id,
        parentId: targetRelationValue.id,
        parentUID: targetRelationUID,
        value: newSlug,
      } );

      setFieldState( newAncestorsPath, newSlug );
    } catch ( err ) {
      // Maybe set error to incidate relationship conflict.
      if ( err.response.status === 409 ) {
        removeAncestorsPath();

        // Set field error.
        setParentError( formatMessage( {
          id: getTrad( 'ui.error.selfChild' ),
          defaultMessage: 'Cannot assign the {relation} relation to its own descendant.',
        }, {
          relation: fieldOptions.targetRelation,
        } ) );
      }

      console.log( err );
    }

    setIsLoading( false );
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
      isCreation &&
      debouncedTargetFieldValue &&
      modifiedData[ attribute.targetField ] &&
      ! value
    ) {
      generateUID.current( true );
    }
  }, [ debouncedTargetFieldValue, isCustomized, isCreation ] );

  useEffect( () => {
    // Remove ancestors path if we have selected the current entity as the parent.
    if ( selectedSelfRelation ) {
      removeAncestorsPath();

      setParentError( formatMessage( {
        id: getTrad( 'ui.error.selfParent' ),
        defaultMessage: 'Cannot assign the {relation} relation to itself.',
      }, {
        relation: fieldOptions.targetRelation,
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

  const handleChange = e => {
    const newSlug = e.target.value;

    if ( newSlug && isCreation ) {
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

  return (
    <TextInput
      disabled={ disabled }
      error={ parentError ?? formattedError }
      startAction={ ancestorsPath ? (
        <AncestorsPath
          path={ ancestorsPath }
          hasError={ !! parentError || !! error }
        />
      ) : null }
      endAction={
        <EndActionWrapper>
          { availability && availability.isAvailable && ! regenerateLabel && (
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
          { availability && ! availability.isAvailable && ! regenerateLabel && (
            <TextValidation notAvailable alignItems="center" justifyContent="flex-end">
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
            onClick={ handleRefresh }
            label="regenerate"
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
      hint={ hint }
      label={ label }
      labelAction={ labelAction }
      name={ name }
      onChange={ handleChange }
      placeholder={ formattedPlaceholder }
      value={ slug ?? '' }
      required={ required }
    />
  );
};

PermalinkUID.propTypes = {
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
  fieldOptions: PropTypes.shape( {
    uid: PropTypes.string,
    targetField: PropTypes.string,
    targetRelation: PropTypes.string,
  } ).isRequired,
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
  targetRelationOptions: PropTypes.shape( {
    uid: PropTypes.string,
    targetField: PropTypes.string,
    targetRelation: PropTypes.string,
  } ).isRequired,
  value: PropTypes.string,
};

PermalinkUID.defaultProps = {
  description: undefined,
  disabled: false,
  error: undefined,
  fieldOptions: {},
  labelAction: undefined,
  placeholder: undefined,
  required: false,
  targetRelationOptions: {},
  value: '',
};

export default PermalinkUID;
