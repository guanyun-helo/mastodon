import classNames from 'classnames';
import React from 'react';
import { HotKeys } from 'react-hotkeys';
import { defineMessages, injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { Redirect, Route, withRouter } from 'react-router-dom';
import PropTypes from 'prop-types';
import NotificationsContainer from './containers/notifications_container';
import LoadingBarContainer from './containers/loading_bar_container';
import ModalContainer from './containers/modal_container';
import { layoutFromWindow } from 'mastodon/is_mobile';
import { debounce } from 'lodash';
import { submitComposeDirect, uploadCompose, undoUploadCompose, resetCompose, changeComposeSpoilerness } from '../../actions/compose';
import { expandHomeTimeline } from '../../actions/timelines';
import { expandNotifications } from '../../actions/notifications';
import { fetchServer } from '../../actions/server';
import { clearHeight } from '../../actions/height_cache';
import { focusApp, unfocusApp, changeLayout, changeNftResultModal, changeResultNft, changeSigner } from 'mastodon/actions/app';
import { synchronouslySubmitMarkers, submitMarkers, fetchMarkers } from 'mastodon/actions/markers';
import { WrappedSwitch, WrappedRoute } from './util/react_router_helpers';
import BundleColumnError from './components/bundle_column_error';
import UploadArea from './components/upload_area';
import ColumnsAreaContainer from './containers/columns_area_container';
import PictureInPicture from 'mastodon/features/picture_in_picture';
import { ToastContainer } from 'material-react-toastify';
import { NftDrawer } from '../nft_profile';
import PoetSo from '../postcard/index';
import NftResult from '../nft_result/index';
// import 'material-react-toastify/dist/ReactToastify.css';
import {
  Compose,
  Status,
  GettingStarted,
  KeyboardShortcuts,
  PublicTimeline,
  CommunityTimeline,
  AccountTimeline,
  AccountGallery,
  HomeTimeline,
  Followers,
  Following,
  Reblogs,
  Favourites,
  DirectTimeline,
  HashtagTimeline,
  Notifications,
  FollowRequests,
  FavouritedStatuses,
  BookmarkedStatuses,
  FollowedTags,
  ListTimeline,
  Blocks,
  DomainBlocks,
  Mutes,
  PinnedStatuses,
  Lists,
  Directory,
  Explore,
  FollowRecommendations,
  About,
  PrivacyPolicy,
  Interests,
  WritingNft,
  WritingNftDetail,
  WritingNftIframe,
  LikerId,
} from './util/async-components';
import initialState, { me, owner, singleUserMode, showTrends, trendsAsLanding } from '../../initial_state';
import { closeOnboarding, INTRODUCTION_VERSION } from 'mastodon/actions/onboarding';
import { setISCN } from 'mastodon/actions/statuses';
import Header from './components/header';
// Dummy import, to make sure that <Status /> ends up in the application bundle.
// Without this it ends up in ~8 very commonly used bundles.
import '../../components/status';
import { changeDrawer, openMintNftDrawer } from '../../actions/app';

const messages = defineMessages({
  beforeUnload: { id: 'ui.beforeunload', defaultMessage: 'Your draft will be lost if you leave Mastodon.' },
});



const mapStateToProps = state => ({
  layout: state.getIn(['meta', 'layout']),
  isComposing: state.getIn(['compose', 'is_composing']),
  hasComposingText: state.getIn(['compose', 'text']).trim().length !== 0,
  hasMediaAttachments: state.getIn(['compose', 'media_attachments']).size > 0,
  canUploadMore: !state.getIn(['compose', 'media_attachments']).some(x => ['audio', 'video'].includes(x.get('type'))) && state.getIn(['compose', 'media_attachments']).size < 4,
  dropdownMenuIsOpen: state.getIn(['dropdown_menu', 'openId']) !== null,
  firstLaunch: state.getIn(['settings', 'introductionVersion'], 0) < INTRODUCTION_VERSION,
  username: state.getIn(['accounts', me, 'username']),
  drawerParams: state.getIn(['meta', 'drawerParams']),
  address: state.getIn(['meta', 'address']),
  profileAddress: state.getIn(['meta', 'profileAddress']),
  drawerType: state.getIn(['meta', 'drawerType']),
  isMintNftOpen: state.getIn(['meta', 'isMintNftOpen']),
  nftStatus: state.getIn(['meta', 'nftStatus']),
  signer: state.getIn(['meta', 'signer']),
  isNFTResultOpen: state.getIn(['meta', 'isNFTResultOpen']),
  nftResultData: state.getIn(['meta', 'nftResult']),
  connectMethods: state.getIn(['meta', 'connectMethods']),

});

const keyMap = {
  help: '?',
  new: 'n',
  search: 's',
  forceNew: 'option+n',
  toggleComposeSpoilers: 'option+x',
  focusColumn: ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
  reply: 'r',
  favourite: 'f',
  boost: 'b',
  mention: 'm',
  open: ['enter', 'o'],
  openProfile: 'p',
  moveDown: ['down', 'j'],
  moveUp: ['up', 'k'],
  back: 'backspace',
  goToHome: 'g h',
  goToNotifications: 'g n',
  goToLocal: 'g l',
  goToFederated: 'g t',
  goToDirect: 'g d',
  goToStart: 'g s',
  goToFavourites: 'g f',
  goToPinned: 'g p',
  goToProfile: 'g u',
  goToBlocked: 'g b',
  goToMuted: 'g m',
  goToRequests: 'g r',
  toggleHidden: 'x',
  toggleSensitive: 'h',
  openMedia: 'e',
};

class SwitchingColumnsArea extends React.PureComponent {

  static contextTypes = {
    identity: PropTypes.object,
  };

  static propTypes = {
    children: PropTypes.node,
    location: PropTypes.object,
    mobile: PropTypes.bool,
  };

  componentWillMount() {
    if (this.props.mobile) {
      document.body.classList.toggle('layout-single-column', true);
      document.body.classList.toggle('layout-multiple-columns', false);
    } else {
      document.body.classList.toggle('layout-single-column', false);
      document.body.classList.toggle('layout-multiple-columns', true);
    }
  }

  componentDidUpdate(prevProps) {
    if (![this.props.location.pathname, '/'].includes(prevProps.location.pathname)) {
      this.node.handleChildrenContentChange();
    }

    if (prevProps.mobile !== this.props.mobile) {
      document.body.classList.toggle('layout-single-column', this.props.mobile);
      document.body.classList.toggle('layout-multiple-columns', !this.props.mobile);
    }
  }

  setRef = c => {
    if (c) {
      this.node = c;
    }
  };

  render() {
    const { children, mobile } = this.props;
    const { signedIn } = this.context.identity;

    let redirect;

    if (signedIn) {
      if (mobile) {
        redirect = <Redirect from='/' to='/home' exact />;
      } else {
        redirect = <Redirect from='/' to='/getting-started' exact />;
      }
    } else if (singleUserMode && owner && initialState?.accounts[owner]) {
      redirect = <Redirect from='/' to={`/@${initialState.accounts[owner].username}`} exact />;
    } else if (showTrends && trendsAsLanding) {
      redirect = <Redirect from='/' to='/explore' exact />;
    } else {
      redirect = <Redirect from='/' to='/about' exact />;
    }

    return (
      <ColumnsAreaContainer ref={this.setRef} singleColumn={mobile}>
        <WrappedSwitch>
          {redirect}

          <WrappedRoute path='/getting-started' component={GettingStarted} content={children} />
          <WrappedRoute path='/keyboard-shortcuts' component={KeyboardShortcuts} content={children} />
          <WrappedRoute path='/about' component={About} content={children} />
          <WrappedRoute path='/privacy-policy' component={PrivacyPolicy} content={children} />

          <WrappedRoute path={['/home', '/timelines/home']} component={HomeTimeline} content={children} />
          <WrappedRoute path={['/public', '/timelines/public']} exact component={PublicTimeline} content={children} />
          <WrappedRoute path={['/public/local', '/timelines/public/local']} exact component={CommunityTimeline} content={children} />
          <WrappedRoute path={['/conversations', '/timelines/direct']} component={DirectTimeline} content={children} />
          <WrappedRoute path='/tags/:id' component={HashtagTimeline} content={children} />
          <WrappedRoute path='/lists/:id' component={ListTimeline} content={children} />
          <WrappedRoute path='/notifications' component={Notifications} content={children} />
          <WrappedRoute path='/favourites' component={FavouritedStatuses} content={children} />
          <WrappedRoute path='/interests' component={Interests} content={children} />
          <WrappedRoute path='/writingnft' component={WritingNft} content={children} />
          <WrappedRoute path='/writingnft-detail/:nftid' component={WritingNftDetail} content={children} />
          <WrappedRoute path='/writingnft-frame/:nftid' component={WritingNftIframe} content={children} />
          <WrappedRoute path='/liker-id' component={LikerId} content={children} />

          <WrappedRoute path='/bookmarks' component={BookmarkedStatuses} content={children} />
          <WrappedRoute path='/pinned' component={PinnedStatuses} content={children} />

          <WrappedRoute path='/start' component={FollowRecommendations} content={children} />
          <WrappedRoute path='/directory' component={Directory} content={children} />
          <WrappedRoute path={['/explore', '/search']} component={Explore} content={children} />
          <WrappedRoute path={['/publish', '/statuses/new']} component={Compose} content={children} />

          <WrappedRoute path={['/@:acct', '/accounts/:id']} exact component={AccountTimeline} content={children} />
          <WrappedRoute path='/@:acct/tagged/:tagged?' exact component={AccountTimeline} content={children} />
          <WrappedRoute path={['/@:acct/with_replies', '/accounts/:id/with_replies']} component={AccountTimeline} content={children} componentParams={{ withReplies: true }} />
          <WrappedRoute path={['/accounts/:id/followers', '/users/:acct/followers', '/@:acct/followers']} component={Followers} content={children} />
          <WrappedRoute path={['/accounts/:id/following', '/users/:acct/following', '/@:acct/following']} component={Following} content={children} />
          <WrappedRoute path={['/@:acct/media', '/accounts/:id/media']} component={AccountGallery} content={children} />
          <WrappedRoute path='/@:acct/:statusId' exact component={Status} content={children} />
          <WrappedRoute path='/@:acct/:statusId/reblogs' component={Reblogs} content={children} />
          <WrappedRoute path='/@:acct/:statusId/favourites' component={Favourites} content={children} />

          {/* Legacy routes, cannot be easily factored with other routes because they share a param name */}
          <WrappedRoute path='/timelines/tag/:id' component={HashtagTimeline} content={children} />
          <WrappedRoute path='/timelines/list/:id' component={ListTimeline} content={children} />
          <WrappedRoute path='/statuses/:statusId' exact component={Status} content={children} />
          <WrappedRoute path='/statuses/:statusId/reblogs' component={Reblogs} content={children} />
          <WrappedRoute path='/statuses/:statusId/favourites' component={Favourites} content={children} />

          <WrappedRoute path='/follow_requests' component={FollowRequests} content={children} />
          <WrappedRoute path='/blocks' component={Blocks} content={children} />
          <WrappedRoute path='/domain_blocks' component={DomainBlocks} content={children} />
          <WrappedRoute path='/followed_tags' component={FollowedTags} content={children} />
          <WrappedRoute path='/mutes' component={Mutes} content={children} />
          <WrappedRoute path='/lists' component={Lists} content={children} />

          <Route component={BundleColumnError} />
        </WrappedSwitch>
      </ColumnsAreaContainer>
    );
  }

}

export default @connect(mapStateToProps)
@injectIntl
@withRouter
class UI extends React.PureComponent {

  static contextTypes = {
    router: PropTypes.object.isRequired,
    identity: PropTypes.object.isRequired,
  };

  static propTypes = {
    dispatch: PropTypes.func.isRequired,
    children: PropTypes.node,
    isComposing: PropTypes.bool,
    hasComposingText: PropTypes.bool,
    hasMediaAttachments: PropTypes.bool,
    canUploadMore: PropTypes.bool,
    location: PropTypes.object,
    intl: PropTypes.object.isRequired,
    dropdownMenuIsOpen: PropTypes.bool,
    layout: PropTypes.string.isRequired,
    firstLaunch: PropTypes.bool,
    username: PropTypes.string,
    drawerParams: PropTypes.object,
    profileAddress: PropTypes.string,
    address: PropTypes.string,
    drawerType: PropTypes.string,
  };

  state = {
    draggingOver: false,
  };

  handleBeforeUnload = e => {
    const { intl, dispatch, isComposing, hasComposingText, hasMediaAttachments } = this.props;

    dispatch(synchronouslySubmitMarkers());

    if (isComposing && (hasComposingText || hasMediaAttachments)) {
      e.preventDefault();
      // Setting returnValue to any string causes confirmation dialog.
      // Many browsers no longer display this text to users,
      // but we set user-friendly message for other browsers, e.g. Edge.
      e.returnValue = intl.formatMessage(messages.beforeUnload);
    }
  };

  handleWindowFocus = () => {
    this.props.dispatch(focusApp());
    this.props.dispatch(submitMarkers({ immediate: true }));
  };

  handleWindowBlur = () => {
    this.props.dispatch(unfocusApp());
  };

  handleDragEnter = (e) => {
    e.preventDefault();

    if (!this.dragTargets) {
      this.dragTargets = [];
    }

    if (this.dragTargets.indexOf(e.target) === -1) {
      this.dragTargets.push(e.target);
    }

    if (e.dataTransfer && Array.from(e.dataTransfer.types).includes('Files') && this.props.canUploadMore && this.context.identity.signedIn) {
      this.setState({ draggingOver: true });
    }
  };

  handleDragOver = (e) => {
    if (this.dataTransferIsText(e.dataTransfer)) return false;

    e.preventDefault();
    e.stopPropagation();

    try {
      e.dataTransfer.dropEffect = 'copy';
    } catch (err) {

    }

    return false;
  };

  handleDrop = (e) => {
    if (this.dataTransferIsText(e.dataTransfer)) return;

    e.preventDefault();

    this.setState({ draggingOver: false });
    this.dragTargets = [];

    if (e.dataTransfer && e.dataTransfer.files.length >= 1 && this.props.canUploadMore && this.context.identity.signedIn) {
      this.props.dispatch(uploadCompose(e.dataTransfer.files));
    }
  };

  handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();

    this.dragTargets = this.dragTargets.filter(el => el !== e.target && this.node.contains(el));

    if (this.dragTargets.length > 0) {
      return;
    }

    this.setState({ draggingOver: false });
  };

  dataTransferIsText = (dataTransfer) => {
    return (dataTransfer && Array.from(dataTransfer.types).filter((type) => type === 'text/plain').length === 1);
  };

  closeUploadModal = () => {
    this.setState({ draggingOver: false });
  };

  handleServiceWorkerPostMessage = ({ data }) => {
    if (data.type === 'navigate') {
      this.context.router.history.push(data.path);
    } else {
      console.warn('Unknown message type:', data.type);
    }
  };

  handleLayoutChange = debounce(() => {
    this.props.dispatch(clearHeight()); // The cached heights are no longer accurate, invalidate
  }, 500, {
    trailing: true,
  });

  handleResize = () => {
    const layout = layoutFromWindow();

    if (layout !== this.props.layout) {
      this.handleLayoutChange.cancel();
      this.props.dispatch(changeLayout(layout));
    } else {
      this.handleLayoutChange();
    }
  };

  componentDidMount() {
    const { signedIn } = this.context.identity;

    window.addEventListener('focus', this.handleWindowFocus, false);
    window.addEventListener('blur', this.handleWindowBlur, false);
    window.addEventListener('beforeunload', this.handleBeforeUnload, false);
    window.addEventListener('resize', this.handleResize, { passive: true });

    document.addEventListener('dragenter', this.handleDragEnter, false);
    document.addEventListener('dragover', this.handleDragOver, false);
    document.addEventListener('drop', this.handleDrop, false);
    document.addEventListener('dragleave', this.handleDragLeave, false);
    document.addEventListener('dragend', this.handleDragEnd, false);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerPostMessage);
    }

    // On first launch, redirect to the follow recommendations page
    if (signedIn && this.props.firstLaunch) {
      this.context.router.history.replace('/start');
      this.props.dispatch(closeOnboarding());
    }

    if (signedIn) {
      this.props.dispatch(fetchMarkers());
      this.props.dispatch(expandHomeTimeline());
      this.props.dispatch(expandNotifications());

      setTimeout(() => this.props.dispatch(fetchServer()), 3000);
    }

    this.hotkeys.__mousetrap__.stopCallback = (e, element) => {
      return ['TEXTAREA', 'SELECT', 'INPUT'].includes(element.tagName);
    };
  }

  componentWillUnmount() {
    window.removeEventListener('focus', this.handleWindowFocus);
    window.removeEventListener('blur', this.handleWindowBlur);
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
    window.removeEventListener('resize', this.handleResize);

    document.removeEventListener('dragenter', this.handleDragEnter);
    document.removeEventListener('dragover', this.handleDragOver);
    document.removeEventListener('drop', this.handleDrop);
    document.removeEventListener('dragleave', this.handleDragLeave);
    document.removeEventListener('dragend', this.handleDragEnd);
  }

  setRef = c => {
    this.node = c;
  };

  handleHotkeyNew = e => {
    e.preventDefault();

    const element = this.node.querySelector('.compose-form__autosuggest-wrapper textarea');

    if (element) {
      element.focus();
    }
  };

  handleHotkeySearch = e => {
    e.preventDefault();

    const element = this.node.querySelector('.search__input');

    if (element) {
      element.focus();
    }
  };

  handleHotkeyForceNew = e => {
    this.handleHotkeyNew(e);
    this.props.dispatch(resetCompose());
  };

  handleHotkeyToggleComposeSpoilers = e => {
    e.preventDefault();
    this.props.dispatch(changeComposeSpoilerness());
  };

  handleHotkeyFocusColumn = e => {
    const index = (e.key * 1) + 1; // First child is drawer, skip that
    const column = this.node.querySelector(`.column:nth-child(${index})`);
    if (!column) return;
    const container = column.querySelector('.scrollable');

    if (container) {
      const status = container.querySelector('.focusable');

      if (status) {
        if (container.scrollTop > status.offsetTop) {
          status.scrollIntoView(true);
        }
        status.focus();
      }
    }
  };

  handleHotkeyBack = () => {
    if (window.history && window.history.state) {
      this.context.router.history.goBack();
    } else {
      this.context.router.history.push('/');
    }
  };

  setHotkeysRef = c => {
    this.hotkeys = c;
  };

  handleHotkeyToggleHelp = () => {
    if (this.props.location.pathname === '/keyboard-shortcuts') {
      this.context.router.history.goBack();
    } else {
      this.context.router.history.push('/keyboard-shortcuts');
    }
  };

  handleHotkeyGoToHome = () => {
    this.context.router.history.push('/home');
  };

  handleHotkeyGoToNotifications = () => {
    this.context.router.history.push('/notifications');
  };

  handleHotkeyGoToLocal = () => {
    this.context.router.history.push('/public/local');
  };

  handleHotkeyGoToFederated = () => {
    this.context.router.history.push('/public');
  };

  handleHotkeyGoToDirect = () => {
    this.context.router.history.push('/conversations');
  };

  handleHotkeyGoToStart = () => {
    this.context.router.history.push('/getting-started');
  };

  handleHotkeyGoToFavourites = () => {
    this.context.router.history.push('/favourites');
  };

  handleHotkeyGoToPinned = () => {
    this.context.router.history.push('/pinned');
  };

  handleHotkeyGoToProfile = () => {
    this.context.router.history.push(`/@${this.props.username}`);
  };

  handleHotkeyGoToBlocked = () => {
    this.context.router.history.push('/blocks');
  };

  handleHotkeyGoToMuted = () => {
    this.context.router.history.push('/mutes');
  };

  handleHotkeyGoToRequests = () => {
    this.context.router.history.push('/follow_requests');
  };

  onDrawerChange = (params) => {
    this.props.dispatch(changeDrawer(params));
  };

  onMintDrawerChange = (params) => {
    this.props.dispatch(openMintNftDrawer(false));
  };

  onMintNFTResultChange = (params) => {
    this.props.dispatch(changeNftResultModal(params));
  };

  changeNftResult = (params) => {
    this.props.dispatch(changeResultNft(params));
  };

  onSetISCN = (params, classId) => {
    this.props.dispatch(setISCN(params, classId));
  };

  changeSigner = (params) => {
    this.props.dispatch(changeSigner(params));
  };

  deleteUpload = async (id) => {
    this.props.dispatch(await undoUploadCompose(id))
  }
  uploadFile = async (file) =>{
    return new Promise(async (resolve,reject)=>{
      let res = await this.props.dispatch(uploadCompose(file));
      resolve(true)
    })
  }

  submitToot = (compose, blob) => {
    this.props.dispatch(submitComposeDirect(compose, blob))
  }

  render() {
    const { draggingOver } = this.state;
    const { connectMethods, nftResultData, isNFTResultOpen, address, signer, nftStatus, isMintNftOpen, dispatch, profileAddress, drawerType, drawerParams, children, isComposing, location, dropdownMenuIsOpen, layout } = this.props;
    const handlers = {
      help: this.handleHotkeyToggleHelp,
      new: this.handleHotkeyNew,
      search: this.handleHotkeySearch,
      forceNew: this.handleHotkeyForceNew,
      toggleComposeSpoilers: this.handleHotkeyToggleComposeSpoilers,
      focusColumn: this.handleHotkeyFocusColumn,
      back: this.handleHotkeyBack,
      goToHome: this.handleHotkeyGoToHome,
      goToNotifications: this.handleHotkeyGoToNotifications,
      goToLocal: this.handleHotkeyGoToLocal,
      goToFederated: this.handleHotkeyGoToFederated,
      goToDirect: this.handleHotkeyGoToDirect,
      goToStart: this.handleHotkeyGoToStart,
      goToFavourites: this.handleHotkeyGoToFavourites,
      goToPinned: this.handleHotkeyGoToPinned,
      goToProfile: this.handleHotkeyGoToProfile,
      goToBlocked: this.handleHotkeyGoToBlocked,
      goToMuted: this.handleHotkeyGoToMuted,
      goToRequests: this.handleHotkeyGoToRequests,
    };
    const tweet = {
      'media': 'https://dplsgtvuyo356.cloudfront.net/media_attachments/files/110/422/383/700/284/186/original/5643b77331166bd3.png',
      'tweet': {
        'id': '1468677317888348160',
        'text': 'I’m an alien,I’m an alien,I’m an alien,I’m an alien,I’m an alien,I’m an alien,I’m an alien,I’m an alien,I’m an alien,I’m an alien,I’m an alien,',
        'created_at': '2021-12-08T05:57:29.000Z',
        'public_metrics': {
          'retweet_count': 10701,
          'reply_count': 12575,
          'like_count': 190463,
          'quote_count': 1009,
        },
        'author_id': '44196397',
        'media': 'https://dplsgtvuyo356.cloudfront.net/media_attachments/files/110/422/383/700/284/186/original/5643b77331166bd3.png',
      },
      'data': {
        'id': '1468677317888348160',
        'text': 'I’m an alien,I’m an alien,I’m an alien,I’m an alien,I’m an alien,I’m an alien,I’m an alien,I’m an alien,I’m an alien,I’m an alien,I’m an alien,',
        'created_at': '2021-12-08T05:57:29.000Z',
        'public_metrics': {
          'retweet_count': 10701,
          'reply_count': 12575,
          'like_count': 190463,
          'quote_count': 1009,
        },
        'author_id': '44196397',
      },

      'user': {
        'id': '44196397',
        'name': 'Editor',
        'username': 'Editor',
        'profile_image_url': 'https://dplsgtvuyo356.cloudfront.net/accounts/avatars/106/282/397/367/132/067/original/c742403531f5e530.jpeg',
      },
    };
    return (
      <HotKeys keyMap={keyMap} handlers={handlers} ref={this.setHotkeysRef} attach={window} focused>
        <div className={classNames('ui', { 'is-composing': isComposing })} ref={this.setRef} style={{ pointerEvents: dropdownMenuIsOpen ? 'none' : null }}>
          <Header />
          <SwitchingColumnsArea location={location} mobile={layout === 'mobile' || layout === 'single-column'}>
            {children}
          </SwitchingColumnsArea>

          {layout !== 'mobile' && <PictureInPicture />}
          <NotificationsContainer />
          <ToastContainer
            limit={2}
            position='top-center'
            autoClose={1000}
            hideProgressBar
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
          <LoadingBarContainer className='loading-bar' />
          <ModalContainer />
          <UploadArea active={draggingOver} onClose={this.closeUploadModal} />
          <NftDrawer connectMethods={connectMethods} dispatch={dispatch} drawerType={drawerType} profileAddress={profileAddress} address={address} drawerParams={drawerParams} />
          <PoetSo submitToot={this.submitToot} deleteUpload={this.deleteUpload} uploadFile={this.uploadFile} changeSigner={this.changeSigner} connectMethods={connectMethods} setISCN={this.onSetISCN} changeNftResult={this.changeNftResult} onMintResultNFTChange={this.onMintNFTResultChange} closeNftDrawer={this.onMintDrawerChange} address={address} isOpen={isMintNftOpen} nftStatus={nftStatus} signer={signer} />
          <NftResult changeSigner={this.changeSigner} connectMethods={connectMethods} onMintResultNFTChange={this.onMintNFTResultChange} isOpen={isNFTResultOpen} nftResult={nftResultData} />
        </div>
      </HotKeys>
    );
  }

}
