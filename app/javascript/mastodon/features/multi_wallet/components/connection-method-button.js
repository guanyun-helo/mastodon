import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl-new';
import classNames from 'classnames';
import { isIOS } from '@walletconnect/browser-utils';
import { LikeCoinWalletConnectorMethodType } from '../types';
import { checkIsInCosmostationMobileInAppBrowser } from '../utils/cosmostation-mobile';
import { DownloadIcon } from './icons/download';
import { KeplrColorIcon } from './icons/keplr-color';
import { OpenInNewIcon } from './icons/open-in-new';
import { Alert } from './alert';
import { Button } from './button';
import { ConnectionMethodIcon } from './connection-method-icon';
import ConnectionMethodBgBanner from './connection-method-bg-banner';
// import { initIntl } from '../i18n';
/**
 * Button for a connection method
 */
export const ConnectionMethodButton = ({ type, name, description: defaultDescription, url, isMobile = false, keplrInstallCTAPreset = 'origin', onPress }) => {
  const intl = useIntl();
  const isNotInstalled = React.useMemo(() => {
    switch (type) {
    case LikeCoinWalletConnectorMethodType.Keplr:
      return !isMobile && !window.keplr;
    case LikeCoinWalletConnectorMethodType.Cosmostation:
      return !isMobile && !window.cosmostation;
    case LikeCoinWalletConnectorMethodType.Leap:
      return !isMobile && !window.leap;
    default:
      return false;
    }
  }, [type, isMobile]);
  const description = React.useMemo(() => {
    if (isNotInstalled) {
      return intl.formatMessage({
        id: 'connect_wallet_method_button_hint_not_installed',
      });
    }
    if (isMobile) {
      return intl.formatMessage({
        id: 'connect_wallet_method_button_hint_click_to_open_app',
      });
    }
    return defaultDescription;
  }, [isNotInstalled, isMobile, defaultDescription, intl]);
  const ButtonTag = isNotInstalled ? 'a' : 'button';
  const props = isNotInstalled
    ? {
      href: url,
      target: '_blank',
      rel: 'noreferrer noopener',
    }
    : {
      onClick: onPress,
    };
  const handleClickInstallLikerLandAppButton = e => {
    e.stopPropagation();
  };
  const handleClickOpenInDAppBrowserButton = e => {
    e.stopPropagation();
    const url = window.location.href;
    const appURL = isIOS()
      ? 'cosmostation://dapp?'.concat(url)
      : 'intent://dapp?'.concat(url, '#Intent;package=wannabit.io.cosmostaion;scheme=cosmostation;end;');
    window.location.href = appURL;
  };
  const isShowLaunchInCosmostationMobileInAppBroswerButton = type === LikeCoinWalletConnectorMethodType.CosmostationMobile &&
        !checkIsInCosmostationMobileInAppBrowser();
  const buttonEl = type === LikeCoinWalletConnectorMethodType.Keplr &&
        isNotInstalled &&
        keplrInstallCTAPreset === 'fancy-banner' ? (<>
      <div className='lk-text-center lk-font-bold lk-text-[16px] lk-text-gray-dark'>
            <FormattedMessage id='connect_wallet_method_button_keplr_install_prompt' />
          </div>
      <ButtonTag className='lk-relative lk-block lk-w-full lk-mt-[8px]' {...props}>
            <ConnectionMethodBgBanner className='lk-text-gray-light' />
            <div className='lk-absolute lk-inset-0 lk-flex lk-justify-center lk-items-center'>
          <KeplrColorIcon className='lk-drop-shadow-xl' width={48} height={48} />
        </div>
          </ButtonTag>
    </>) : (<ButtonTag className='lk-block lk-w-full lk-border-[4px] lk-border-solid lk-border-gray-light hover:lk-border-like-cyan-light active:lk-bg-like-cyan-lightest lk-rounded-[16px] lk-p-[24px] lk-transition-colors lk-cursor-pointer lk-group' {...props}>
          {type === LikeCoinWalletConnectorMethodType.Keplr &&
            isNotInstalled &&
            keplrInstallCTAPreset === 'simple-banner' ? (<div className='lk-flex lk-flex-col lk-justify-center lk-items-center'>
          <div className='lk-flex lk-justify-center lk-items-center lk-gap-[24px] lk-text-gray'>
                <KeplrColorIcon width={32} height={32} />
                <svg xmlns='http://www.w3.org/2000/svg' width='24' height='22' viewBox='0 0 24 22' fill='none'>
              <path fillRule='evenodd' clipRule='evenodd' d='M13.7172 1.14787C13.3267 0.757349 12.6935 0.757349 12.303 1.14787C11.9125 1.5384 11.9125 2.17156 12.303 2.56209L19.7359 9.995H1.8501C1.29781 9.995 0.850098 10.4427 0.850098 10.995C0.850098 11.5473 1.29781 11.995 1.8501 11.995H19.7378L12.3026 19.4383C11.9123 19.829 11.9127 20.4622 12.3034 20.8525C12.6941 21.2428 13.3273 21.2424 13.7176 20.8517L22.8576 11.7017C23.2478 11.3111 23.2476 10.6782 22.8572 10.2879L13.7172 1.14787Z' fill='currentColor' />
            </svg>
                <svg xmlns='http://www.w3.org/2000/svg' width='34' height='34' viewBox='0 0 56 56'>
              <path d='M28,0C12.56,0,0,12.56,0,28s12.56,28,28,28,28-12.56,28-28S43.44,0,28,0Zm9.54,28c0,5.26-4.28,9.54-9.54,9.54s-9.54-4.28-9.54-9.54,4.28-9.54,9.54-9.54,9.54,4.28,9.54,9.54ZM28,4.36c8.47,0,15.91,4.48,20.08,11.19H28c-6.13,0-11.23,4.46-12.25,10.31l-6.82-11.81c4.31-5.87,11.25-9.69,19.07-9.69ZM4.36,28c0-4.04,1.02-7.84,2.81-11.17l10.04,17.4s.05,.07,.08,.1c2.17,3.66,6.15,6.12,10.7,6.12,1.5,0,2.94-.28,4.27-.77l-6.83,11.82c-11.84-1.28-21.08-11.33-21.08-23.5Zm24.37,23.62l10.04-17.4s.03-.07,.05-.11c1.03-1.81,1.62-3.89,1.62-6.11,0-3.83-1.74-7.25-4.47-9.54h13.64c1.29,2.92,2.02,6.15,2.02,9.54,0,12.79-10.21,23.23-22.9,23.62Z' fill='currentColor' />
            </svg>
              </div>
          <FormattedMessage id='connect_wallet_method_button_keplr_install_prompt' />
        </div>) : (<>
              <div className='lk-flex lk-items-center group-hover:lk-text-like-green lk-transition-colors'>
            <ConnectionMethodIcon type={type} />
            <div className='lk-ml-[12px] lk-text-[16px] sm:lk-text-[20px]'>
                  {!!isNotInstalled && <span>Install </span>}
                  <span className='lk-font-bold'>{name}</span>
                </div>
            {!!isNotInstalled && (<OpenInNewIcon className='lk-ml-[8px] lk-w-[12px] lk-h-[12px]' />)}
          </div>
              <div className={classNames('lk-mt-[16px] lk-text-[14px] sm:lk-text-[16px] lk-text-left lk-shrink-1', { 'lk-text-red': isNotInstalled })}>
            {description}
          </div>
              {isShowLaunchInCosmostationMobileInAppBroswerButton && (<div className='lk-flex lk-justify-center lk-mt-[12px]'>
            <Button tag='a' href={url} target='_blank' onClick={handleClickOpenInDAppBrowserButton}>
                  <FormattedMessage id='connect_wallet_method_button_cosmostation_mobile_launch_in_dapp_browser' />
                </Button>
          </div>)}
              {type === LikeCoinWalletConnectorMethodType.LikerId && (<div className='lk-flex lk-justify-center lk-mt-[12px]'>
            <Button tag='a' href={url} target='_blank' onClick={handleClickInstallLikerLandAppButton}>
                  <DownloadIcon />
                  <span>
                <FormattedMessage id='connect_wallet_method_button_liker_land_app_install_prompt' />
              </span>
                </Button>
          </div>)}
            </>)}
        </ButtonTag>);
  return (<>
    {buttonEl}
    {type === LikeCoinWalletConnectorMethodType.Keplr && (<>
      {isNotInstalled &&
                ['simple-banner', 'fancy-banner'].includes(keplrInstallCTAPreset) && (<div className='lk-flex lk-justify-center lk-mt-[8px]'>
        <Button tag='a' href={url} target='_blank'>
                    <DownloadIcon />
                    <span>
            <FormattedMessage id='connect_wallet_method_button_keplr_install' />
          </span>
                  </Button>
      </div>)}
      {!isNotInstalled && (<Alert className='lk-mt-[4px] lk-text-gray' isPlain>
        <p>
          <FormattedMessage id='warning_ledger_not_support' />
        </p>
      </Alert>)}
    </>)}
  </>);
};
