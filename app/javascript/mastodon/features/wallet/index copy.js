// javascript version of index.ts
import * as React from 'react';
import { AccountData } from '@cosmjs/proto-signing';
import WalletConnect from '@walletconnect/client';
import { IQRCodeModal } from '@walletconnect/types';
import EventEmitter from 'events';

import { ConnectionMethodSelectionDialog } from './components/connection-method-selection-dialog';
import { WalletConnectQRCodeDialog } from './components/walletconnect-dialog';

import {
  initCosmostation,
  listenCosmostationAccountChange,
  removeCosmostationAccountChangeListener,
} from './utils/cosmostation';
import {
  checkIsInCosmostationMobileInAppBrowser,
  getCosmostationMobileWCConnector,
  initCosmostationMobile,
} from './utils/cosmostation-mobile';
import {
  initKeplr,
  listenKeplrKeyStoreChange,
  removeKeplrKeyStoreChangeListener,
} from './utils/keplr';
import {
  getKeplrMobileWCConnector,
  initKeplrMobile,
} from './utils/keplr-mobile';
import {
  checkIsInLikerLandAppInAppBrowser,
  getLikerLandAppWCConnector,
  initLikerLandApp,
} from './utils/liker-land-app';
import {
  initLeap,
  listenLeapKeyStoreChange,
  removeLeapKeyStoreChangeListener,
} from './utils/leap';
import { deserializePublicKey, serializePublicKey } from './utils/wallet';

import {
  LikeCoinWalletConnectorConfig,
  LikeCoinWalletConnectorConnectionResponse,
  LikeCoinWalletConnectorConnectionResult,
  LikeCoinWalletConnectorInitResponse,
  LikeCoinWalletConnectorMethodType,
  LikeCoinWalletConnectorOptions,
  LikeCoinWalletConnectorSession,
} from './types';

import './style.css';
import { IntlProvider } from './i18n';

export * from './types';

const CONTAINER_ID = 'likecoin-wallet-connector';
const SESSION_KEY = 'likecoin_wallet_connector_session';

const WC_BRIGDE = 'https://bridge.walletconnect.org';

export class LikeCoinWalletConnector {

  constructor(options) {
    this.options = {
      chainId: options.chainId,
      chainName: options.chainName,
      rpcURL: options.rpcURL,
      restURL: options.restURL,
      coinType: options.coinType,
      coinDenom: options.coinDenom,
      coinMinimalDenom: options.coinMinimalDenom,
      coinDecimals: options.coinDecimals,
      coinGeckoId: options.coinGeckoId || '',
      bech32PrefixAccAddr: options.bech32PrefixAccAddr,
      bech32PrefixAccPub: options.bech32PrefixAccPub,
      bech32PrefixValAddr: options.bech32PrefixValAddr,
      bech32PrefixValPub: options.bech32PrefixValPub,
      bech32PrefixConsAddr: options.bech32PrefixConsAddr,
      bech32PrefixConsPub: options.bech32PrefixConsPub,
      gasPriceStepLow: options.gasPriceStepLow || 1,
      gasPriceStepAverage: options.gasPriceStepAverage || 10,
      gasPriceStepHigh: options.gasPriceStepHigh || 1000,
      walletURLForStaking: options.walletURLForStaking || '',
      initAttemptCount: options.initAttemptCount || 3,
      availableMethods: options.availableMethods || [
        LikeCoinWalletConnectorMethodType.Keplr,
        LikeCoinWalletConnectorMethodType.KeplrMobile,
        LikeCoinWalletConnectorMethodType.LikerId,
        LikeCoinWalletConnectorMethodType.Cosmostation,
      ],
      keplrSignOptions: options.keplrSignOptions || {},
      keplrMobileWCBridge: options.keplrMobileWCBridge || WC_BRIGDE,
      keplrInstallURLOverride: options.keplrInstallURLOverride || '',
      keplrInstallCTAPreset: options.keplrInstallCTAPreset || 'origin',
      likerLandAppWCBridge: options.likerLandAppWCBridge || WC_BRIGDE,
      cosmostationAppWCBridge: options.cosmostationAppWCBridge || WC_BRIGDE,
      cosmostationDirectSignEnabled:
        options.cosmostationDirectSignEnabled || false,
      isShowMobileWarning:
        options.isShowMobileWarning !== undefined
          ? !!options.isShowMobileWarning
          : true,

      language: options.language || 'en',
    };

    this.sessionAccounts = [];

    this._events = new EventEmitter();

    const container = document.createElement('div');
    container.setAttribute('id', CONTAINER_ID);
    document.body.appendChild(container);
    // this._renderingRoot = createRoot(container);
  }

  /**
   * @deprecated Please use openConnectionMethodSelectionDialog() instead
   */
  openConnectWalletModal = () => this.openConnectionMethodSelectionDialog();

  openConnectionMethodSelectionDialog = ({
    language = this.options.language,
  } = {}) => {
    if (this.options.language !== language) {
      this.options.language = language;
    }

    return new Promise<LikeCoinWalletConnectorConnectionResponse>(
      async resolve => {
        const connectWithMethod = async (
          method
        ) => {
          const result = await this.selectMethod(method);
          resolve(result);
        };
        if (checkIsInLikerLandAppInAppBrowser()) {
          connectWithMethod(LikeCoinWalletConnectorMethodType.LikerId);
        } else if (checkIsInCosmostationMobileInAppBrowser()) {
          connectWithMethod(
            LikeCoinWalletConnectorMethodType.CosmostationMobile
          );
        } else if (this._isConnectionMethodSelectDialogOpen) {
          resolve(undefined);
        } else {
          this._renderingRoot.render(
            <IntlProvider language={language}>
              <ConnectionMethodSelectionDialog
                methods={this.options.availableMethods}
                isShowMobileWarning={this.options.isShowMobileWarning}
                keplrInstallURLOverride={this.options.keplrInstallURLOverride}
                keplrInstallCTAPreset={this.options.keplrInstallCTAPreset}
                onClose={() => {
                  this.closeDialog();
                  resolve(undefined);
                }}
                onConnect={connectWithMethod}
              />
            </IntlProvider>
          );
          this._isConnectionMethodSelectDialogOpen = true;
        }
      }
    );
  };

   openWalletConnectQRCodeDialog = (
    type,
    uri,
    { language = this.options.language } = {}
  ) => {
    if (this._isWalletConnectQRCodeDialogOpen)
      return Promise.resolve(undefined);

    if (this.options.language !== language) {
      this.options.language = language;
    }

    return new Promise<LikeCoinWalletConnectorConnectionResponse>(resolve => {
      this._renderingRoot.render(
        <IntlProvider language={language}>
          <WalletConnectQRCodeDialog
            type={type}
            uri={uri}
            onClose={() => {
              this.closeDialog();
              resolve(undefined);
            }}
          />
        </IntlProvider>
      );

      this._isWalletConnectQRCodeDialogOpen = true;
    });
  };

  closeDialog = () => {
    this._renderingRoot.render(null);
    this._isConnectionMethodSelectDialogOpen = false;
    this._isWalletConnectQRCodeDialogOpen = false;
  };

   selectMethod = async (method) => {
    this.closeDialog();

    return this.init(method);
  };

  disconnect = async () => {
    const session = this.loadSession();
    if (session) {
      let wcConnector;
      switch (session.method) {
        case LikeCoinWalletConnectorMethodType.Keplr:
          removeKeplrKeyStoreChangeListener(this._accountChangeListener);
          break;

        case LikeCoinWalletConnectorMethodType.KeplrMobile:
          wcConnector = getKeplrMobileWCConnector({
            bridge: this.options.keplrMobileWCBridge,
          });
          break;

        case LikeCoinWalletConnectorMethodType.Cosmostation:
          removeCosmostationAccountChangeListener();
          break;

        case LikeCoinWalletConnectorMethodType.CosmostationMobile:
          wcConnector = getCosmostationMobileWCConnector({
            bridge: this.options.cosmostationAppWCBridge,
          });
          break;

        case LikeCoinWalletConnectorMethodType.LikerId:
          wcConnector = getLikerLandAppWCConnector({
            bridge: this.options.likerLandAppWCBridge,
          });
          break;

        case LikeCoinWalletConnectorMethodType.Leap:
          removeLeapKeyStoreChangeListener(this._accountChangeListener);
          break;

        default:
          break;
      }
      if (wcConnector) {
        await wcConnector.killSession();
      }
    }
    this.deleteSession();
    this._events.removeAllListeners();
  };

  //  getWCQRCodeDialog: (
  //   methodType: LikeCoinWalletConnectorMethodType
  // ) => IQRCodeModal = (methodType: LikeCoinWalletConnectorMethodType) => ({
  //   open: uri => {
  //     this.openWalletConnectQRCodeDialog(methodType, uri);
  //   },
  //   close: () => {
  //     this.closeDialog();
  //   },
  // });
  getWCQRCodeDialog = function (methodType) { return ({
    open: function (uri) {
        _this.openWalletConnectQRCodeDialog(methodType, uri);
    },
    close: function () {
        _this.closeDialog();
    },
}); };
  init = async (methodType) => {
    let initiator;

    switch (methodType) {
      case LikeCoinWalletConnectorMethodType.Keplr:
        initiator = initKeplr(this.options);
        break;

      case LikeCoinWalletConnectorMethodType.KeplrMobile:
        initiator = initKeplrMobile(
          this.options,
          this.getWCQRCodeDialog(LikeCoinWalletConnectorMethodType.KeplrMobile),
          this.sessionMethod,
          this.sessionAccounts
        );
        break;

      case LikeCoinWalletConnectorMethodType.Cosmostation:
        initiator = initCosmostation(this.options);
        break;

      case LikeCoinWalletConnectorMethodType.CosmostationMobile:
        initiator = initCosmostationMobile(
          this.options,
          this.getWCQRCodeDialog(
            LikeCoinWalletConnectorMethodType.CosmostationMobile
          ),
          this.sessionMethod,
          this.sessionAccounts
        );
        break;

      case LikeCoinWalletConnectorMethodType.LikerId:
        initiator = initLikerLandApp(
          this.options,
          this.getWCQRCodeDialog(LikeCoinWalletConnectorMethodType.LikerId),
          this.sessionMethod,
          this.sessionAccounts
        );
        break;

      case LikeCoinWalletConnectorMethodType.Leap:
        initiator = initLeap(this.options);
        break;

      default:
        this._accountChangeListener = undefined;
        throw new Error('METHOD_NOT_SUPPORTED');
    }

    const result = await initiator;
    if (!result) throw new Error('ACCOUNT_INIT_FAILED');

    this._accountChangeListener = () => {
      this.handleAccountChange(methodType);
    };

    switch (methodType) {
      case LikeCoinWalletConnectorMethodType.Keplr:
        listenKeplrKeyStoreChange(this._accountChangeListener);
        break;

      case LikeCoinWalletConnectorMethodType.Cosmostation:
        listenCosmostationAccountChange(this._accountChangeListener);
        break;

      case LikeCoinWalletConnectorMethodType.Leap:
        listenLeapKeyStoreChange(this._accountChangeListener);
        break;

      default:
        break;
    }

    this.saveSession({
      method: methodType,
      accounts: [...result.accounts],
    });

    return {
      method: methodType,
      ...result,
    }
  };

  initIfNecessary = function () { return __awaiter(_this, void 0, void 0, function () {
    var session;
    return __generator(this, function (_a) {
        session = this.restoreSession();
        return [2 /*return*/, (session === null || session === void 0 ? void 0 : session.method) ? this.init(session.method) : undefined];
    });
}); };

  /**
   * Session
   */
   saveSession = ({
    method,
    accounts,
  }) => {
    this.sessionAccounts = accounts;
    this.sessionMethod = method;
    try {
      window.localStorage.setItem(
        SESSION_KEY,
        JSON.stringify({
          method,
          accounts: accounts.map(account => ({
            ...account,
            pubkey: serializePublicKey(account.pubkey),
          })),
        })
      );
    } catch (error) {
      console.warn(error);
    }
  };

   loadSession = () => {
    try {
      const serializedSession = window.localStorage.getItem(SESSION_KEY);
      if (serializedSession) {
        const { method, accounts = [] } = JSON.parse(serializedSession);
        if (
          Object.values(LikeCoinWalletConnectorMethodType).includes(method) &&
          Array.isArray(accounts)
        ) {
          return {
            method,
            accounts: accounts.map(account => ({
              ...account,
              pubkey: deserializePublicKey(account.pubkey),
            })),
          } 
        }
      }
    } catch (error) {
      // Not allow to access local storage/unable to decode session
      console.warn(error);
    }
    return undefined;
  };

  restoreSession = () => {
    const session = this.loadSession();
    if (session) {
      this.sessionAccounts = session.accounts;
      this.sessionMethod = session.method;
      this._accountChangeListener = () => {
        this.handleAccountChange(session.method);
      };
      switch (session.method) {
        case LikeCoinWalletConnectorMethodType.Keplr:
          listenKeplrKeyStoreChange(this._accountChangeListener);
          break;

        default:
          break;
      }
    }
    return session;
  };

   deleteSession = () => {
    this.sessionAccounts = [];
    this.sessionMethod = undefined;
    try {
      window.localStorage.removeItem(SESSION_KEY);
    } catch (error) {
      console.warn(error);
    }
  };

  /**
   * Event
   */
  on = (name, listener) => {
    return this._events.on(name, listener);
  };

  once = (name, listener) => {
    return this._events.once(name, listener);
  };

  off = (name, listener) => {
    return this._events.off(name, listener);
  };

  removeListener = (name, listener) => {
    return this._events.removeListener(name, listener);
  };

   handleAccountChange = (
    methodType
  ) => {
    this._events.emit('account_change', methodType);
  };
}
