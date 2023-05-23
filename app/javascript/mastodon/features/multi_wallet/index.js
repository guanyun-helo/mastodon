/* eslint-disable promise/catch-or-return */
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

import { changeAddress, changeDrawer, changeSigner, changeProfileAddress, initConnectMethods } from 'mastodon/actions/app';
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
  OptionProps,
  Position,
  Intent,
  PopoverInteractionKind,
  MenuItem,
  Menu,
  MenuDivider,
} from '@blueprintjs/core';
import NftList from './components/nft_list';
import { Popover2 } from '@blueprintjs/popover2';
import { getLikerInfoByAddress, getSaleStatsByAddress, getCoinPrice, getCollectRankByCollecterAddress } from '../../utils/api/like';

const CONTAINER_ID = 'likecoin-wallet-connector';
const SESSION_KEY = 'likecoin_wallet_connector_session';
const WC_BRIGDE = 'https://bridge.walletconnect.org';

const mapStateToProps = (state) => ({
  connectMethod: state.getIn(['meta', 'connect']),
});
const mapDispatchToProps = dispatch => ({
  changeDrawer: (drawerParams) => dispatch(changeDrawer(drawerParams)),
  changeAddress: (address) => dispatch(changeAddress(address)),
  changeSigner: (signer) => dispatch(changeSigner(signer)),
  changeProfileAddress: (address) => dispatch(changeProfileAddress(address)),
  initConnectMethods: (methods) => dispatch(initConnectMethods(methods)),
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
    const session = await this.restoreSession();
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
          this.props.changeAddress(accounts[0].address);
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
      profile: result,
    });
  };

  getSaleStats = async (session) => {
    let result = await getSaleStatsByAddress('like13f4glvg80zvfrrs7utft5p68pct4mcq7t5atf6');
    this.setState({
      saleStats: result,
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
    this.props.changeDrawer({ isDrawerOpen: true, drawerType: 'profile' });
    this.props.changeProfileAddress(this.state.sessionAccounts[0].address);
  };
  closeWalletDrawer = () => {
    this.setState({
      isWalletDrawerOpen: false,
    });
  };
  getCoinPrice = async () =>{
    let result = await getCoinPrice();
    this.setState({
      coinPrice: result,
    });
  };

  componentDidMount = async()=> {
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
    let connection = await this.initIfNecessary();
    this.props.changeSigner(connection.offlineSigner);
    this.setState({
      isLoading: false,
    });
    this.getCoinPrice();
    this.props.initConnectMethods({ connect: this.connect.bind(this), disconnect: this.disconnect.bind(this) });
  };

  copyAddress = () =>{
    const { sessionAccounts } = this.state;
    const address = sessionAccounts[0].address;
    navigator.clipboard.writeText(address).then(()=> {
      console.log('Copied!');
    }, ()=> {
      console.log('Copy error');
    });
  };

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

    const FileMenu = ()=>(
      <Menu className='wallet-nft-list'>
        <MenuItem onClick={this.openWalletDrawer} text='Dashboard' icon='dashboard'  />
        <MenuItem onClick={this.copyAddress} text='Copy Address' icon='hand-right'  />
        <MenuItem onClick={this.disconnect} text='Logout' icon='log-out'  />
        {/* <MenuItem text='Close' icon='add-to-folder'  /> */}
        {/* <MenuDivider /> */}
        {/* <MenuItem text='Save' icon='floppy-disk' /> */}
        {/* <MenuItem text='Save as...' icon='floppy-disk'  /> */}
        {/* <MenuDivider /> */}
        {/* <MenuItem text='Exit' icon='cross'  /> */}
      </Menu>
    );
    return (
      <div class='wallet-nav-btn'>
        <div
          target='_blank'
          aria-current='page'
          class='wallet-connect-button'
        >
          <div class='icon'>
            <svg className='logo' width='174.73' height='177.488' viewBox='82.635 36.256 174.73 177.488'>
              <defs>
                <filter
                  id='303cbcbf-05ff-4625-9ec2-291fef8ab4f6'
                  filterUnits='userSpaceOnUse'
                >
                  <feColorMatrix values='0 0 0 0 0.99609375 0 0 0 0 0.99609375 0 0 0 0 0.99609375 0 0 0 1 0' />
                </filter>
              </defs>
              <mask id='e2182ae3-c428-45ec-a7cb-d25e2bfeb4ae'>
                <g
                  filter='url(#303cbcbf-05ff-4625-9ec2-291fef8ab4f6)'
                  mask='url(#71865c0d-35d5-4d84-9445-a90c6eef756f)'
                >
                  <path
                    className='image-rect'
                    fill='#21004B'
                    fillOpacity='0'
                    strokeWidth='2'
                    d='M0 0H150V165.488H0z'
                  />
                  <svg
                    width='150'
                    height='165.488'
                    className='image-svg-svg primary'
                    overflow='visible'
                  >
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      x='0'
                      y='0'
                      viewBox='6.133 1.14 87.849 96.92'
                    >
                      <path d='M37 55.6c-.6.6-1.2.6-1.8.6-1.9.1-3.2 1.2-3.3 3.1-.1 2.1 2.1 6 4 6.9 3.2 1.6 6.1 1.2 8.9-1.1 3-2.5 5.1-5.8 7.5-8.8 1.1-1.3 2.1-2.7 2.8-4.3 1.9-4.1 1.4-8.2.2-12.3-.6-2.2-4-3.8-6.3-3.4-.5.1-1.2.3-1.4-.3-.2-.7.6-.6 1.1-.8 2.4-.9 4.6-.7 6.5 1.8.5-2.9.3-4.9-1.8-6.8-2.7-2.6-5.9-4.3-9.3-5.8-2.2-.9-4.5-1.1-6.8-.9-2.3.2-4.6.5-6.9.5-4.4-.1-6.5-3.1-8-6.7-.2-.6-.5-1.2-.6-1.9-.3-1.6-.4-3.2 1-4.6 1.8-1.7 2-4.2 2.6-6.5.3-.9-.8-1.7-1.5-1.7-1.4.1-2.9.3-3.7 1.9-.7 1.4-.1 2.2.9 3 .6.5.8 1 .1 1.6-1.7 1.3-2.7 3-3.6 5-1.4 3.3-2.8 6.5-3.9 9.9-.9 2.7-1.1 5.4-.7 8.3.2 1.4.7 2.3 2.2 2.1 1.4-.1 1.5.9 1.6 1.8 0 .3-.1.6-.4.7-1.8.9-2.8 2.5-2.6 4.9.4 8.1 0 16.3 3.5 24 1.4 3.2 1.9 6.9 4.3 9.7 1.6 2 3.5 3.8 5.3 5.5 2.1 2 3.7 4.5 5.8 6.5 2 2 4.4 3.1 7.5 2.9-.5-1-1-1.4-1.6-1.9-1-.7-2-1.4-2.1-2.7-.1-.5-.3-1.1.5-1.3.7-.2 1 .3 1.1.8.5 1.8 2 2.8 3.4 3.7.4.3.9.5 1.3.3 1.7-.8 3.4-1.7 5.1-2.6.7-.4.5-.9-.1-1.4-1.3-.7-2.8-1.3-3.8-2.5-.4-.4-1.1-.9-.6-1.5.6-.7 1.1 0 1.6.4 1.1.9 2.3 1.7 3.4 2.6.9.7 1.3.3 1.8-.5 1.3-1.7 1-3.5.2-5.2-.2-.5-.6-.9-1.2-1-.5-.1-1.3.1-1-.8.2-.8 1-1.1 1.7-.7 1.7.8 2.4 2.3 2.6 4 .5 3.9-1.9 6.5-4.8 8.3-1.9 1.3-4.2 2.2-6.4 3.1-3.6 1.5-6.4-.2-9.2-2.2-1.3-.9-2.1-2.2-3.1-3.4-1.1-1.4-2.6-2.5-3.6-4-1.2-1.7-2.3-1.5-3.2-.2-2.5 3.4-5.3 2.8-8.5 1.1-2-1.1-4.1-1.7-5.7-3.5-2.8-3-2.1-5.1-.2-8 1.7-2.6 3.5-5.1 5.6-7.4.6-.7.9-1.4.7-2.3-1.7-6.3-1.2-12.7-1.8-19.1-.2-1.9.5-3.5 1.4-5.1.5-1 1.2-1.9-.7-2.2-.9-.1-1.2-1-1.4-1.9-.7-3.2-.3-6.3.8-9.3 2-4.9 3.3-10.4 6.6-15 .5-.7-.1-1.2-.3-1.8C17.6 5 18 3 19.9 2c2.8-1.5 5.7-1 6.9 1.2.8 1.4-.1 2.6-.5 3.7-.7 1.9-1.1 4-2.5 5.6-.3.4-.4 1-.5 1.5-.4 2.9 2.9 7.9 5.8 8.4 1.9.4 3.8.3 5.7 0 2.9-.3 5.8-.5 8.7.1 2.5.6 4.5 2 6.7 3.1 1.3.6 2.6 1.4 3.6 2.5.5.6 1.2.5 1.8.4 2.5-.2 4.9.2 7.2 1.5 2.1 1.2 3.2 3.3 2.8 5.6-.1.8-.2 1.5-.4 2.3-.1.5.3 1.5-.7 1.3-.5-.1-1.1-1-.8-1.8.3-.9.6-1.8.4-2.8-.3-2.7-4.7-5.5-7.3-4.6-.4.1-.7.3-.4.7 1.6 2.1.7 4.3.5 6.5-.2 2 .2 2.5 2.2 2.3 1.2-.1 2.3.3 3.5.4 2.6.3 4.6 1.7 6.7 3.1.5.3 1 .8 1.5.9 4.8 1.1 6.8 5.1 9.2 8.7.8 1.3 1.5 1.7 3 1.3 1.6-.4 3.1-.9 4.4-1.8 1.2-.8 1.7-1.8 1-3.3-.7-1.4-.9-3.1-1.2-4.6-.6-3 1.3-4.8 3.1-6.6.4-.4 1.2-.5 1.3.4.3 3.1 1.8 5.8 2.3 8.8.1.8.2 1.5-.3 2.2-1.8 3-4.2 5.5-6.8 7.9-1.3 1.2-3.1 1.3-4.7 2.1-1 .5-1.5 1.1-1.6 2.1-.4 3.2-.7 6.5-1.2 9.7-.5 2.9-1.3 5.8-2.7 8.5-2.3 4.5-5 8.8-8.4 12.5-2.4 2.6-5 4.9-8.5 6-1.9.6-3.8.1-5.4-.9-2.7-1.6-4.4-4-5.1-7.2-.1-.5-.2-1 .3-1.2.6-.3.8.3 1 .7.2.3.3.7.3 1 .5 3.2 2.9 4.7 5.5 5.8 2.7 1.1 5.2 0 7.1-1.7 5.9-4.9 10.4-11 12.6-18.4 1.7-5.6 2.7-11.4 2.6-17.4 0-3.5-1.7-6.3-4-8.7-4.3-4.7-10.1-6.6-16-8.2-.8-.2-1.3.1-1.3 1 0 1.4-.1 2.8.1 4.1.7 3.3-.8 5.8-2.6 8.2-2.1 3-4.3 6-6.7 8.7-2.6 2.9-5.6 5.6-10.1 5.2-2.5-.2-6.5-2.4-7-5.7-.3-1.5-1.1-2.9-1-4.5.1-2.1 1.6-2.9 3.1-3.7 1.7-.7 2.8.1 3.9.7zM15.9 82.2c.9.5 1.8.9 2.9.6 1.7-.6 2.5-2.1 3.7-3.2.5-.5-.2-.7-.5-.9-1.4-1.6-2.7-3.1-3.5-5.1-1-2.6-2.5-5.1-2.8-8-.1-1.2-.6-1.2-1.5-.4-2.3 2.2-4.2 4.7-5.7 7.4-.9 1.8-1.6 3.8.4 5.6.2-.4.4-.8.6-1.1.4-.5.5-1.7 1.4-1.3 1 .5.1 1.2-.3 1.9-.7 1.3-.4 2.3.9 2.9 1.4.6 2.8 1.1 4.1 1.6h.3zM87 54.4c-1.6.7-3.2 1.3-4.9 1.3-1 0-.9.8-.8 1.4 0 .4.1.8.6.6 1.8-1 3.9-1.4 5.1-3.3z' />
                      <path d='M33 28.5c2.6 0 3.6 1.3 2.3 3.3-1.8 2.6-4.3 4.5-7.6 5-.5.1-1.1.1-1.5-.4-.2-.3-.1-.6.1-.8.5-.4 1-.3 1.5 0 .4.2.7.2 1 0 1.7-.9 3.4-1.7 4.8-3.1.6-.6.8-1.4.6-1.9-.3-.7-1.2-.2-1.8-.3-1-.1-.8.6-.9 1.1-.5 2.5-1.7 3.6-4 3.5-1.2 0-1.9-.5-1.5-1.9.8-3 3.1-4.5 7-4.5zM22.1 46.5c-1-1-1.6-2.3-2.9-3-.5-.3-1-1.7.4-2.2.7-.2.3-.7.3-1-.3-.8 0-1.7 0-2.5s.5-.9 1.1-.5c.5.3.9 1.3 1.4 0h.3c-.1 1.7 1.7 1 2.3 1.8.1.1-.1.6-.2.8-1.2 1.5-.6 2.9.2 4.2.2.4.4.9.5 1.3 0 .1-.2.5-.4.5-.3.1-.5-.2-.4-.4.3-.9-.8-.9-1-1.5-.2-.5-.5-.6-1-.4-.4.2-.7.6-.6 1.2 0 .5.7.9 0 1.7zM15.8 82.2c-.1-.9-.3-1.9-.3-2.8 0-.7.4-1.2 1-1.1.6.1.5.6.4 1.1-.2 1-.3 2-1 2.7l-.1.1z' />
                    </svg>
                  </svg>
                  <defs>
                    <filter id='colors6729668187'>
                      <feColorMatrix
                        className='icon-fecolormatrix'
                        values='0 0 0 0 0.73046875 0 0 0 0 0.1796875 0 0 0 0 0.1796875 0 0 0 1 0'
                      />
                    </filter>
                    <filter id='colorsf5505824062'>
                      <feColorMatrix
                        className='icon-fecolormatrix'
                        values='0 0 0 0 0.99609375 0 0 0 0 0.99609375 0 0 0 0 0.99609375 0 0 0 1 0'
                      />
                    </filter>
                  </defs>
                </g>
              </mask>
              <mask id='71865c0d-35d5-4d84-9445-a90c6eef756f'>
                <g fill='#FFF'>
                  <path
                    strokeWidth='2'
                    d='M0 0H150V165.488H0z'
                    className='image-rect'
                  />
                  <svg
                    width='150'
                    height='165.488'
                    className='image-svg-svg primary'
                    filter='url(#colorsf5505824062)'
                    overflow='visible'
                  >
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      x='0'
                      y='0'
                      viewBox='6.133 1.14 87.849 96.92'
                    >
                      <path d='M37 55.6c-.6.6-1.2.6-1.8.6-1.9.1-3.2 1.2-3.3 3.1-.1 2.1 2.1 6 4 6.9 3.2 1.6 6.1 1.2 8.9-1.1 3-2.5 5.1-5.8 7.5-8.8 1.1-1.3 2.1-2.7 2.8-4.3 1.9-4.1 1.4-8.2.2-12.3-.6-2.2-4-3.8-6.3-3.4-.5.1-1.2.3-1.4-.3-.2-.7.6-.6 1.1-.8 2.4-.9 4.6-.7 6.5 1.8.5-2.9.3-4.9-1.8-6.8-2.7-2.6-5.9-4.3-9.3-5.8-2.2-.9-4.5-1.1-6.8-.9-2.3.2-4.6.5-6.9.5-4.4-.1-6.5-3.1-8-6.7-.2-.6-.5-1.2-.6-1.9-.3-1.6-.4-3.2 1-4.6 1.8-1.7 2-4.2 2.6-6.5.3-.9-.8-1.7-1.5-1.7-1.4.1-2.9.3-3.7 1.9-.7 1.4-.1 2.2.9 3 .6.5.8 1 .1 1.6-1.7 1.3-2.7 3-3.6 5-1.4 3.3-2.8 6.5-3.9 9.9-.9 2.7-1.1 5.4-.7 8.3.2 1.4.7 2.3 2.2 2.1 1.4-.1 1.5.9 1.6 1.8 0 .3-.1.6-.4.7-1.8.9-2.8 2.5-2.6 4.9.4 8.1 0 16.3 3.5 24 1.4 3.2 1.9 6.9 4.3 9.7 1.6 2 3.5 3.8 5.3 5.5 2.1 2 3.7 4.5 5.8 6.5 2 2 4.4 3.1 7.5 2.9-.5-1-1-1.4-1.6-1.9-1-.7-2-1.4-2.1-2.7-.1-.5-.3-1.1.5-1.3.7-.2 1 .3 1.1.8.5 1.8 2 2.8 3.4 3.7.4.3.9.5 1.3.3 1.7-.8 3.4-1.7 5.1-2.6.7-.4.5-.9-.1-1.4-1.3-.7-2.8-1.3-3.8-2.5-.4-.4-1.1-.9-.6-1.5.6-.7 1.1 0 1.6.4 1.1.9 2.3 1.7 3.4 2.6.9.7 1.3.3 1.8-.5 1.3-1.7 1-3.5.2-5.2-.2-.5-.6-.9-1.2-1-.5-.1-1.3.1-1-.8.2-.8 1-1.1 1.7-.7 1.7.8 2.4 2.3 2.6 4 .5 3.9-1.9 6.5-4.8 8.3-1.9 1.3-4.2 2.2-6.4 3.1-3.6 1.5-6.4-.2-9.2-2.2-1.3-.9-2.1-2.2-3.1-3.4-1.1-1.4-2.6-2.5-3.6-4-1.2-1.7-2.3-1.5-3.2-.2-2.5 3.4-5.3 2.8-8.5 1.1-2-1.1-4.1-1.7-5.7-3.5-2.8-3-2.1-5.1-.2-8 1.7-2.6 3.5-5.1 5.6-7.4.6-.7.9-1.4.7-2.3-1.7-6.3-1.2-12.7-1.8-19.1-.2-1.9.5-3.5 1.4-5.1.5-1 1.2-1.9-.7-2.2-.9-.1-1.2-1-1.4-1.9-.7-3.2-.3-6.3.8-9.3 2-4.9 3.3-10.4 6.6-15 .5-.7-.1-1.2-.3-1.8C17.6 5 18 3 19.9 2c2.8-1.5 5.7-1 6.9 1.2.8 1.4-.1 2.6-.5 3.7-.7 1.9-1.1 4-2.5 5.6-.3.4-.4 1-.5 1.5-.4 2.9 2.9 7.9 5.8 8.4 1.9.4 3.8.3 5.7 0 2.9-.3 5.8-.5 8.7.1 2.5.6 4.5 2 6.7 3.1 1.3.6 2.6 1.4 3.6 2.5.5.6 1.2.5 1.8.4 2.5-.2 4.9.2 7.2 1.5 2.1 1.2 3.2 3.3 2.8 5.6-.1.8-.2 1.5-.4 2.3-.1.5.3 1.5-.7 1.3-.5-.1-1.1-1-.8-1.8.3-.9.6-1.8.4-2.8-.3-2.7-4.7-5.5-7.3-4.6-.4.1-.7.3-.4.7 1.6 2.1.7 4.3.5 6.5-.2 2 .2 2.5 2.2 2.3 1.2-.1 2.3.3 3.5.4 2.6.3 4.6 1.7 6.7 3.1.5.3 1 .8 1.5.9 4.8 1.1 6.8 5.1 9.2 8.7.8 1.3 1.5 1.7 3 1.3 1.6-.4 3.1-.9 4.4-1.8 1.2-.8 1.7-1.8 1-3.3-.7-1.4-.9-3.1-1.2-4.6-.6-3 1.3-4.8 3.1-6.6.4-.4 1.2-.5 1.3.4.3 3.1 1.8 5.8 2.3 8.8.1.8.2 1.5-.3 2.2-1.8 3-4.2 5.5-6.8 7.9-1.3 1.2-3.1 1.3-4.7 2.1-1 .5-1.5 1.1-1.6 2.1-.4 3.2-.7 6.5-1.2 9.7-.5 2.9-1.3 5.8-2.7 8.5-2.3 4.5-5 8.8-8.4 12.5-2.4 2.6-5 4.9-8.5 6-1.9.6-3.8.1-5.4-.9-2.7-1.6-4.4-4-5.1-7.2-.1-.5-.2-1 .3-1.2.6-.3.8.3 1 .7.2.3.3.7.3 1 .5 3.2 2.9 4.7 5.5 5.8 2.7 1.1 5.2 0 7.1-1.7 5.9-4.9 10.4-11 12.6-18.4 1.7-5.6 2.7-11.4 2.6-17.4 0-3.5-1.7-6.3-4-8.7-4.3-4.7-10.1-6.6-16-8.2-.8-.2-1.3.1-1.3 1 0 1.4-.1 2.8.1 4.1.7 3.3-.8 5.8-2.6 8.2-2.1 3-4.3 6-6.7 8.7-2.6 2.9-5.6 5.6-10.1 5.2-2.5-.2-6.5-2.4-7-5.7-.3-1.5-1.1-2.9-1-4.5.1-2.1 1.6-2.9 3.1-3.7 1.7-.7 2.8.1 3.9.7zM15.9 82.2c.9.5 1.8.9 2.9.6 1.7-.6 2.5-2.1 3.7-3.2.5-.5-.2-.7-.5-.9-1.4-1.6-2.7-3.1-3.5-5.1-1-2.6-2.5-5.1-2.8-8-.1-1.2-.6-1.2-1.5-.4-2.3 2.2-4.2 4.7-5.7 7.4-.9 1.8-1.6 3.8.4 5.6.2-.4.4-.8.6-1.1.4-.5.5-1.7 1.4-1.3 1 .5.1 1.2-.3 1.9-.7 1.3-.4 2.3.9 2.9 1.4.6 2.8 1.1 4.1 1.6h.3zM87 54.4c-1.6.7-3.2 1.3-4.9 1.3-1 0-.9.8-.8 1.4 0 .4.1.8.6.6 1.8-1 3.9-1.4 5.1-3.3z' />
                      <path d='M33 28.5c2.6 0 3.6 1.3 2.3 3.3-1.8 2.6-4.3 4.5-7.6 5-.5.1-1.1.1-1.5-.4-.2-.3-.1-.6.1-.8.5-.4 1-.3 1.5 0 .4.2.7.2 1 0 1.7-.9 3.4-1.7 4.8-3.1.6-.6.8-1.4.6-1.9-.3-.7-1.2-.2-1.8-.3-1-.1-.8.6-.9 1.1-.5 2.5-1.7 3.6-4 3.5-1.2 0-1.9-.5-1.5-1.9.8-3 3.1-4.5 7-4.5zM22.1 46.5c-1-1-1.6-2.3-2.9-3-.5-.3-1-1.7.4-2.2.7-.2.3-.7.3-1-.3-.8 0-1.7 0-2.5s.5-.9 1.1-.5c.5.3.9 1.3 1.4 0h.3c-.1 1.7 1.7 1 2.3 1.8.1.1-.1.6-.2.8-1.2 1.5-.6 2.9.2 4.2.2.4.4.9.5 1.3 0 .1-.2.5-.4.5-.3.1-.5-.2-.4-.4.3-.9-.8-.9-1-1.5-.2-.5-.5-.6-1-.4-.4.2-.7.6-.6 1.2 0 .5.7.9 0 1.7zM15.8 82.2c-.1-.9-.3-1.9-.3-2.8 0-.7.4-1.2 1-1.1.6.1.5.6.4 1.1-.2 1-.3 2-1 2.7l-.1.1z' />
                    </svg>
                  </svg>
                </g>
                <g transform='translate(-12.365 70.099)'>
                  <path d='M-3.5 -3.5H178.23V28.79H-3.5z' />
                  <rect x='-3.5' y='-3.5' />
                </g>
                <path
                  d='M5.27.07q-1.16 0-1.83-.68-.66-.69-.66-1.84V-21.9q.29-.07.92-.18.63-.1 1.24-.1 1.3 0 1.91.46.62.47.62 1.74v16.19h9.27q.18.29.36.78.18.48.18 1.06 0 .98-.45 1.5t-1.25.52H5.27zm15.47-1.95v-15.07q.29-.08.85-.18.56-.11 1.21-.11 1.3 0 1.89.47.6.47.6 1.66V-.04q-.29.08-.85.18-.56.11-1.21.11-1.3 0-1.89-.47-.6-.47-.6-1.66zm-.36-20.3q0-1.05.74-1.79t1.89-.74q1.16 0 1.88.74t.72 1.79q0 1.08-.72 1.82t-1.88.74q-1.15 0-1.89-.74t-.74-1.82zM34.67-.04q-.33.08-.87.18-.54.11-1.23.11-1.26 0-1.87-.47-.62-.47-.62-1.66v-21.57q.29-.11.85-.2.56-.09 1.25-.09 1.26 0 1.87.47.62.47.62 1.66v11.19l6.99-6.97q1.37 0 2.2.62.83.61.83 1.55 0 .83-.52 1.44t-1.64 1.55l-3.9 3.39 6.89 6.46q-.14 1.26-.75 1.97-.62.7-1.77.7-.83 0-1.46-.4T40-1.52l-5.33-5.91v7.39zm27.34-7.9L51.98-6.49q.5 1.84 1.88 2.67 1.37.83 3.39.83 1.51 0 2.79-.45 1.28-.46 2.08-.96.5.29.83.79.32.51.32 1.08 0 .73-.49 1.29-.48.55-1.33.95-.85.4-2 .61-1.16.22-2.49.22-2.13 0-3.88-.58-1.75-.57-2.99-1.75-1.25-1.17-1.95-2.9-.71-1.73-.71-4.04 0-2.24.69-3.9.69-1.65 1.86-2.77 1.17-1.12 2.72-1.66 1.55-.54 3.28-.54 1.77 0 3.25.56t2.53 1.55q1.04.99 1.64 2.38.59 1.39.59 3.01 0 1.01-.52 1.51-.52.51-1.46.65zm-6.03-6.24q-1.76 0-2.95 1.18-1.19 1.17-1.34 3.33l8.01-1.19q-.14-1.33-1.05-2.32-.9-1-2.67-1zm16.13 1.23V-.04q-.33.08-.87.18-.54.11-1.22.11-1.27 0-1.88-.47-.61-.47-.61-1.66v-11.43q0-.94.43-1.59.43-.65 1.26-1.15 1.12-.69 2.76-1.12 1.64-.43 3.56-.43 3.42 0 3.42 2.13 0 .5-.16.95-.16.45-.34.74-.83-.18-2.06-.18-1.26 0-2.38.29-1.12.29-1.91.72zm6.35 10.71q0-1.19.74-2t2.03-.81q1.27 0 2.01.81.74.81.74 2 0 1.16-.74 1.97t-2.01.81q-1.29 0-2.03-.81-.74-.81-.74-1.97zm15.36-1.04q2.1 0 3.07-.81.97-.82.97-2.04 0-1.12-.75-1.79-.76-.67-2.31-1.13l-2.31-.73q-1.37-.43-2.49-.97t-1.91-1.28q-.8-.74-1.23-1.73-.43-.99-.43-2.36 0-2.93 2.2-4.64 2.2-1.71 6.02-1.71 1.52 0 2.8.23 1.28.24 2.22.65.94.42 1.46 1.03.52.61.52 1.37 0 .72-.34 1.24-.34.53-.85.85-.86-.61-2.29-1.06-1.42-.45-3.12-.45-1.88 0-2.85.66-.97.67-.97 1.83 0 .93.66 1.44.67.5 2.11.97l2.06.65q3.14.94 4.87 2.56 1.73 1.63 1.73 4.4 0 1.48-.58 2.71-.57 1.23-1.67 2.11-1.1.88-2.74 1.37-1.65.49-3.74.49-1.66 0-3.05-.29t-2.4-.78q-1.01-.48-1.56-1.15-.56-.67-.56-1.46 0-.83.48-1.43.49-.59 1.14-.88.9.79 2.38 1.46 1.48.67 3.46.67zm29.44-5.27q0 2.09-.63 3.77-.63 1.68-1.79 2.87-1.15 1.19-2.78 1.82-1.62.63-3.64.63t-3.64-.63q-1.63-.63-2.78-1.8-1.15-1.18-1.79-2.85-.63-1.68-.63-3.81 0-2.09.63-3.77.64-1.68 1.81-2.85 1.17-1.17 2.79-1.8 1.63-.63 3.61-.63t3.61.63q1.62.63 2.79 1.82 1.18 1.19 1.81 2.87.63 1.67.63 3.73zM114.42-14q-1.95 0-3.07 1.43-1.11 1.42-1.11 4.02 0 2.63 1.1 4.04 1.1 1.41 3.08 1.41t3.09-1.43q1.1-1.42 1.1-4.02 0-2.6-1.12-4.02-1.12-1.43-3.07-1.43zm21.39.04q-1.08 0-2 .36-.92.36-1.59 1.05-.66.68-1.06 1.69-.4 1.01-.4 2.35 0 2.67 1.41 4.02 1.41 1.35 3.64 1.35 1.26 0 2.18-.34.92-.34 1.65-.74.5.36.81.83.3.47.3 1.08 0 1.23-1.44 2.02-1.44.8-3.9.8-2.05 0-3.76-.56-1.72-.56-2.94-1.7-1.23-1.14-1.9-2.83-.67-1.7-.67-3.93 0-2.28.73-3.99.72-1.71 1.96-2.85 1.25-1.13 2.91-1.69 1.65-.56 3.53-.56 2.42 0 3.86.84 1.44.85 1.44 2.08 0 .58-.3 1.04-.31.47-.71.76-.72-.39-1.6-.74-.89-.34-2.15-.34zm8.8 12.08v-15.07q.29-.08.85-.18.56-.11 1.21-.11 1.3 0 1.89.47.6.47.6 1.66V-.04q-.29.08-.85.18-.56.11-1.21.11-1.3 0-1.89-.47-.6-.47-.6-1.66zm-.36-20.3q0-1.05.74-1.79t1.9-.74q1.15 0 1.87.74.72.74.72 1.79 0 1.08-.72 1.82t-1.87.74q-1.16 0-1.9-.74t-.74-1.82zm16.38 19.26q1.05 0 1.91-.2.87-.2 1.26-.49v-4l-3.5.32q-1.44.15-2.2.63-.75.49-.75 1.54 0 1.04.77 1.62.78.58 2.51.58zm-.15-14.68q3.54 0 5.65 1.51 2.11 1.52 2.11 4.69v8.33q0 .87-.43 1.37-.44.51-1.08.91-1.01.61-2.57.97-1.55.36-3.53.36-3.61 0-5.68-1.39-2.08-1.39-2.08-4.16 0-2.42 1.54-3.7 1.53-1.28 4.45-1.57l4.94-.51v-.64q0-1.38-.99-2.02-.99-.65-2.79-.65-1.41 0-2.75.34-1.33.34-2.38.85-.39-.29-.66-.78-.27-.49-.27-1.06 0-.72.34-1.18.34-.45 1.1-.81 1.04-.43 2.38-.65 1.33-.21 2.7-.21zM177.51-.04q-.29.08-.85.18-.56.11-1.21.11-1.29 0-1.89-.47-.59-.47-.59-1.66v-21.57q.28-.11.84-.2.56-.09 1.21-.09 1.3 0 1.9.47.59.47.59 1.66V-.04z'
                  data-gra='path-name'
                  transform='translate(-12.365 70.099) translate(-2.78 24.71)'
                  className='0'
                />
              </mask>
              <g fill='#21004B' className='0'>
                <g
                  mask='url(#e2182ae3-c428-45ec-a7cb-d25e2bfeb4ae)'
                  transform='translate(82.635 42.256) translate(12.365)'
                >
                  <path
                    fillOpacity='0'
                    strokeWidth='2'
                    d='M0 0H150V165.488H0z'
                    className='image-rect'
                  />
                  <svg
                    width='150'
                    height='165.488'
                    className='image-svg-svg primary'
                    filter='url(#colors6729668187)'
                    overflow='visible'
                  >
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      x='0'
                      y='0'
                      viewBox='6.133 1.14 87.849 96.92'
                    >
                      <path d='M37 55.6c-.6.6-1.2.6-1.8.6-1.9.1-3.2 1.2-3.3 3.1-.1 2.1 2.1 6 4 6.9 3.2 1.6 6.1 1.2 8.9-1.1 3-2.5 5.1-5.8 7.5-8.8 1.1-1.3 2.1-2.7 2.8-4.3 1.9-4.1 1.4-8.2.2-12.3-.6-2.2-4-3.8-6.3-3.4-.5.1-1.2.3-1.4-.3-.2-.7.6-.6 1.1-.8 2.4-.9 4.6-.7 6.5 1.8.5-2.9.3-4.9-1.8-6.8-2.7-2.6-5.9-4.3-9.3-5.8-2.2-.9-4.5-1.1-6.8-.9-2.3.2-4.6.5-6.9.5-4.4-.1-6.5-3.1-8-6.7-.2-.6-.5-1.2-.6-1.9-.3-1.6-.4-3.2 1-4.6 1.8-1.7 2-4.2 2.6-6.5.3-.9-.8-1.7-1.5-1.7-1.4.1-2.9.3-3.7 1.9-.7 1.4-.1 2.2.9 3 .6.5.8 1 .1 1.6-1.7 1.3-2.7 3-3.6 5-1.4 3.3-2.8 6.5-3.9 9.9-.9 2.7-1.1 5.4-.7 8.3.2 1.4.7 2.3 2.2 2.1 1.4-.1 1.5.9 1.6 1.8 0 .3-.1.6-.4.7-1.8.9-2.8 2.5-2.6 4.9.4 8.1 0 16.3 3.5 24 1.4 3.2 1.9 6.9 4.3 9.7 1.6 2 3.5 3.8 5.3 5.5 2.1 2 3.7 4.5 5.8 6.5 2 2 4.4 3.1 7.5 2.9-.5-1-1-1.4-1.6-1.9-1-.7-2-1.4-2.1-2.7-.1-.5-.3-1.1.5-1.3.7-.2 1 .3 1.1.8.5 1.8 2 2.8 3.4 3.7.4.3.9.5 1.3.3 1.7-.8 3.4-1.7 5.1-2.6.7-.4.5-.9-.1-1.4-1.3-.7-2.8-1.3-3.8-2.5-.4-.4-1.1-.9-.6-1.5.6-.7 1.1 0 1.6.4 1.1.9 2.3 1.7 3.4 2.6.9.7 1.3.3 1.8-.5 1.3-1.7 1-3.5.2-5.2-.2-.5-.6-.9-1.2-1-.5-.1-1.3.1-1-.8.2-.8 1-1.1 1.7-.7 1.7.8 2.4 2.3 2.6 4 .5 3.9-1.9 6.5-4.8 8.3-1.9 1.3-4.2 2.2-6.4 3.1-3.6 1.5-6.4-.2-9.2-2.2-1.3-.9-2.1-2.2-3.1-3.4-1.1-1.4-2.6-2.5-3.6-4-1.2-1.7-2.3-1.5-3.2-.2-2.5 3.4-5.3 2.8-8.5 1.1-2-1.1-4.1-1.7-5.7-3.5-2.8-3-2.1-5.1-.2-8 1.7-2.6 3.5-5.1 5.6-7.4.6-.7.9-1.4.7-2.3-1.7-6.3-1.2-12.7-1.8-19.1-.2-1.9.5-3.5 1.4-5.1.5-1 1.2-1.9-.7-2.2-.9-.1-1.2-1-1.4-1.9-.7-3.2-.3-6.3.8-9.3 2-4.9 3.3-10.4 6.6-15 .5-.7-.1-1.2-.3-1.8C17.6 5 18 3 19.9 2c2.8-1.5 5.7-1 6.9 1.2.8 1.4-.1 2.6-.5 3.7-.7 1.9-1.1 4-2.5 5.6-.3.4-.4 1-.5 1.5-.4 2.9 2.9 7.9 5.8 8.4 1.9.4 3.8.3 5.7 0 2.9-.3 5.8-.5 8.7.1 2.5.6 4.5 2 6.7 3.1 1.3.6 2.6 1.4 3.6 2.5.5.6 1.2.5 1.8.4 2.5-.2 4.9.2 7.2 1.5 2.1 1.2 3.2 3.3 2.8 5.6-.1.8-.2 1.5-.4 2.3-.1.5.3 1.5-.7 1.3-.5-.1-1.1-1-.8-1.8.3-.9.6-1.8.4-2.8-.3-2.7-4.7-5.5-7.3-4.6-.4.1-.7.3-.4.7 1.6 2.1.7 4.3.5 6.5-.2 2 .2 2.5 2.2 2.3 1.2-.1 2.3.3 3.5.4 2.6.3 4.6 1.7 6.7 3.1.5.3 1 .8 1.5.9 4.8 1.1 6.8 5.1 9.2 8.7.8 1.3 1.5 1.7 3 1.3 1.6-.4 3.1-.9 4.4-1.8 1.2-.8 1.7-1.8 1-3.3-.7-1.4-.9-3.1-1.2-4.6-.6-3 1.3-4.8 3.1-6.6.4-.4 1.2-.5 1.3.4.3 3.1 1.8 5.8 2.3 8.8.1.8.2 1.5-.3 2.2-1.8 3-4.2 5.5-6.8 7.9-1.3 1.2-3.1 1.3-4.7 2.1-1 .5-1.5 1.1-1.6 2.1-.4 3.2-.7 6.5-1.2 9.7-.5 2.9-1.3 5.8-2.7 8.5-2.3 4.5-5 8.8-8.4 12.5-2.4 2.6-5 4.9-8.5 6-1.9.6-3.8.1-5.4-.9-2.7-1.6-4.4-4-5.1-7.2-.1-.5-.2-1 .3-1.2.6-.3.8.3 1 .7.2.3.3.7.3 1 .5 3.2 2.9 4.7 5.5 5.8 2.7 1.1 5.2 0 7.1-1.7 5.9-4.9 10.4-11 12.6-18.4 1.7-5.6 2.7-11.4 2.6-17.4 0-3.5-1.7-6.3-4-8.7-4.3-4.7-10.1-6.6-16-8.2-.8-.2-1.3.1-1.3 1 0 1.4-.1 2.8.1 4.1.7 3.3-.8 5.8-2.6 8.2-2.1 3-4.3 6-6.7 8.7-2.6 2.9-5.6 5.6-10.1 5.2-2.5-.2-6.5-2.4-7-5.7-.3-1.5-1.1-2.9-1-4.5.1-2.1 1.6-2.9 3.1-3.7 1.7-.7 2.8.1 3.9.7zM15.9 82.2c.9.5 1.8.9 2.9.6 1.7-.6 2.5-2.1 3.7-3.2.5-.5-.2-.7-.5-.9-1.4-1.6-2.7-3.1-3.5-5.1-1-2.6-2.5-5.1-2.8-8-.1-1.2-.6-1.2-1.5-.4-2.3 2.2-4.2 4.7-5.7 7.4-.9 1.8-1.6 3.8.4 5.6.2-.4.4-.8.6-1.1.4-.5.5-1.7 1.4-1.3 1 .5.1 1.2-.3 1.9-.7 1.3-.4 2.3.9 2.9 1.4.6 2.8 1.1 4.1 1.6h.3zM87 54.4c-1.6.7-3.2 1.3-4.9 1.3-1 0-.9.8-.8 1.4 0 .4.1.8.6.6 1.8-1 3.9-1.4 5.1-3.3z' />
                      <path d='M33 28.5c2.6 0 3.6 1.3 2.3 3.3-1.8 2.6-4.3 4.5-7.6 5-.5.1-1.1.1-1.5-.4-.2-.3-.1-.6.1-.8.5-.4 1-.3 1.5 0 .4.2.7.2 1 0 1.7-.9 3.4-1.7 4.8-3.1.6-.6.8-1.4.6-1.9-.3-.7-1.2-.2-1.8-.3-1-.1-.8.6-.9 1.1-.5 2.5-1.7 3.6-4 3.5-1.2 0-1.9-.5-1.5-1.9.8-3 3.1-4.5 7-4.5zM22.1 46.5c-1-1-1.6-2.3-2.9-3-.5-.3-1-1.7.4-2.2.7-.2.3-.7.3-1-.3-.8 0-1.7 0-2.5s.5-.9 1.1-.5c.5.3.9 1.3 1.4 0h.3c-.1 1.7 1.7 1 2.3 1.8.1.1-.1.6-.2.8-1.2 1.5-.6 2.9.2 4.2.2.4.4.9.5 1.3 0 .1-.2.5-.4.5-.3.1-.5-.2-.4-.4.3-.9-.8-.9-1-1.5-.2-.5-.5-.6-1-.4-.4.2-.7.6-.6 1.2 0 .5.7.9 0 1.7zM15.8 82.2c-.1-.9-.3-1.9-.3-2.8 0-.7.4-1.2 1-1.1.6.1.5.6.4 1.1-.2 1-.3 2-1 2.7l-.1.1z' />
                    </svg>
                  </svg>
                  <defs>
                    <filter>
                      <feColorMatrix
                        className='icon-fecolormatrix'
                        values='0 0 0 0 0.73046875 0 0 0 0 0.1796875 0 0 0 0 0.1796875 0 0 0 1 0'
                      />
                    </filter>
                    <filter>
                      <feColorMatrix
                        className='icon-fecolormatrix'
                        values='0 0 0 0 0.99609375 0 0 0 0 0.99609375 0 0 0 0 0.99609375 0 0 0 1 0'
                      />
                    </filter>
                    <linearGradient
                      id='osKZS1rGy_vpBELEQxePd'
                      x1='0'
                      x2='0'
                      y1='1'
                      y2='0'
                    >
                      <stop offset='0' stopColor='#5f71bd' />
                      <stop offset='1' stopColor='#9b23ea' />
                    </linearGradient>
                  </defs>
                  <path
                    fill='url(#osKZS1rGy_vpBELEQxePd)'
                    d='M0 0H162V177.488H0z'
                    pointerEvents='none'
                    transform='translate(-6 -6)'
                  />
                </g>
                <path
                  d='M2.49 24.78q-1.16 0-1.83-.68Q0 23.41 0 22.26V2.81q.29-.07.92-.18.63-.1 1.24-.1 1.3 0 1.91.46.62.47.62 1.74v16.19h9.27q.18.29.36.78.18.48.18 1.06 0 .98-.45 1.5t-1.25.52H2.49zm15.47-1.95V7.76q.29-.08.85-.18.56-.11 1.21-.11 1.3 0 1.89.47.6.47.6 1.66v15.07q-.29.08-.85.18-.56.11-1.21.11-1.3 0-1.89-.47-.6-.47-.6-1.66zm-.36-20.3q0-1.05.74-1.79T20.23 0q1.16 0 1.88.74t.72 1.79q0 1.08-.72 1.82t-1.88.74q-1.15 0-1.89-.74t-.74-1.82zm14.29 22.14q-.33.08-.87.18-.54.11-1.23.11-1.26 0-1.87-.47-.62-.47-.62-1.66V1.26q.29-.11.85-.2.56-.09 1.25-.09 1.26 0 1.87.47.62.47.62 1.66v11.19l6.99-6.97q1.37 0 2.2.62.83.61.83 1.55 0 .83-.52 1.44t-1.64 1.55l-3.9 3.39 6.89 6.46q-.14 1.26-.75 1.97-.62.7-1.77.7-.83 0-1.46-.4t-1.54-1.41l-5.33-5.91v7.39zm27.34-7.9L49.2 18.22q.5 1.84 1.88 2.67 1.37.83 3.39.83 1.51 0 2.79-.45 1.28-.46 2.08-.96.5.29.83.79.32.51.32 1.08 0 .73-.49 1.29-.48.55-1.33.95-.85.4-2 .61-1.16.22-2.49.22-2.13 0-3.88-.58-1.75-.57-2.99-1.75-1.25-1.17-1.95-2.9-.71-1.73-.71-4.04 0-2.24.69-3.9.69-1.65 1.86-2.77 1.17-1.12 2.72-1.66 1.55-.54 3.28-.54 1.77 0 3.25.56t2.53 1.55q1.04.99 1.64 2.38.59 1.39.59 3.01 0 1.01-.52 1.51-.52.51-1.46.65zm-6.03-6.24q-1.76 0-2.95 1.18-1.19 1.17-1.34 3.33l8.01-1.19q-.14-1.33-1.05-2.32-.9-1-2.67-1zm16.13 1.23v12.91q-.33.08-.87.18-.54.11-1.22.11-1.27 0-1.88-.47-.61-.47-.61-1.66V11.4q0-.94.43-1.59.43-.65 1.26-1.15 1.12-.69 2.76-1.12 1.64-.43 3.56-.43 3.42 0 3.42 2.13 0 .5-.16.95-.16.45-.34.74-.83-.18-2.06-.18-1.26 0-2.38.29-1.12.29-1.91.72zm6.35 10.71q0-1.19.74-2t2.03-.81q1.27 0 2.01.81.74.81.74 2 0 1.16-.74 1.97t-2.01.81q-1.29 0-2.03-.81-.74-.81-.74-1.97zm15.36-1.04q2.1 0 3.07-.81.97-.82.97-2.04 0-1.12-.75-1.79-.76-.67-2.31-1.13l-2.31-.73q-1.37-.43-2.49-.97t-1.91-1.28q-.8-.74-1.23-1.73-.43-.99-.43-2.36 0-2.93 2.2-4.64 2.2-1.71 6.02-1.71 1.52 0 2.8.23 1.28.24 2.22.65.94.42 1.46 1.03.52.61.52 1.37 0 .72-.34 1.24-.34.53-.85.85-.86-.61-2.29-1.06-1.42-.45-3.12-.45-1.88 0-2.85.66-.97.67-.97 1.83 0 .93.66 1.44.67.5 2.11.97l2.06.65q3.14.94 4.87 2.56 1.73 1.63 1.73 4.4 0 1.48-.58 2.71-.57 1.23-1.67 2.11-1.1.88-2.74 1.37-1.65.49-3.74.49-1.66 0-3.05-.29t-2.4-.78q-1.01-.48-1.56-1.15-.56-.67-.56-1.46 0-.83.48-1.43.49-.59 1.14-.88.9.79 2.38 1.46 1.48.67 3.46.67zm29.44-5.27q0 2.09-.63 3.77-.63 1.68-1.79 2.87-1.15 1.19-2.78 1.82-1.62.63-3.64.63t-3.64-.63q-1.63-.63-2.78-1.8-1.15-1.18-1.79-2.85-.63-1.68-.63-3.81 0-2.09.63-3.77.64-1.68 1.81-2.85 1.17-1.17 2.79-1.8 1.63-.63 3.61-.63t3.61.63q1.62.63 2.79 1.82 1.18 1.19 1.81 2.87.63 1.67.63 3.73zm-8.84-5.45q-1.95 0-3.07 1.43-1.11 1.42-1.11 4.02 0 2.63 1.1 4.04 1.1 1.41 3.08 1.41t3.09-1.43q1.1-1.42 1.1-4.02 0-2.6-1.12-4.02-1.12-1.43-3.07-1.43zm21.39.04q-1.08 0-2 .36-.92.36-1.59 1.05-.66.68-1.06 1.69-.4 1.01-.4 2.35 0 2.67 1.41 4.02 1.41 1.35 3.64 1.35 1.26 0 2.18-.34.92-.34 1.65-.74.5.36.81.83.3.47.3 1.08 0 1.23-1.44 2.02-1.44.8-3.9.8-2.05 0-3.76-.56-1.72-.56-2.94-1.7-1.23-1.14-1.9-2.83-.67-1.7-.67-3.93 0-2.28.73-3.99.72-1.71 1.96-2.85 1.25-1.13 2.91-1.69 1.65-.56 3.53-.56 2.42 0 3.86.84 1.44.85 1.44 2.08 0 .58-.3 1.04-.31.47-.71.76-.72-.39-1.6-.74-.89-.34-2.15-.34zm8.8 12.08V7.76q.29-.08.85-.18.56-.11 1.21-.11 1.3 0 1.89.47.6.47.6 1.66v15.07q-.29.08-.85.18-.56.11-1.21.11-1.3 0-1.89-.47-.6-.47-.6-1.66zm-.36-20.3q0-1.05.74-1.79t1.9-.74q1.15 0 1.87.74.72.74.72 1.79 0 1.08-.72 1.82t-1.87.74q-1.16 0-1.9-.74t-.74-1.82zm16.38 19.26q1.05 0 1.91-.2.87-.2 1.26-.49v-4l-3.5.32q-1.44.15-2.2.63-.75.49-.75 1.54 0 1.04.77 1.62.78.58 2.51.58zm-.15-14.68q3.54 0 5.65 1.51 2.11 1.52 2.11 4.69v8.33q0 .87-.43 1.37-.44.51-1.08.91-1.01.61-2.57.97-1.55.36-3.53.36-3.61 0-5.68-1.39-2.08-1.39-2.08-4.16 0-2.42 1.54-3.7 1.53-1.28 4.45-1.57l4.94-.51v-.64q0-1.38-.99-2.02-.99-.65-2.79-.65-1.41 0-2.75.34-1.33.34-2.38.85-.39-.29-.66-.78-.27-.49-.27-1.06 0-.72.34-1.18.34-.45 1.1-.81 1.04-.43 2.38-.65 1.33-.21 2.7-.21zm17.03 17.56q-.29.08-.85.18-.56.11-1.21.11-1.29 0-1.89-.47-.59-.47-.59-1.66V1.26q.28-.11.84-.2.56-.09 1.21-.09 1.3 0 1.9.47.59.47.59 1.66v21.57z'
                  data-gra='path-name'
                  transform='translate(82.635 42.256) translate(0 70.099)'
                  className='0 logo-slogn-path'
                />
              </g>
            </svg>
          </div>
          <div className='connect-button'>
            {sessionAccounts.length !== 0 ? (
              <Popover2
                enforceFocus={false}
                placement='bottom-end'
                interactionKind={'click'}
                content={<FileMenu shouldDismissPopover={false} />}
                renderTarget={({ isOpen, ref, ...p }) => (
                  // <div {...p} active={isOpen} elementRef={ref} intent={Intent.PRIMARY} text={'click'}>{sessionAccounts[0].address.slice(0, 7)}... </div>
                  <Button minimal='true' {...p} active={isOpen} elementRef={ref} intent={Intent.PRIMARY} text={`${sessionAccounts[0].address.slice(0, 11)}...`} />
                )}
              />
            ) : (
              <Button onClick={this.connect.bind(this)} text='Connect Wallet' />
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
