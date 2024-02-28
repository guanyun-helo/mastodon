import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Adsense } from '@ctrl/react-adsense';

let globalTheme = 'dark';
if (
  document.body &&
  document.body.classList.contains('theme-mastodon-light')
) {
  globalTheme = 'light';
}
const NotSignedInIndicator = () => (
  <div className='scrollable scrollable--flex'>
    <div className='empty-column-indicator'>
      <FormattedMessage id='not_signed_in_indicator.not_signed_in' defaultMessage='You need to sign in to access this resource.' />
    </div>
    {/* {globalTheme === 'light' ? <Adsense
      client='ca-pub-8575447765690857'
      slot='4023331835'
      style={{ display: 'block' }}
      layout='in-article'
      format='fluid'
      className='adsbygoogle'
      layoutKey='-fb+5w+4e-db+86'
    /> : <Adsense
      client='ca-pub-8575447765690857'
      slot='7375171918'
      style={{ display: 'block' }}
      layout='in-article'
      format='fluid'
      className='adsbygoogle'
      layoutKey='-fc+56+8s-cu-6p'
    />} */}
  </div>
);

export default NotSignedInIndicator;
