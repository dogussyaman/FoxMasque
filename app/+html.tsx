import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

/**
 * This file is web-only and used to configure the root HTML for every web page during web rendering.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="tr">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <ScrollViewStyleReset />
        <style
          dangerouslySetInnerHTML={{
            __html: `
                    /* Prevent mobile browsers from zooming the page when a field receives focus. */
                    input, textarea, select, [contenteditable="true"] {
                      box-sizing: border-box;
                      width: auto;
                      max-width: 100%;
                      min-width: 0;
                      font-size: 16px !important;
                      line-height: 1.4;
                      outline: none !important;
                      box-shadow: none !important;
                      -webkit-tap-highlight-color: transparent;
                    }
                    input:focus, textarea:focus, select:focus, [contenteditable="true"]:focus {
                      font-size: 16px !important;
                      outline: none !important;
                      box-shadow: none !important;
                    }
              
              body {
                overflow-x: hidden;
                background-color: #110D1B;
              }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
