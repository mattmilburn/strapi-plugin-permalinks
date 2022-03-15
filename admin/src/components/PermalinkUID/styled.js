import styled from 'styled-components';

export const AncestorsPath = styled.span`
  margin-right: -4px;
  padding: 1px 4px 2px 4px;
  background: ${({ theme }) => theme.colors.primary100};
  border: 0px solid ${({ theme }) => theme.colors.primary200};
  border-radius: ${({ theme }) => theme.borderRadius};
  color: ${({ theme }) => theme.colors.primary700};
  font-weight: ${({ theme }) => theme.fontWeights.normal};
  font-size: ${({ theme }) => theme.fontSizes[2]};
  line-height: normal;
  display: inline-flex;
  align-items: center;
`;

export const Delimiter = styled.span`
  margin: 0 2px;
  color: ${({ theme }) => theme.colors.primary500};
  font-size: ${({ theme }) => theme.fontSizes[0]};
`;
