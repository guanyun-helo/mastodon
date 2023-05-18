import React, { useEffect, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl-new';
import { QRCodeSVG } from 'qrcode.react';
import {
  isMobile as isMobileDevice,
  isAndroid as isAndroidDevice,
  saveMobileLinkInfo,
} from '@walletconnect/browser-utils';
import { LikeCoinWalletConnectorMethodType } from '../types';
import { checkIsInLikerLandAppInAppBrowser } from '../utils/liker-land-app';
import { SignInIcon } from './icons/sign-in';
import { Alert } from './alert';
import { Dialog } from './dialog';
import { initIntl } from '../i18n';
/**
 * Connect wallet dialog
 */
export const WalletConnectQRCodeDialog = ({ type, uri, onClose }) => {
  const intl = useIntl();
  const isInLikerLandApp = useMemo(checkIsInLikerLandAppInAppBrowser, []);
  // Do not show WC dialog for app open if in Liker Land App
  const [isDialogOpen, setDialogOpen] = useState(!isInLikerLandApp);
  const isMobile = useMemo(isMobileDevice, []);
  const isAndroid = useMemo(isAndroidDevice, []);
  const navigateToAppURL = useMemo(() => {
    if (!uri || !isMobile) {
      return '';
    }
    switch (type) {
    case LikeCoinWalletConnectorMethodType.KeplrMobile:
      if (isAndroid) {
        saveMobileLinkInfo({
          name: 'Keplr',
          href: 'intent://wcV1#Intent;package=com.chainapsis.keplr;scheme=keplrwallet;end;',
        });
        return `intent://wcV1?${uri}#Intent;package=com.chainapsis.keplr;scheme=keplrwallet;end;`;
      } else {
        saveMobileLinkInfo({
          name: 'Keplr',
          href: 'keplrwallet://wcV1',
        });
        return `keplrwallet://wcV1?${uri}`;
      }
    case LikeCoinWalletConnectorMethodType.CosmostationMobile:
      if (isAndroid) {
        saveMobileLinkInfo({
          name: 'Cosmostation',
          href: 'intent://wc#Intent;package=wannabit.io.cosmostaion;scheme=cosmostation;end;',
        });
        return `intent://wc?${uri}#Intent;package=wannabit.io.cosmostaion;scheme=cosmostation;end;`;
      } else {
        saveMobileLinkInfo({
          name: 'Cosmostation',
          href: 'cosmostation://wc',
        });
        return `cosmostation://wc?${uri}`;
      }
    case LikeCoinWalletConnectorMethodType.LikerId:
      saveMobileLinkInfo({
        name: 'Liker Land App',
        href: 'com.oice://wcV1',
      });
      return `com.oice://wcV1?${uri}`;
    default:
      return '';
    }
  }, [type, isAndroid, isMobile, uri]);
  const hintLabelText = React.useMemo(() => {
    switch (type) {
    case LikeCoinWalletConnectorMethodType.KeplrMobile:
      return intl.formatMessage({
        id: 'wallet_connect_hint_scan_qrcode_keplr_mobile',
      });
    case LikeCoinWalletConnectorMethodType.CosmostationMobile:
      return intl.formatMessage({
        id: 'wallet_connect_hint_scan_qrcode_cosmostation_mobile',
      });
    case LikeCoinWalletConnectorMethodType.LikerId:
      return intl.formatMessage({
        id: 'wallet_connect_hint_scan_qrcode_liker_land_app',
      });
    default:
      return '';
    }
  }, [type, intl]);
  useEffect(() => {
    if (navigateToAppURL) {
      window.location.href = navigateToAppURL;
    }
  }, [navigateToAppURL]);
  function closeDialog() {
    setDialogOpen(false);
    if (onClose) onClose();
  }
  console.log('isMobile', isMobile);
  return (
    <Dialog isOpen={isDialogOpen} onClose={closeDialog}>
      <h1 className='lk-flex lk-items-center lk-gap-x-[12px] lk-text-[#28646e] lk-font-bold'>
        <SignInIcon className='lk-w-[20px] lk-h-[20px] lk-shrink-0' />
        <span>
          {isMobile ? (
            <FormattedMessage id='wallet_connect_header_title_open_app' />
          ) : (
            <FormattedMessage id='wallet_connect_header_title_scan_qrcode' />
          )}
          {/* <FormattedMessage
            id={
              isMobile
                ? 'wallet_connect_header_title_open_app'
                : 'wallet_connect_header_title_scan_qrcode'
            }
          /> */}
        </span>
      </h1>
      <div className='lk-flex lk-flex-col lk-justify-center lk-items-center lk-mt-[24px]'>
        {isMobile ? (
          <>
            <Alert>
              <p>
                <FormattedMessage id='wallet_connect_hint_approve' />
              </p>
            </Alert>
            <button
              className='lk-mt-[16px] lk-px-[16px] lk-py-[8px] lk-bg-like-cyan-light lk-text-like-green lk-font-bold lk-rounded-[8px]'
              onClick={() => {
                if (navigateToAppURL) {
                  window.location.href = navigateToAppURL;
                }
              }}
            >
              <FormattedMessage id='wallet_connect_button_open_app' />
            </button>
          </>
        ) : (
          <>
            {!!hintLabelText && (
              <Alert>
                <p>{hintLabelText}</p>
              </Alert>
            )}
            <QRCodeSVG
              className='lk-w-full lk-mt-[16px]'
              value={uri}
              width='100%'
              height='100%'
            />
          </>
        )}
      </div>
    </Dialog>
  );
};
