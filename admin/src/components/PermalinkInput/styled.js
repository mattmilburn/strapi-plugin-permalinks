import styled, { keyframes } from 'styled-components';
import { Box } from '@strapi/design-system/Box';
import { FieldAction } from '@strapi/design-system/Field';
import { Flex } from '@strapi/design-system/Flex';
import { Button, IconButton } from '@strapi/design-system';

const rotation = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(359deg);
  }
`;

export const LoadingWrapper = styled(Flex)`
  animation: ${rotation} 2s infinite linear;
`;

export const ExpandButton = styled(IconButton)`
  height: 1rem;
  width: 1.5rem;
  border: none;
  background: ${({ theme, hasError }) => theme.colors[hasError ? 'danger100' : 'primary100']};
  color: ${({ theme, hasError }) => theme.colors[hasError ? 'danger700' : 'primary700']};
`;

export const HideButton = styled(Button)`
  padding: 0;
  height: fit-content;
  background-color: transparent;
  color: transparent;
  border: none;

  :hover {
    border: none;
  }
`;

export const PathLabel = styled.span`
  margin-right: -4px;
  padding: 1px 4px 2px 4px;
  background: ${({ theme, hasError }) => theme.colors[hasError ? 'danger100' : 'primary100']};
  border-radius: ${({ theme }) => theme.borderRadius};
  color: ${({ theme, hasError }) => theme.colors[hasError ? 'danger700' : 'primary700']};
  font-size: ${({ theme }) => theme.fontSizes[2]};
  font-weight: ${({ theme }) => theme.fontWeights.regular};
  line-height: normal;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
`;

export const Delimiter = styled.span`
  margin: 0 2px;
  color: ${({ theme, hasError }) => theme.colors[hasError ? 'danger500' : 'primary500']};
  font-size: ${({ theme }) => theme.fontSizes[0]};

  &:last-child {
    margin-right: 0;
  }
`;

export const RelativeInputWrapper = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
`;

export const EndActionWrapper = styled(Box)``;

export const FieldActionWrapper = styled(FieldAction)`
  svg {
    height: 1rem;
    width: 1rem;
    path {
      fill: ${({ theme }) => theme.colors.neutral400};
    }
  }

  svg:hover {
    path {
      fill: ${({ theme }) => theme.colors.primary600};
    }
  }
`;

export const TextValidation = styled(Flex)`
  position: absolute;
  right: 0;
  top: 0;
  width: 100px;
  pointer-events: none;

  svg {
    margin-right: ${({ theme }) => theme.spaces[1]};
    height: ${12 / 16}rem;
    width: ${12 / 16}rem;
    path {
      fill: ${({ theme, notAvailable }) =>
        !notAvailable ? theme.colors.success600 : theme.colors.danger600};
    }
  }
`;
