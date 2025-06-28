import { css, CSSObject, RuleSet } from 'styled-components';

export const mobile = (props: CSSObject | RuleSet<{}>): RuleSet<{}> => {
  return css`
    @media only screen and (max-width: 380px) {
      ${props}
    }
  `;
};

export const tablet = (props: CSSObject | RuleSet<{}>): RuleSet<{}> => {
  return css`
    @media only screen and (min-width: 381px) and (max-width: 768px) {
      ${props}
    }
  `;
};
