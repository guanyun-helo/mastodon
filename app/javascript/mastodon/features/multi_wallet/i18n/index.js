import * as React from 'react';
import { createIntl, createIntlCache, RawIntlProvider } from 'react-intl-new';
import messages from './translations';

function normalizeLanguage(language) {
  switch (language) {
  case 'zh':
    return 'zh';
  case 'en':
  default:
    return 'en';
  }
}
export function initIntl(language) {
  const locale = normalizeLanguage(language);
  const cache = createIntlCache();
  return createIntl({
    locale,
    messages: messages[locale],
    onError: err => {
      if (err.code === 'MISSING_DATA')
        return;
      console.error(err);
    },
  }, cache);
}
export function IntlProvider(props) {
  return (<RawIntlProvider value={initIntl(props.language)}>
    {props.children}
  </RawIntlProvider>);
}
