import React, { useEffect } from 'react';
import { FormattedMessage, useIntl } from 'react-intl-new';
import { isMobile as isMobileDevice } from '@walletconnect/browser-utils';
import { LikeCoinWalletConnectorMethodType } from '../types';
import { SignInIcon } from './icons/sign-in';
import { Alert } from './alert';
import { ConnectionMethodList } from './connection-method-list';
import { Dialog } from './dialog';
import { initIntl } from '../i18n';

const connectionMethodMap = [
  {
    type: LikeCoinWalletConnectorMethodType.Keplr,
    name: 'Keplr',
    defaultTier: 1,
    isInstalled: false,
    isMobileOk: false,
    url: 'https://chrome.google.com/webstore/detail/keplr/dmkamcknogkgcdfhhbddcghachkejeap',
    description: 'connect_wallet_method_description_keplr',
  },
  {
    type: LikeCoinWalletConnectorMethodType.KeplrMobile,
    name: 'Keplr Mobile',
    defaultTier: 2,
    isInstalled: false,
    isMobileOk: true,
    url: 'https://keplr.app/app',
    description: 'connect_wallet_method_description_keplr_mobile',
  },
  {
    type: LikeCoinWalletConnectorMethodType.LikerId,
    name: 'Liker ID',
    defaultTier: 2,
    isInstalled: false,
    isMobileOk: true,
    url: 'https://liker.land/getapp',
    description: 'connect_wallet_method_description_liker_land_app',
  },
  {
    type: LikeCoinWalletConnectorMethodType.Cosmostation,
    name: 'Cosmostation',
    defaultTier: 1,
    isInstalled: false,
    isMobileOk: false,
    url: 'https://chrome.google.com/webstore/detail/cosmostation/fpkhgmpbidmiogeglndfbkegfdlnajnf',
    description: 'connect_wallet_method_description_cosmostation',
  },
  {
    type: LikeCoinWalletConnectorMethodType.CosmostationMobile,
    name: 'Cosmostation App',
    defaultTier: 2,
    isInstalled: false,
    isMobileOk: true,
    url: 'https://www.cosmostation.io/wallet',
    description: 'connect_wallet_method_description_cosmostation_mobile',
  },
  {
    type: LikeCoinWalletConnectorMethodType.Leap,
    name: 'Leap Wallet',
    defaultTier: 1,
    isInstalled: false,
    isMobileOk: false,
    url: 'https://chrome.google.com/webstore/detail/leap-cosmos-wallet/fcfcfllfndlomdhbehjjcoimbgofdncg',
    description: 'connect_wallet_method_description_leap',
  },
].reduce((map, method) => {
  map[method.type] = method;
  return map;
}, {});
/**
 * Connection Method Selection Dialog
 */
export const ConnectionMethodSelectionDialog = ({
  methods,
  isShowMobileWarning = true,
  keplrInstallURLOverride,
  keplrInstallCTAPreset,
  onClose,
  onConnect,
  isConnectionMethodSelectDialogOpen,
}) => {
  const intl = useIntl();
  const [isDialogOpen, setDialogOpen] = React.useState(true);
  const isMobile = React.useMemo(isMobileDevice, []);
  const isKeplrNotInstalled = !isMobile && !window.keplr;

  useEffect(() => {
    console.log(isConnectionMethodSelectDialogOpen)
    setDialogOpen(isConnectionMethodSelectDialogOpen);
  }, []);

  const tieredConnectionMethods = React.useMemo(() => {
    const filteredMethods = methods
      .filter((type) => {
        const method = connectionMethodMap[type];
        return !!method && (!isMobile || (isMobile && method.isMobileOk));
      })
      .map((type) => {
        const method = { ...connectionMethodMap[type] };
        if (
          type === LikeCoinWalletConnectorMethodType.Keplr &&
          keplrInstallURLOverride
        ) {
          method.url = keplrInstallURLOverride;
        }
        method.description = intl.formatMessage({ id: method.description });
        switch (type) {
          case LikeCoinWalletConnectorMethodType.Keplr:
            method.isInstalled = !!window.keplr;
            break;
          case LikeCoinWalletConnectorMethodType.Cosmostation:
            method.isInstalled = !!window.cosmostation;
            break;
          case LikeCoinWalletConnectorMethodType.Leap:
            method.isInstalled = !!window.leap;
            break;
          default:
            method.isInstalled = false;
            break;
        }
        return method;
      });
    const hasInstalledWallet = filteredMethods.some(
      (method) => method.isInstalled
    );
    const getTier = (method) => {
      if (hasInstalledWallet) {
        return method.isInstalled ? 1 : 2;
      }
      // if none of wallet is detected, fallback to default tier
      return method.defaultTier;
    };
    const tieredMethods = filteredMethods.reduce((tieredMethods, method) => {
      const tier = getTier(method);
      if (!tieredMethods[tier]) {
        tieredMethods[tier] = new Array();
      }
      tieredMethods[tier].push(method);
      return tieredMethods;
    }, {});
    // The returned array will be sorted by tier
    return Object.values(tieredMethods);
  }, [methods, isMobile, keplrInstallURLOverride, intl]);
  function closeDialog() {
    setDialogOpen(false);
    if (onClose) onClose();
  }
  return (
    <Dialog className='multichain-wallet' isOpen={isDialogOpen} onClose={closeDialog}>
      {!(isKeplrNotInstalled && keplrInstallCTAPreset === 'fancy-banner') && (
        <h1 className="lk-flex lk-items-center lk-gap-x-[12px] lk-text-like-green lk-font-bold lk-mb-[24px]">
          <SignInIcon className="lk-w-[20px] lk-h-[20px] lk-shrink-0" />
          <span>
            <FormattedMessage id="connect_wallet_title" />
          </span>
        </h1>
      )}
      {isMobile && isShowMobileWarning && (
        <Alert className="lk-mb-[24px]">
          <p>
            <FormattedMessage id="warning_wallet_connect_mobile" />
          </p>
        </Alert>
      )}
      {tieredConnectionMethods.map((methods, index) => (
        <ConnectionMethodList
          key={`group-${index}`}
          methods={methods}
          isMobile={isMobile}
          keplrInstallCTAPreset={keplrInstallCTAPreset}
          isCollapsible={index !== 0}
          collapsibleToggleButtonTitle={intl.formatMessage({
            id: 'connect_wallet_other_methods',
          })}
          onSelectMethod={onConnect}
        />
      ))}
    </Dialog>
  );
};
