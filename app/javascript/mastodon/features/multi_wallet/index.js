/* eslint-disable promise/catch-or-return */
/* eslint-disable react/jsx-no-bind */
import * as React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import ImmutablePureComponent from 'react-immutable-pure-component';
import Logo from 'mastodon/components/logo';
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
import {
  changeAddress,
  changeDrawer,
  changeSigner,
  changeProfileAddress,
  initConnectMethods,
  changeNftResultModal,
  changeResultNft,
} from 'mastodon/actions/app';

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
import { Popover2 } from '@blueprintjs/popover2';
import {
  getLikerInfoByAddress,
  getSaleStatsByAddress,
  getCoinPrice,
  getCollectRankByCollecterAddress,
} from '../../utils/api/like';
import { ToastContainer, toast } from 'material-react-toastify';

const CONTAINER_ID = 'likecoin-wallet-connector';
const SESSION_KEY = 'likecoin_wallet_connector_session';
const WC_BRIGDE = 'https://bridge.walletconnect.org';

const mapStateToProps = (state) => ({
  connectMethod: state.getIn(['meta', 'connect']),
});
const mapDispatchToProps = (dispatch) => ({
  changeDrawer: (drawerParams) => dispatch(changeDrawer(drawerParams)),
  changeAddress: (address) => dispatch(changeAddress(address)),
  changeSigner: (signer) => dispatch(changeSigner(signer)),
  changeProfileAddress: (address) => dispatch(changeProfileAddress(address)),
  initConnectMethods: (methods) => dispatch(initConnectMethods(methods)),
  changeNftResultModal: (params)=> changeNftResultModal(params),
  changeResultNft:(params)=>changeResultNft(params),
});

export default
@connect(mapStateToProps, mapDispatchToProps)
@injectIntl
class LikeCoinWalletConnector extends ImmutablePureComponent {

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
    if(result.offlineSigner){
      this.props.changeSigner(result.offlineSigner);
      toast.success('錢包連接成功了，請繼續你的操作哦！');
    }
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
    }, ()=>{
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
    });
    // this.state._accountChangeListener = () => {
    //   this.handleAccountChange(methodType);
    // };
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
  getLikerProfile = async (session) => {
    if(session !== undefined) {
      let result = await getLikerInfoByAddress(session.accounts[0].address);
      this.setState({
        profile: result,
      });
    }
  };

  getSaleStats = async (session) => {
    if(session !== undefined) {
      let result = await getSaleStatsByAddress(session.accounts[0].address);
      this.setState({
        saleStats: result,
      });
    }
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
  handleWallectAccountChange = async (method)=>{
    const connection = await this.init(method);
    this.handleConnection(connection);
    this.props.changeSigner(connection.offlineSigner);
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
    this.once('account_change', this.handleWallectAccountChange);
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
  getCoinPrice = async () => {
    let result = await getCoinPrice();
    this.setState({
      coinPrice: result,
    });
  };

  componentDidMount = async () => {
    this.props.initConnectMethods({
      connect: async ()=> await this.connect.bind(this),
      disconnect: this.disconnect.bind(this),
      initIfNecessary: ()=> this.initIfNecessary.bind(this),
      initWallet: async ()=>{
        this.state._events.emit('initWallet');
      },
    });
    this.initWallet();
    this.on('initWallet', async ()=>{
      let connection = await this.initIfNecessary();
      if(connection?.offlineSigner){
        this.props.changeSigner(connection.offlineSigner);
        toast.success('錢包連接成功了，請繼續你的操作哦！');
      }
      if(this.state.sessionAccounts.length === 0 || this.state.sessionAccounts === undefined){
        this.connect();
      }
    });
  };
  initWallet = async ()=>{
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
        gasPriceStepLow: 1,
        gasPriceStepAverage: 10,
        gasPriceStepHigh: 1000,
        walletURLForStaking: '',
        initAttemptCount: 3,
        keplrMobileWCBridge: WC_BRIGDE,
        likerLandAppWCBridge: WC_BRIGDE,
        cosmostationAppWCBridge: WC_BRIGDE,
        isShowMobileWarning: true,
      },
    }, async ()=>{
      const session = await this.restoreSession();
      await this.handleConnection(session);
      let connection = await this.initIfNecessary();
      if(connection?.offlineSigner){
        this.props.changeSigner(connection.offlineSigner);
      }
      await this.setState({
        isLoading: false,
      });
      await this.getCoinPrice();
    });
  };

  copyAddress = () => {
    const { sessionAccounts } = this.state;
    const address = sessionAccounts[0].address;
    navigator.clipboard.writeText(address).then(
      () => {
        console.log('Copied!');
      },
      () => {
        console.log('Copy error');
      },
    );
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

    const FileMenu = () => (
      <Menu className='wallet-nft-list'>
        <MenuItem
          onClick={this.openWalletDrawer}
          text='Dashboard'
          icon='dashboard'
        />
        <MenuItem
          onClick={this.copyAddress}
          text='Copy Address'
          icon='hand-right'
        />
        <MenuItem onClick={this.disconnect} text='Logout' icon='log-out' />
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
        <div target='_blank' aria-current='page' class='wallet-connect-button'>
          <div class='icon'>
            <Logo />
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
                  <Button
                    minimal='true'
                    {...p}
                    active={isOpen}
                    elementRef={ref}
                    intent={Intent.PRIMARY}
                    text={`${sessionAccounts[0].address.slice(0, 11)}...`}
                  />
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
