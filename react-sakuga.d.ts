// Sakuga VFX custom elements (finktheartist/sakuga-vfx, MIT).
// Each is one plain script that registers a custom element.
import type * as React from 'react';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'sakuga-button': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        variant?: 'primary' | 'secondary';
        type?: 'button' | 'submit';
        disabled?: boolean | string;
        ref?: React.Ref<HTMLElement>;
      };
      'sakuga-tabs': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        label?: string;
        selected?: number;
        ref?: React.Ref<HTMLElement>;
      };
      'sakuga-toast': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        message?: string;
        duration?: string;
      };
    }
  }
}
