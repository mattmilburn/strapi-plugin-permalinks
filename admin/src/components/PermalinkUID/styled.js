import styled from 'styled-components';

export const PathLabel = styled.span`
  margin-right: -4px;
  padding: 1px 4px 2px 4px;
  background: ${({ theme, hasError }) => theme.colors[ hasError ? 'danger100' : 'primary100' ]};
  border-radius: ${({ theme }) => theme.borderRadius};
  color: ${({ theme, hasError }) => theme.colors[ hasError ? 'danger700' : 'primary700' ]};
  font-weight: ${({ theme }) => theme.fontWeights.normal};
  font-size: ${({ theme }) => theme.fontSizes[2]};
  line-height: normal;
  display: inline-flex;
  align-items: center;
`;

export const Delimiter = styled.span`
  margin: 0 2px;
  color: ${({ theme, hasError }) => theme.colors[ hasError ? 'danger500' : 'primary500' ]};
  font-size: ${({ theme }) => theme.fontSizes[0]};

  &:last-child {
    margin-right: 0;
  }
`;
