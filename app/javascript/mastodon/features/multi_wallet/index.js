/* eslint-disable react/jsx-no-bind */
import * as React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import ImmutablePureComponent from 'react-immutable-pure-component';

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
import { LikeCoinWalletConnectorMethodType } from './types';
import { IntlProvider } from './i18n';
import Icon from 'mastodon/components/icon';
import { connect } from 'react-redux';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';

import { changeAddress, changeDrawer } from 'mastodon/actions/app';
import {
  Tab,
  Tabs,
  Spinner,
  Button,
  Classes,
  Code,
  Divider,
  Drawer,
  DrawerSize,
  H5,
  HTMLSelect,
  Label,
  Menu,
  MenuItem,
  OptionProps,
  Position,
} from '@blueprintjs/core';
import NftList from './components/nft_list';
import { Tooltip2 } from '@blueprintjs/popover2';
import { getLikerInfoByAddress, getSaleStatsByAddress, getCoinPrice, getCollectRankByCollecterAddress } from '../../utils/api/like';

const CONTAINER_ID = 'likecoin-wallet-connector';
const SESSION_KEY = 'likecoin_wallet_connector_session';
const WC_BRIGDE = 'https://bridge.walletconnect.org';

const mapStateToProps = (state) => ({
});
const mapDispatchToProps = dispatch => ({
  changeAddress: (address) => dispatch(changeAddress(address)),
});

export default
@connect(mapStateToProps, mapDispatchToProps)
@injectIntl
class LikeCoinWalletConnector extends ImmutablePureComponent{

  static propTypes = {
    params: PropTypes.object,
    dispatch: PropTypes.func,
    lists: ImmutablePropTypes.list,
    intl: PropTypes.object,
    multiColumn: PropTypes.bool,
    router: PropTypes.object,
    identity: PropTypes.object,
  };
  state = {
    method: '',
    walletAddress: '',
    offlineSigner: {},
    isLoading: false,
    options: {
      chainId: 'chainId',
      chainName: 'chainName',
      rpcURL: 'rpcURL',
      restURL: 'restURL',
      coinType: 'options.coinType',
      coinDenom: 'options.coinDenom',
      coinMinimalDenom: 'options.coinMinimalDenom',
      coinDecimals: 'options.coinDecimals',
      coinGeckoId: '',
      bech32PrefixAccAddr: 'options.bech32PrefixAccAddr',
      bech32PrefixAccPub: 'options.bech32PrefixAccPub',
      bech32PrefixValAddr: 'options.bech32PrefixValAddr',
      bech32PrefixValPub: ' options.bech32PrefixValPub',
      bech32PrefixConsAddr: 'options.bech32PrefixConsAddr',
      bech32PrefixConsPub: 'options.bech32PrefixConsPub',
      gasPriceStepLow: 1,
      gasPriceStepAverage: 10,
      gasPriceStepHigh: 1000,
      walletURLForStaking: '',
      initAttemptCount: 3,
      availableMethods: [
        LikeCoinWalletConnectorMethodType.Keplr,
        LikeCoinWalletConnectorMethodType.KeplrMobile,
        LikeCoinWalletConnectorMethodType.LikerId,
        LikeCoinWalletConnectorMethodType.Cosmostation,
      ],
      keplrSignOptions: {},
      keplrMobileWCBridge: WC_BRIGDE,
      keplrInstallURLOverride: '',
      keplrInstallCTAPreset: 'origin',
      likerLandAppWCBridge: WC_BRIGDE,
      cosmostationAppWCBridge: WC_BRIGDE,
      cosmostationDirectSignEnabled: false,
      isShowMobileWarning: true,
      language: 'en',
    },
    sessionAccounts: [],
    sessionMethod: undefined,
    _events: new EventEmitter(),
    container: document.createElement('div'),
    _renderingRoot: {},
    _isConnectionMethodSelectDialogOpen: false,
    _isWalletConnectQRCodeDialogOpen: false,
    _accountChangeListener: {},
    currentMethodType: '',
    currentUri: '',
    isWalletDrawerOpen: false,
    profile: {},
    saleStats: {},
    coinPrice: {},
    currentTab: 'latest',
  };

  // constructor(options) {
  //     this.state.options = {
  //         chainId: options.chainId,
  //         chainName: options.chainName,
  //         rpcURL: options.rpcURL,
  //         restURL: options.restURL,
  //         coinType: options.coinType,
  //         coinDenom: options.coinDenom,
  //         coinMinimalDenom: options.coinMinimalDenom,
  //         coinDecimals: options.coinDecimals,
  //         coinGeckoId: options.coinGeckoId || '',
  //         bech32PrefixAccAddr: options.bech32PrefixAccAddr,
  //         bech32PrefixAccPub: options.bech32PrefixAccPub,
  //         bech32PrefixValAddr: options.bech32PrefixValAddr,
  //         bech32PrefixValPub: options.bech32PrefixValPub,
  //         bech32PrefixConsAddr: options.bech32PrefixConsAddr,
  //         bech32PrefixConsPub: options.bech32PrefixConsPub,
  //         gasPriceStepLow: options.gasPriceStepLow || 1,
  //         gasPriceStepAverage: options.gasPriceStepAverage || 10,
  //         gasPriceStepHigh: options.gasPriceStepHigh || 1000,
  //         walletURLForStaking: options.walletURLForStaking || '',
  //         initAttemptCount: options.initAttemptCount || 3,
  //         availableMethods: options.availableMethods || [
  //             LikeCoinWalletConnectorMethodType.Keplr,
  //             LikeCoinWalletConnectorMethodType.KeplrMobile,
  //             LikeCoinWalletConnectorMethodType.LikerId,
  //             LikeCoinWalletConnectorMethodType.Cosmostation,
  //         ],
  //         keplrSignOptions: options.keplrSignOptions || {},
  //         keplrMobileWCBridge: options.keplrMobileWCBridge || WC_BRIGDE,
  //         keplrInstallURLOverride: options.keplrInstallURLOverride || '',
  //         keplrInstallCTAPreset: options.keplrInstallCTAPreset || 'origin',
  //         likerLandAppWCBridge: options.likerLandAppWCBridge || WC_BRIGDE,
  //         cosmostationAppWCBridge: options.cosmostationAppWCBridge || WC_BRIGDE,
  //         cosmostationDirectSignEnabled: options.cosmostationDirectSignEnabled || false,
  //         isShowMobileWarning: options.isShowMobileWarning !== undefined
  //             ? !!options.isShowMobileWarning
  //             : true,
  //         language: options.language || 'en',
  //     };
  //     this.state.sessionAccounts = [];
  //     this.state._events = new EventEmitter();
  //     const container = document.createElement('div');
  //     container.setAttribute('id', CONTAINER_ID);
  //     document.body.appendChild(container);
  //     this.state._renderingRoot = createRoot(container);
  // }
  /**
   * @deprecated Please use openConnectionMethodSelectionDialog() instead
   */
  openConnectWalletModal = () => this.openConnectionMethodSelectionDialog();
  openConnectionMethodSelectionDialog = ({
    language = this.state.options.language,
  } = {}) => {
    if (this.state.options.language !== language) {
      this.setState({
        language: language,
      });
    }
    return new Promise(async (resolve) => {
      if (checkIsInLikerLandAppInAppBrowser()) {
        let result = await this.connectWithMethod(
          LikeCoinWalletConnectorMethodType.LikerId,
        );
        resolve(result);
      } else if (checkIsInCosmostationMobileInAppBrowser()) {
        let result = await this.connectWithMethod(
          LikeCoinWalletConnectorMethodType.CosmostationMobile,
        );
        resolve(result);
      } else if (this.state._isConnectionMethodSelectDialogOpen) {
        resolve(undefined);
      } else {
        this.setState({
          _isConnectionMethodSelectDialogOpen: true,
        });
      }
    });
  };
  connectWithMethod = async (method) => {
    const result = await this.selectMethod(method);
    return result;
  };
  openWalletConnectQRCodeDialog = (
    type,
    uri,
    { language = this.state.options.language } = {},
  ) => {
    if (this.state._isWalletConnectQRCodeDialogOpen)
      return Promise.resolve(undefined);
    if (this.state.options.language !== language) {
      this.setState({
        options: { ...this.state.options, language },
      });
      // this.state.options.language = language;
    }
    return new Promise((resolve) => {
      this.setState({
        _isWalletConnectQRCodeDialogOpen: true,
      });
      // this.state._isWalletConnectQRCodeDialogOpen = true;
      this.setState({
        currentMethodType: type,
        currentUri: uri,
      });
    });
  };
  closeDialog = () => {
    this.setState({
      _isConnectionMethodSelectDialogOpen: false,
      _isWalletConnectQRCodeDialogOpen: false,
    });
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
        removeKeplrKeyStoreChangeListener(this.state._accountChangeListener);
        break;
      case LikeCoinWalletConnectorMethodType.KeplrMobile:
        wcConnector = getKeplrMobileWCConnector({
          bridge: this.state.options.keplrMobileWCBridge,
        });
        break;
      case LikeCoinWalletConnectorMethodType.Cosmostation:
        removeCosmostationAccountChangeListener();
        break;
      case LikeCoinWalletConnectorMethodType.CosmostationMobile:
        wcConnector = getCosmostationMobileWCConnector({
          bridge: this.state.options.cosmostationAppWCBridge,
        });
        break;
      case LikeCoinWalletConnectorMethodType.LikerId:
        wcConnector = getLikerLandAppWCConnector({
          bridge: this.state.options.likerLandAppWCBridge,
        });
        break;
      case LikeCoinWalletConnectorMethodType.Leap:
        removeLeapKeyStoreChangeListener(this.state._accountChangeListener);
        break;
      default:
        break;
      }
      if (wcConnector) {
        await wcConnector.killSession();
      }
    }
    this.deleteSession();
    this.state._events.removeAllListeners();
    this.closeWalletDrawer();
  };
  getWCQRCodeDialog = (methodType) => ({
    open: (uri) => {
      this.openWalletConnectQRCodeDialog(methodType, uri);
    },
    close: () => {
      this.closeDialog();
    },
  });
  init = async (methodType) => {
    let initiator;
    switch (methodType) {
    case LikeCoinWalletConnectorMethodType.Keplr:
      initiator = initKeplr(this.state.options);
      break;
    case LikeCoinWalletConnectorMethodType.KeplrMobile:
      initiator = initKeplrMobile(
        this.state.options,
        this.getWCQRCodeDialog(LikeCoinWalletConnectorMethodType.KeplrMobile),
        this.state.sessionMethod,
        this.state.sessionAccounts,
      );
      break;
    case LikeCoinWalletConnectorMethodType.Cosmostation:
      initiator = initCosmostation(this.state.options);
      break;
    case LikeCoinWalletConnectorMethodType.CosmostationMobile:
      initiator = initCosmostationMobile(
        this.state.options,
        this.getWCQRCodeDialog(
          LikeCoinWalletConnectorMethodType.CosmostationMobile,
        ),
        this.state.sessionMethod,
        this.state.sessionAccounts,
      );
      break;
    case LikeCoinWalletConnectorMethodType.LikerId:
      initiator = initLikerLandApp(
        this.state.options,
        this.getWCQRCodeDialog(LikeCoinWalletConnectorMethodType.LikerId),
        this.state.sessionMethod,
        this.state.sessionAccounts,
      );
      break;
    case LikeCoinWalletConnectorMethodType.Leap:
      initiator = initLeap(this.state.options);
      break;
    default:
      this.setState({
        _accountChangeListener: undefined,
      });
      // this.state._accountChangeListener = undefined;
      throw new Error('METHOD_NOT_SUPPORTED');
    }
    const result = await initiator;
    if (!result) throw new Error('ACCOUNT_INIT_FAILED');
    this.setState({
      __accountChangeListener: () => {
        this.handleAccountChange(methodType);
      },
    });
    // this.state._accountChangeListener = () => {
    //   this.handleAccountChange(methodType);
    // };
    switch (methodType) {
    case LikeCoinWalletConnectorMethodType.Keplr:
      listenKeplrKeyStoreChange(this.state._accountChangeListener);
      break;
    case LikeCoinWalletConnectorMethodType.Cosmostation:
      listenCosmostationAccountChange(this.state._accountChangeListener);
      break;
    case LikeCoinWalletConnectorMethodType.Leap:
      listenLeapKeyStoreChange(this.state._accountChangeListener);
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
    };
  };
  initIfNecessary = async () => {
    const session = this.restoreSession();
    return session?.method ? this.init(session.method) : undefined;
  };
  /**
   * Session
   */
  saveSession = ({ method, accounts }) => {
    this.setState({
      sessionAccounts: accounts,
      method: method,
    });
    this.props.changeAddress(accounts[0].address);
    try {
      window.localStorage.setItem(
        SESSION_KEY,
        JSON.stringify({
          method,
          accounts: accounts.map((account) => ({
            ...account,
            pubkey: serializePublicKey(account.pubkey),
          })),
        }),
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
            accounts: accounts.map((account) => ({
              ...account,
              pubkey: deserializePublicKey(account.pubkey),
            })),
          };
        }
      }
    } catch (error) {
      // Not allow to access local storage/unable to decode session
      console.warn(error);
    }
    return undefined;
  };
  getLikerProfile = async (session)=>{
    let result = await getLikerInfoByAddress('like13f4glvg80zvfrrs7utft5p68pct4mcq7t5atf6');
    this.setState({
      profile: result.data,
    });
  };

  getSaleStats = async (session) => {
    let result = await getSaleStatsByAddress('like13f4glvg80zvfrrs7utft5p68pct4mcq7t5atf6');
    this.setState({
      saleStats: result.data,
    });
  };
  restoreSession = () => {
    const session = this.loadSession();
    this.getLikerProfile(session);
    this.getSaleStats(session);
    if (session) {
      this.setState({
        sessionAccounts: session.accounts,
        sessionMethod: session.method,
      });
      this.setState({
        _accountChangeListener: () => {
          this.handleAccountChange(session.method);
        },
      });
      // this.state._accountChangeListener = () => {
      //   this.handleAccountChange(session.method);
      // };
      switch (session.method) {
      case LikeCoinWalletConnectorMethodType.Keplr:
        listenKeplrKeyStoreChange(this.state._accountChangeListener);
        break;
      default:
        break;
      }
    }
    return session;
  };
  deleteSession = () => {
    this.setState({
      sessionAccounts: [],
      sessionMethod: undefined,
    });
    this.props.changeAddress(null);
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
    return this.state._events.on(name, listener);
  };
  once = (name, listener) => {
    return this.state._events.once(name, listener);
  };
  off = (name, listener) => {
    return this.state._events.off(name, listener);
  };
  removeListener = (name, listener) => {
    return this.state._events.removeListener(name, listener);
  };
  handleAccountChange = (methodType) => {
    this.state._events.emit('account_change', methodType);
  };

  async connect() {
    const connection = await this.openConnectionMethodSelectionDialog();
    this.handleConnection(connection);
  }
  handleConnection(connection) {
    if (!connection) return;
    const {
      method,
      accounts: [account],
      offlineSigner,
    } = connection;
    this.setState({
      method: method,
      walletAddress: account.address,
      offlineSigner: offlineSigner,
    });
    this.once('account_change', this.handleAccountChange);
  }
  openWalletDrawer = () => {
    this.setState({
      isWalletDrawerOpen: true,
    });
  };
  closeWalletDrawer = () => {
    this.setState({
      isWalletDrawerOpen: false,
    });
  };
  getCoinPrice = async () =>{
    let result = await getCoinPrice();
    this.setState({
      coinPrice: result.data,
    });
  };

  handleTabChange = (e) => {
    this.setState(
      {
        currentTab: e,
      },
    );
  };
  componentDidMount() {
    this.setState({
      options: {
        chainId: 'likecoin-mainnet-2',
        chainName: 'LikeCoin',
        rpcURL: 'https://mainnet-node.like.co/rpc/',
        restURL: 'https://mainnet-node.like.co',
        coinType: 118,
        coinDenom: 'LIKE',
        coinMinimalDenom: 'nanolike',
        coinDecimals: 9,
        coinGeckoId: 'likecoin',
        bech32PrefixAccAddr: 'like',
        bech32PrefixAccPub: 'likepub',
        bech32PrefixValAddr: 'likevaloper',
        bech32PrefixValPub: 'likevaloperpub',
        bech32PrefixConsAddr: 'likevalcons',
        bech32PrefixConsPub: 'likevalconspub',
        availableMethods: [
          LikeCoinWalletConnectorMethodType.Keplr,
          LikeCoinWalletConnectorMethodType.Cosmostation,
          LikeCoinWalletConnectorMethodType.LikerId,
          LikeCoinWalletConnectorMethodType.Leap,
          LikeCoinWalletConnectorMethodType.CosmostationMobile,
          LikeCoinWalletConnectorMethodType.KeplrMobile,
        ],
        keplrSignOptions: {
          disableBalanceCheck: true,
          preferNoSetFee: true,
          preferNoSetMemo: true,
        },
        keplrInstallURLOverride: 'https://www.keplr.app/download',
        keplrInstallCTAPreset: 'fancy-banner',
        cosmostationDirectSignEnabled: true,

        language: 'zh',
      },
    });
    const session = this.restoreSession();
    this.handleConnection(session);
    this.setState({
      isLoading: false,
    });
    this.getCoinPrice();
  }
  render() {
    const { intl, lists, multiColumn } = this.props;
    const {
      options,
      currentMethodType,
      currentUri,
      _isConnectionMethodSelectDialogOpen,
      _isWalletConnectQRCodeDialogOpen,
      sessionAccounts,
      sessionMethod,
      isWalletDrawerOpen,
      profile,
      saleStats,
      coinPrice,
      currentTab,
    } = this.state;
    return (
      <div class='nav-btn'>
        <div
          target='_blank'
          aria-current='page'
          class='btn small w-inline-block w--current'
        >
          <div class='icon-medium w-embed'>
            <Icon id='wallet' fixedWidth className='column-link__icon' />
          </div>
          <div>
            <Drawer
              isOpen={isWalletDrawerOpen}
              className='wallet-drawer'
              icon='id-number'
              onClose={this.closeWalletDrawer}
              title='Wallet'
              size={screen.width > 600 ? '50%' : '90%'}
            >
              <div class='wallet-drawer-container'>
                <img src={profile.avatar} alt='Avatar' class='avatar' />
                <div className='logout' onClick={this.disconnect}>
                  <Icon id='right-from-bracket' className='column-link__icon' />
                  <div>Log Out</div>
                </div>
                <div class='name'>{profile.displayName}</div>
                <div class='wallet'>{profile.likeWallet}</div>
                {/* <div class='wallet'>{profile.cosmosWallet}</div> */}
                {/* <div class='wallet'>{profile.wallet}</div> */}

                <div class='intro'>
                  {profile.description}
                </div>
                <div class='stats'>
                  <div class='stat'>
                    <div class='label'>Works</div>
                    <div class='value'>{saleStats.createdClassCount}</div>
                  </div>
                  <div class='stat'>
                    <div class='label'>Collect</div>
                    <div class='value'>{saleStats.collectedClassCount}</div>
                  </div>
                  <div class='stat'>
                    <div class='label'>Collector</div>
                    <div class='value'>{saleStats.createdCollectorCount}</div>
                  </div>
                  <div class='stat'>
                    <div class='label'>Saled Value</div>
                    <div class='value'>{saleStats.collectedValue} LIKE ≈ {coinPrice?.likecoin ? `${(saleStats.collectedValue*coinPrice?.likecoin?.usd).toFixed(1)} USD` : ''}</div>
                  </div>
                </div>
                <div class='lists'>
                  <Tabs
                    id='nft-tabs'
                    onChange={this.handleTabChange}
                    selectedTabId={currentTab}
                  >
                    <Tab
                      id='latest'
                      title='我創作的 NFT'
                      panel={<NftList likerInfo={profile} address={sessionAccounts.length !== 0 ? sessionAccounts[0].address : ''} selected={currentTab === 'latest' ? true : false} contentType='latest' />}
                      panelClassName='nft-list-latest'
                    />
                    <Tab
                      id='collect'
                      title='我收藏的 NFT'
                      panel={<NftList likerInfo={profile} address={sessionAccounts.length !== 0 ? sessionAccounts[0].address : ''} selected={currentTab === 'collect' ? true : false} contentType='collect' />}
                      panelClassName='nft-list-collect'
                    />
                  </Tabs>
                </div>
              </div>
            </Drawer>
            {sessionAccounts.length !== 0 ? (
              <Tooltip2
                intent='primary'
                content={sessionAccounts[0].address}
                position={Position.BOTTOM}
                openOnTargetFocus={false}
              >
                <div onClick={this.openWalletDrawer}>
                  {sessionAccounts[0].address.slice(0, 7)}...
                </div>
              </Tooltip2>
            ) : (
              <p onClick={this.connect.bind(this)}>Wallet Connect</p>
            )}
          </div>
        </div>
        <IntlProvider language={options.language}>
          <div className='wallet-dialog'>
            {_isConnectionMethodSelectDialogOpen ? (
              <ConnectionMethodSelectionDialog
                methods={this.state.options.availableMethods}
                isShowMobileWarning={this.state.options.isShowMobileWarning}
                keplrInstallURLOverride={
                  this.state.options.keplrInstallURLOverride
                }
                keplrInstallCTAPreset={this.state.options.keplrInstallCTAPreset}
                onClose={() => {
                  this.closeDialog();
                }}
                onConnect={this.connectWithMethod}
                isConnectionMethodSelectDialogOpen={
                  _isConnectionMethodSelectDialogOpen
                }
              />
            ) : null}
            {this.state._isWalletConnectQRCodeDialogOpen ? (
              <WalletConnectQRCodeDialog
                type={currentMethodType}
                uri={currentUri}
                onClose={() => {
                  this.closeDialog();
                }}
              />
            ) : null}
          </div>
        </IntlProvider>
      </div>
    );
  }

}
