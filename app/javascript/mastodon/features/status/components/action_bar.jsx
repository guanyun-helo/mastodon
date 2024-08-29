import PropTypes from 'prop-types';
import { PureComponent } from 'react';

import { defineMessages, injectIntl } from 'react-intl';

import classNames from 'classnames';

import ImmutablePropTypes from 'react-immutable-proptypes';
import { connect } from 'react-redux';

import storage from 'localforage';
import { debounce } from 'lodash';
import { toast } from 'material-react-toastify';
import { nanoid } from 'nanoid';
import { NotificationManager} from 'react-notification';

import BookmarkIcon from '@/material-icons/400-24px/bookmark-fill.svg?react';
import BookmarkBorderIcon from '@/material-icons/400-24px/bookmark.svg?react';
import MoreHorizIcon from '@/material-icons/400-24px/more_horiz.svg?react';
import PetIcon from '@/material-icons/400-24px/pet.svg?react';
import RepeatIcon from '@/material-icons/400-24px/repeat.svg?react';
import ReplyIcon from '@/material-icons/400-24px/reply.svg?react';
import ReplyAllIcon from '@/material-icons/400-24px/reply_all.svg?react';
import StarIcon from '@/material-icons/400-24px/star-fill.svg?react';
import StarBorderIcon from '@/material-icons/400-24px/star.svg?react';
import RepeatActiveIcon from '@/svg-icons/repeat_active.svg?react';
import RepeatDisabledIcon from '@/svg-icons/repeat_disabled.svg?react';
import RepeatPrivateIcon from '@/svg-icons/repeat_private.svg?react';
import RepeatPrivateActiveIcon from '@/svg-icons/repeat_private_active.svg?react';
import { identityContextPropShape, withIdentity } from 'mastodon/identity_context';
import { PERMISSION_MANAGE_USERS, PERMISSION_MANAGE_FEDERATION ,
} from 'mastodon/permissions';


import ISCN_dark from '../../../../images/likebutton/ISCN_dark';
import ISCN_light from '../../../../images/likebutton/ISCN_light';
import { IconButton } from '../../../components/icon_button';
import DropdownMenuContainer from '../../../containers/dropdown_menu_container';
import { me } from '../../../initial_state';


//like





//
const messages = defineMessages({
  delete: { id: 'status.delete', defaultMessage: 'Delete' },
  redraft: { id: 'status.redraft', defaultMessage: 'Delete & re-draft' },
  edit: { id: 'status.edit', defaultMessage: 'Edit' },
  direct: { id: 'status.direct', defaultMessage: 'Privately mention @{name}' },
  mention: { id: 'status.mention', defaultMessage: 'Mention @{name}' },
  reply: { id: 'status.reply', defaultMessage: 'Reply' },
  reblog: { id: 'status.reblog', defaultMessage: 'Boost' },
  reblog_private: { id: 'status.reblog_private', defaultMessage: 'Boost with original visibility' },
  cancel_reblog_private: { id: 'status.cancel_reblog_private', defaultMessage: 'Unboost' },
  cannot_reblog: { id: 'status.cannot_reblog', defaultMessage: 'This post cannot be boosted' },
  favourite: { id: 'status.favourite', defaultMessage: 'Favorite' },
  bookmark: { id: 'status.bookmark', defaultMessage: 'Bookmark' },
  more: { id: 'status.more', defaultMessage: 'More' },
  mute: { id: 'status.mute', defaultMessage: 'Mute @{name}' },
  muteConversation: {
    id: 'status.mute_conversation',
    defaultMessage: 'Mute conversation',
  },
  unmuteConversation: {
    id: 'status.unmute_conversation',
    defaultMessage: 'Unmute conversation',
  },
  block: { id: 'status.block', defaultMessage: 'Block @{name}' },
  report: { id: 'status.report', defaultMessage: 'Report @{name}' },
  share: { id: 'status.share', defaultMessage: 'Share' },
  pin: { id: 'status.pin', defaultMessage: 'Pin on profile' },
  unpin: { id: 'status.unpin', defaultMessage: 'Unpin from profile' },
  embed: { id: 'status.embed', defaultMessage: 'Embed' },
  admin_account: { id: 'status.admin_account', defaultMessage: 'Open moderation interface for @{name}' },
  admin_status: { id: 'status.admin_status', defaultMessage: 'Open this post in the moderation interface' },
  admin_domain: { id: 'status.admin_domain', defaultMessage: 'Open moderation interface for {domain}' },
  copy: { id: 'status.copy', defaultMessage: 'Copy link to post' },
  blockDomain: { id: 'account.block_domain', defaultMessage: 'Block domain {domain}' },
  unblockDomain: { id: 'account.unblock_domain', defaultMessage: 'Unblock domain {domain}' },
  unmute: { id: 'account.unmute', defaultMessage: 'Unmute @{name}' },
  unblock: { id: 'account.unblock', defaultMessage: 'Unblock @{name}' },
  openOriginalPage: {
    id: 'account.open_original_page',
    defaultMessage: 'Open original page',
  },
});

const mapStateToProps = (state, { status }) => ({
  relationship: state.getIn(['relationships', status.getIn(['account', 'id'])]),
  originStatus: state.getIn(['statuses', status.getIn(['account', 'id'])]),
});


let requestLock = false;

class ActionBar extends PureComponent {
  static propTypes = {
    identity: identityContextPropShape,
    status: ImmutablePropTypes.map.isRequired,
    relationship: ImmutablePropTypes.record,
    onReply: PropTypes.func.isRequired,
    onReblog: PropTypes.func.isRequired,
    onFavourite: PropTypes.func.isRequired,
    onBookmark: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    onEdit: PropTypes.func.isRequired,
    onDirect: PropTypes.func.isRequired,
    onMention: PropTypes.func.isRequired,
    onMute: PropTypes.func,
    onUnmute: PropTypes.func,
    onBlock: PropTypes.func,
    onUnblock: PropTypes.func,
    onBlockDomain: PropTypes.func,
    onUnblockDomain: PropTypes.func,
    onMuteConversation: PropTypes.func,
    onReport: PropTypes.func,
    onPin: PropTypes.func,
    onEmbed: PropTypes.func,
    intl: PropTypes.object.isRequired,
    onLike: PropTypes.func,
    onSuperlike: PropTypes.func,
    onAlert: PropTypes.func,
  };

  state = {
    selfLike: 0,
    totalLike: 0,
    liker_id: '',
    clickLike: 0,
    ISCNbage: ISCN_light,
    payload: null,
    popUpWindow: null,
    ISCN_WIDGET_ORIGIN: 'https://like.co',
    id: null,
  };

  handleReplyClick = () => {
    this.props.onReply(this.props.status);
  };

  handleReblogClick = (e) => {
    this.props.onReblog(this.props.status, e);
  };

  handleFavouriteClick = () => {
    this.props.onFavourite(this.props.status);
    if (this.props.status.get('favourited')) return;
    const params = {
      tz: -(new Date().getTimezoneOffset() / 60),
      parentSuperLikeID: this.state.liker_id,
    };
    if (requestLock) return;
    requestLock = true;
  };

  handleBookmarkClick = (e) => {
    this.props.onBookmark(this.props.status, e);
  };

  handleDeleteClick = () => {
    this.props.onDelete(this.props.status);
  };

  handleRedraftClick = () => {
    this.props.onDelete(this.props.status, true);
  };

  handleEditClick = () => {
    this.props.onEdit(this.props.status);
  };

  handleDirectClick = () => {
    this.props.onDirect(this.props.status.get('account'));
  };

  handleMentionClick = () => {
    this.props.onMention(this.props.status.get('account'));
  };

  handleMuteClick = () => {
    const { status, relationship, onMute, onUnmute } = this.props;
    const account = status.get('account');

    if (relationship && relationship.get('muting')) {
      onUnmute(account);
    } else {
      onMute(account);
    }
  };

  handleBlockClick = () => {
    const { status, relationship, onBlock, onUnblock } = this.props;
    const account = status.get('account');

    if (relationship && relationship.get('blocking')) {
      onUnblock(account);
    } else {
      onBlock(status);
    }
  };

  handleBlockDomain = () => {
    const { status, onBlockDomain } = this.props;
    const account = status.get('account');

    onBlockDomain(account);
  };

  handleUnblockDomain = () => {
    const { status, onUnblockDomain } = this.props;
    const account = status.get('account');

    onUnblockDomain(account.get('acct').split('@')[1]);
  };

  handleConversationMuteClick = () => {
    this.props.onMuteConversation(this.props.status);
  };

  handleReport = () => {
    this.props.onReport(this.props.status);
  };

  handlePinClick = () => {
    this.props.onPin(this.props.status);
  };

  handleShare = () => {
    navigator.share({
      url: this.props.status.get('url'),
    });
  };

  handleEmbed = () => {
    this.props.onEmbed(this.props.status);
  };

  handleCopy = () => {
    const url = this.props.status.get('url');
    navigator.clipboard.writeText(url);
  };
  handleLikeContent = () => {
    if (me === this.props.status.get('account').get('id')) {
      this.props.onAlert({
        title: '鄉民，不能給自己拍手哦！',
        message: '鄉民，不能給自己拍手哦！',
        type: 'info',
      });
      return;
    }
    if (this.state.selfLike === 4) {
      if (!this.props.status.get('favourited')) {
        this.props.onFavourite(this.props.status);
      }
    }
    if (this.state.selfLike >= 5) {
      return;
    }
    // if (me && this.state.selfLike === 4 && !this.props.status.get('favourited')) {
    //   this.props.onFavourite(this.props.status);
    // }
    this.setState(
      {
        selfLike: this.state.selfLike + 1,
        totalLike: this.state.totalLike + 1,
        clickLike: this.state.clickLike + 1,
      },
      () => {
        this.sendLike();
        storage.setItem(this.props.status.get('id'), this.state);
      },
    );
  };

  sendLike = debounce(() => {
    this.props.onLike(
      this.props.status,
      this.state.selfLike === 6 ? 5 : this.state.clickLike,
      location,
      (res) => {
        this.setState({
          clickLike: 0,
        });
        if (res.data.code === 401) {
          this.props.onAlert({
            title: '鄉民，請先綁定 LikeCoin Id！',
            message: '鄉民，請先綁定 LikeCoin Id！',
            type: 'info',
          });
          this.setState(
            {
              selfLike: 0,
              totalLike: this.state.totalLike - this.state.selfLike,
            },
            () => {
              storage.setItem(this.props.status.get('id'), this.state);
            },
          );
        }
        if (res.data.data === 'INVALID_LIKE') {
        }
        if (res.data.data === 'CANNOT_SELF_LIKE') {
          this.setState(
            {
              selfLike: 0,
              totalLike: this.state.totalLike - this.state.selfLike,
            },
            () => {
              storage.setItem(this.props.status.get('id'), this.state);
            },
          );
        }
      },
    );
  }, 1000);
  fetchAsBlob = (url) => fetch(url).then((response) => response.blob());

  convertBlobToBase64 = (blob) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        resolve(reader.result);
      };
      reader.readAsDataURL(blob);
    });

  openISCN = () => {

    const { status } = this.props;
    this.props.fetchStatus(Object.fromEntries(status).id, true, true);
    // this.props.changeNftStatus(status);
    // this.props.openMintNftDrawer(true);
    return;
    const { ISCN_WIDGET_ORIGIN } = this.state;
    const siteurl = window.location.href;
    const redirectString = encodeURIComponent(siteurl);
    const popUpWidget = `${ISCN_WIDGET_ORIGIN}/in/widget/iscn-ar?opener=1&mint=1&redirect_uri=${redirectString}`;
    let popUpWindow = null;

    try {
      const popUp = window.open(
        popUpWidget,
        'likePayWindow',
        'menubar=no,location=no,width=576,height=768',
      );
      if (!popUp || popUp.closed || typeof popUp.closed === 'undefined') {
        // TODO: show error in UI
        console.error('POPUP_BLOCKED');
        return;
      }

      popUpWindow = popUp;
      this.setState({
        popUpWindow: popUpWindow,
      });
    } catch (error) {
      console.error(error);
    }
    if (!status) return;

    const likerId = status.get('account').get('liker_id') || null;
    let attachmentsUrl = [];
    status.get('media_attachments').map((attachment, idx) => {
      attachmentsUrl.push(
        attachment.get('remote_url') || attachment.get('url'),
      );
    });
    const promises = attachmentsUrl.map((item) => {
      return this.fetchAsBlob(item).then((res) => {
        return this.convertBlobToBase64(res).then((data) => {
          // console.log(item.split('.')[item.split('.').length - 1])
          return {
            filename:
              nanoid() + '.' + item.split('.')[item.split('.').length - 1],
            mimeType: data.type,
            data: data.split(',')[1],
          };
        });
      });
    });

    Promise.allSettled(promises).then((results) => {
      const files = [];
      results.forEach((image, idx) => {
        if (image.status === 'fulfilled') {
          files.push(image.value);
        }
      });

      const domParser = new DOMParser();

      const fragment = domParser.parseFromString(
        status.get('content'),
        'text/html',
      );

      let fileListHtml = '';
      files.forEach((file) => {
        fileListHtml = fileListHtml.concat(
          `<a style="display: block;" href="${file.filename}">${file.filename}</a>`,
        );
      });
      const fragmentBlob = new Blob(
        [fragment.body.innerHTML.concat(fileListHtml)],
        { type: 'text/html' },
      );
      this.convertBlobToBase64(fragmentBlob).then((data) => {
        files.unshift({
          filename: 'index.html',
          mimeType: 'text/html',
          data: data.split(',')[1],
        });

        const payload = JSON.stringify({
          action: 'SUBMIT_ISCN_DATA',
          data: {
            metadata: {
              name: likerId + '-' + status.get('id'),
              tags: ['liker.social', 'depub', 'likecoin'],
              url: siteurl,
              author: likerId,
              authorDescription: likerId,
              description: fragment.body.innerText,
              type: 'article',
              license: '',
            },
            files,
          },
        });

        // popUpWindow.postMessage(payload, ISCN_WIDGET_ORIGIN);
        this.setState({
          payload: payload,
        });
        try {
          const popUp = window.open(
            popUpWidget,
            'likePayWindow',
            'menubar=no,location=no,width=576,height=768',
          );
          if (!popUp || popUp.closed || typeof popUp.closed === 'undefined') {
            // TODO: show error in UI
            console.error('POPUP_BLOCKED');
            return;
          }
          // window.addEventListener('message', onPostMessageCallback, false);
        } catch (error) {
          console.error(error);
        }
      });
    });
  };
  onWidgetReady = () => {
    const { payload, popUpWindow, ISCN_WIDGET_ORIGIN } = this.state;

    popUpWindow.postMessage(payload, ISCN_WIDGET_ORIGIN);
  };
  onISCNCallback = (data) => {
    this.props.setISCN(this.state.id, data.iscnId);
  };
  componentWillUnmount() {
    window.removeEventListener('message', this.onISCNmessageBind, false);
  }
  onISCNmessageBind = this.onISCNmessage.bind(this);
  onISCNmessage(event) {
    const ISCN_WIDGET_ORIGIN = 'https://like.co';

    if (
      event &&
      event.data &&
      event.origin === ISCN_WIDGET_ORIGIN &&
      typeof event.data === 'string'
    ) {
      try {
        const { action, data } = JSON.parse(event.data);
        if (action === 'ISCN_WIDGET_READY') {
          this.onWidgetReady();
        } else if (action === 'ARWEAVE_SUBMITTED') {
          // onArweaveCallback(data);
        } else if (action === 'ISCN_SUBMITTED') {
          this.onISCNCallback(data);
        } else {
          console.log(`Unknown event: ${action}`);
        }
      } catch (err) {
        console.error(err);
      }
    }
  }
  componentDidMount() {
    const { status } = this.props;
    this.setState({
      id: status.get('id'),
    });
    window.addEventListener('message', this.onISCNmessageBind);
    if (
      document.body &&
      document.body.classList.contains('theme-mastodon-light')
    ) {
      this.setState({
        ISCNbage: ISCN_dark,
      });
    }
    const account = status.get('account');
    const id = status.get('id');
    const liker_id = account.get('liker_id');
    const url = `${location.origin}/web/statuses/${id}`;
    this.setState({
      liker_id: liker_id || '',
    });
    setTimeout(() => {
      this.props.getLikeCount(liker_id, url, (count) => {
        this.setState(
          {
            totalLike: count.data.total,
          },
          () => {
            storage.setItem(id, this.state);
          },
        );
      });

      this.props.getUserLikeCount(id, location.href, location.origin, (res) => {
        let data = {};
        try {
          data = JSON.parse(res.data.data);
          this.setState(
            {
              selfLike: data?.count || 0,
            },
            () => {
              storage.setItem(id, this.state);
            },
          );
        } catch (error) {}
      });
    }, 500);
  }

  render() {
    const { status, relationship, intl } = this.props;
    const { signedIn, permissions } = this.props.identity;
    const { selfLike, totalLike, liker_id } = this.state;
    const publicStatus       = ['public', 'unlisted'].includes(status.get('visibility'));
    const pinnableStatus     = ['public', 'unlisted', 'private'].includes(status.get('visibility'));
    const mutingConversation = status.get('muted');
    const account = status.get('account');
    const writtenByMe = status.getIn(['account', 'id']) === me;
    const isRemote =
      status.getIn(['account', 'username']) !==
      status.getIn(['account', 'acct']);

    let menu = [];

    if (publicStatus && isRemote) {
      menu.push({ text: intl.formatMessage(messages.openOriginalPage), href: status.get('url') });
    }

    menu.push({ text: intl.formatMessage(messages.copy), action: this.handleCopy });

    if (publicStatus && 'share' in navigator) {
      menu.push({ text: intl.formatMessage(messages.share), action: this.handleShare });
    }

    if (publicStatus && (signedIn || !isRemote)) {
      menu.push({ text: intl.formatMessage(messages.embed), action: this.handleEmbed });
    }

    if (signedIn) {
      menu.push(null);

      if (writtenByMe) {
        if (pinnableStatus) {
          menu.push({ text: intl.formatMessage(status.get('pinned') ? messages.unpin : messages.pin), action: this.handlePinClick });
          menu.push(null);
        }

        menu.push({ text: intl.formatMessage(mutingConversation ? messages.unmuteConversation : messages.muteConversation), action: this.handleConversationMuteClick });
        menu.push(null);
        menu.push({ text: intl.formatMessage(messages.edit), action: this.handleEditClick });
        menu.push({ text: intl.formatMessage(messages.delete), action: this.handleDeleteClick, dangerous: true });
        menu.push({ text: intl.formatMessage(messages.redraft), action: this.handleRedraftClick, dangerous: true });
      } else {
        menu.push({ text: intl.formatMessage(messages.mention, { name: status.getIn(['account', 'username']) }), action: this.handleMentionClick });
        menu.push(null);

        if (relationship && relationship.get('muting')) {
          menu.push({ text: intl.formatMessage(messages.unmute, { name: account.get('username') }), action: this.handleMuteClick });
        } else {
          menu.push({ text: intl.formatMessage(messages.mute, { name: account.get('username') }), action: this.handleMuteClick, dangerous: true });
        }

        if (relationship && relationship.get('blocking')) {
          menu.push({ text: intl.formatMessage(messages.unblock, { name: account.get('username') }), action: this.handleBlockClick });
        } else {
          menu.push({ text: intl.formatMessage(messages.block, { name: account.get('username') }), action: this.handleBlockClick, dangerous: true });
        }

        menu.push({ text: intl.formatMessage(messages.report, { name: status.getIn(['account', 'username']) }), action: this.handleReport, dangerous: true });

        if (account.get('acct') !== account.get('username')) {
          const domain = account.get('acct').split('@')[1];

          menu.push(null);

          if (relationship && relationship.get('domain_blocking')) {
            menu.push({ text: intl.formatMessage(messages.unblockDomain, { domain }), action: this.handleUnblockDomain });
          } else {
            menu.push({ text: intl.formatMessage(messages.blockDomain, { domain }), action: this.handleBlockDomain, dangerous: true });
          }
        }

        if ((permissions & PERMISSION_MANAGE_USERS) === PERMISSION_MANAGE_USERS || (isRemote && (permissions & PERMISSION_MANAGE_FEDERATION) === PERMISSION_MANAGE_FEDERATION)) {
          menu.push(null);
          if ((permissions & PERMISSION_MANAGE_USERS) === PERMISSION_MANAGE_USERS) {
            menu.push({ text: intl.formatMessage(messages.admin_account, { name: status.getIn(['account', 'username']) }), href: `/admin/accounts/${status.getIn(['account', 'id'])}` });
            menu.push({ text: intl.formatMessage(messages.admin_status), href: `/admin/accounts/${status.getIn(['account', 'id'])}/statuses/${status.get('id')}` });
          }
          if (isRemote && (permissions & PERMISSION_MANAGE_FEDERATION) === PERMISSION_MANAGE_FEDERATION) {
            const domain = account.get('acct').split('@')[1];
            menu.push({ text: intl.formatMessage(messages.admin_domain, { domain: domain }), href: `/admin/instances/${domain}` });
          }
        }
      }
    }

    let replyIcon;
    let replyIconComponent;

    if (status.get('in_reply_to_id', null) === null) {
      replyIcon = 'reply';
      replyIconComponent = ReplyIcon;
    } else {
      replyIcon = 'reply-all';
      replyIconComponent = ReplyAllIcon;
    }

    const reblogPrivate =
      status.getIn(['account', 'id']) === me &&
      status.get('visibility') === 'private';

    let reblogTitle, reblogIconComponent;

    if (status.get('reblogged')) {
      reblogTitle = intl.formatMessage(messages.cancel_reblog_private);
      reblogIconComponent = publicStatus ? RepeatActiveIcon : RepeatPrivateActiveIcon;
    } else if (publicStatus) {
      reblogTitle = intl.formatMessage(messages.reblog);
      reblogIconComponent = RepeatIcon;
    } else if (reblogPrivate) {
      reblogTitle = intl.formatMessage(messages.reblog_private);
      reblogIconComponent = RepeatPrivateIcon;
    } else {
      reblogTitle = intl.formatMessage(messages.cannot_reblog);
      reblogIconComponent = RepeatDisabledIcon;
    }

    return (
      <div className='detailed-status__action-bar'>
        <div className='detailed-status__button'><IconButton title={intl.formatMessage(messages.reply)} icon={status.get('in_reply_to_account_id') === status.getIn(['account', 'id']) ? 'reply' : replyIcon} iconComponent={status.get('in_reply_to_account_id') === status.getIn(['account', 'id']) ? ReplyIcon : replyIconComponent}  onClick={this.handleReplyClick} /></div>
        <div className='detailed-status__button'><IconButton className={classNames({ reblogPrivate })} disabled={!publicStatus && !reblogPrivate} active={status.get('reblogged')} title={reblogTitle} icon='retweet' iconComponent={reblogIconComponent} onClick={this.handleReblogClick} /></div>
        <div className='detailed-status__button'><IconButton className='star-icon' animate active={status.get('favourited')} title={intl.formatMessage(messages.favourite)} icon='star' iconComponent={status.get('favourited') ? StarIcon : StarBorderIcon} onClick={this.handleFavouriteClick} /></div>
        {publicStatus === true && liker_id && liker_id.length > 0 && (
          <div className='detailed-status__button'>
            <IconButton
              className='status__action-bar__button catpaw-icon'
              animate
              active={selfLike >= 1}
              title={'Love'}
              iconComponent={PetIcon}
              onClick={this.handleLikeContent}
              counter={totalLike <= 0 ? 0 : totalLike}
            />
          </div>
        )}
        <div className='detailed-status__button'><IconButton className='bookmark-icon' disabled={!signedIn} active={status.get('bookmarked')} title={intl.formatMessage(messages.bookmark)} icon='bookmark' iconComponent={status.get('bookmarked') ? BookmarkIcon : BookmarkBorderIcon} onClick={this.handleBookmarkClick} /></div>

        <div className='detailed-status__action-bar-dropdown'>
          <DropdownMenuContainer icon='ellipsis-h' iconComponent={MoreHorizIcon} status={status} items={menu} direction='left' title={intl.formatMessage(messages.more)} />
        </div>
      </div>
    );
  }

}

export default connect(mapStateToProps)(withIdentity(injectIntl(ActionBar)));
