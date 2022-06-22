import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { nanoid } from 'nanoid'

import IconButton from '../../../components/icon_button';
import ImmutablePropTypes from 'react-immutable-proptypes';
import DropdownMenuContainer from '../../../containers/dropdown_menu_container';
import { defineMessages, injectIntl } from 'react-intl';
import { me, isStaff } from '../../../initial_state';
import classNames from 'classnames';
import LikeButton from '../../../../images/likebutton/like-clap'
import LikeButtonGold from '../../../../images/likebutton/like-clap-gold'
import ISCN_dark from '../../../../images/likebutton/ISCN_dark'
import ISCN_light from '../../../../images/likebutton/ISCN_light'
import { setISCN } from '../../../actions/statuses'
import { toast } from 'material-react-toastify';
import { debounce } from 'lodash'
import storage from 'localforage'
import api from '../../../api'

const messages = defineMessages({
  delete: { id: 'status.delete', defaultMessage: 'Delete' },
  redraft: { id: 'status.redraft', defaultMessage: 'Delete & re-draft' },
  edit: { id: 'status.edit', defaultMessage: 'Edit' },
  direct: { id: 'status.direct', defaultMessage: 'Direct message @{name}' },
  mention: { id: 'status.mention', defaultMessage: 'Mention @{name}' },
  reply: { id: 'status.reply', defaultMessage: 'Reply' },
  reblog: { id: 'status.reblog', defaultMessage: 'Boost' },
  reblog_private: { id: 'status.reblog_private', defaultMessage: 'Boost with original visibility' },
  cancel_reblog_private: { id: 'status.cancel_reblog_private', defaultMessage: 'Unboost' },
  cannot_reblog: { id: 'status.cannot_reblog', defaultMessage: 'This post cannot be boosted' },
  favourite: { id: 'status.favourite', defaultMessage: 'Favourite' },
  bookmark: { id: 'status.bookmark', defaultMessage: 'Bookmark' },
  more: { id: 'status.more', defaultMessage: 'More' },
  mute: { id: 'status.mute', defaultMessage: 'Mute @{name}' },
  muteConversation: { id: 'status.mute_conversation', defaultMessage: 'Mute conversation' },
  unmuteConversation: { id: 'status.unmute_conversation', defaultMessage: 'Unmute conversation' },
  block: { id: 'status.block', defaultMessage: 'Block @{name}' },
  report: { id: 'status.report', defaultMessage: 'Report @{name}' },
  share: { id: 'status.share', defaultMessage: 'Share' },
  pin: { id: 'status.pin', defaultMessage: 'Pin on profile' },
  unpin: { id: 'status.unpin', defaultMessage: 'Unpin from profile' },
  embed: { id: 'status.embed', defaultMessage: 'Embed' },
  admin_account: { id: 'status.admin_account', defaultMessage: 'Open moderation interface for @{name}' },
  admin_status: { id: 'status.admin_status', defaultMessage: 'Open this status in the moderation interface' },
  copy: { id: 'status.copy', defaultMessage: 'Copy link to status' },
  blockDomain: { id: 'account.block_domain', defaultMessage: 'Block domain {domain}' },
  unblockDomain: { id: 'account.unblock_domain', defaultMessage: 'Unblock domain {domain}' },
  unmute: { id: 'account.unmute', defaultMessage: 'Unmute @{name}' },
  unblock: { id: 'account.unblock', defaultMessage: 'Unblock @{name}' },
});

const mapStateToProps = (state, { status }) => ({
  relationship: state.getIn(['relationships', status.getIn(['account', 'id'])]),
});

const mapDispatchToProps = dispatch => ({
  setISCN: (statusID,ISCNID) => dispatch(setISCN(statusID,ISCNID))
});
let requestLock = false

export default @connect(mapStateToProps, mapDispatchToProps)
@injectIntl
class ActionBar extends React.PureComponent {

  static contextTypes = {
    router: PropTypes.object,
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
    id: null
  }

  static propTypes = {
    status: ImmutablePropTypes.map.isRequired,
    relationship: ImmutablePropTypes.map,
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
  };

  handleReplyClick = () => {
    this.props.onReply(this.props.status);
  }

  handleReblogClick = (e) => {
    this.props.onReblog(this.props.status, e);
  }

  handleFavouriteClick = () => {
    this.props.onFavourite(this.props.status);
    if (this.props.status.get('favourited')) return
    const params = {
      tz: -(new Date().getTimezoneOffset() / 60),
      parentSuperLikeID: this.state.liker_id
    }
    if (requestLock) return
    requestLock = true
  }

  handleBookmarkClick = (e) => {
    this.props.onBookmark(this.props.status, e);
  }

  handleDeleteClick = () => {
    this.props.onDelete(this.props.status, this.context.router.history);
  }

  handleRedraftClick = () => {
    this.props.onDelete(this.props.status, this.context.router.history, true);
  }

  handleEditClick = () => {
    this.props.onEdit(this.props.status, this.context.router.history);
  }

  handleDirectClick = () => {
    this.props.onDirect(this.props.status.get('account'), this.context.router.history);
  }

  handleMentionClick = () => {
    this.props.onMention(this.props.status.get('account'), this.context.router.history);
  }

  handleMuteClick = () => {
    const { status, relationship, onMute, onUnmute } = this.props;
    const account = status.get('account');

    if (relationship && relationship.get('muting')) {
      onUnmute(account);
    } else {
      onMute(account);
    }
  }

  handleBlockClick = () => {
    const { status, relationship, onBlock, onUnblock } = this.props;
    const account = status.get('account');

    if (relationship && relationship.get('blocking')) {
      onUnblock(account);
    } else {
      onBlock(status);
    }
  }

  handleBlockDomain = () => {
    const { status, onBlockDomain } = this.props;
    const account = status.get('account');

    onBlockDomain(account.get('acct').split('@')[1]);
  }

  handleUnblockDomain = () => {
    const { status, onUnblockDomain } = this.props;
    const account = status.get('account');

    onUnblockDomain(account.get('acct').split('@')[1]);
  }

  handleConversationMuteClick = () => {
    this.props.onMuteConversation(this.props.status);
  }

  handleReport = () => {
    this.props.onReport(this.props.status);
  }

  handlePinClick = () => {
    this.props.onPin(this.props.status);
  }

  handleShare = () => {
    navigator.share({
      text: this.props.status.get('search_index'),
      url: this.props.status.get('url'),
    });
  }

  handleEmbed = () => {
    this.props.onEmbed(this.props.status);
  }

  handleCopy = () => {
    const url = this.props.status.get('url');
    const textarea = document.createElement('textarea');

    textarea.textContent = url;
    textarea.style.position = 'fixed';

    document.body.appendChild(textarea);

    try {
      textarea.select();
      document.execCommand('copy');
    } catch (e) {

    } finally {
      document.body.removeChild(textarea);
    }
  }
  handleLikeContent = () => {
    if (me === this.props.status.get('account').get('id')) {
      toast.info("鄉民，不能給自己拍手哦！");
      return
    }
    if (this.state.selfLike === 4) {
      if (!this.props.status.get('favourited')) {
        this.props.onFavourite(this.props.status);
      }
    }
    if (this.state.selfLike >= 5) {
      return
    }
    // if (me && this.state.selfLike === 4 && !this.props.status.get('favourited')) {
    //   this.props.onFavourite(this.props.status);
    // }
    this.setState({
      selfLike: this.state.selfLike + 1,
      totalLike: this.state.totalLike + 1,
      clickLike: this.state.clickLike + 1
    }, () => {
      this.sendLike()
      storage.setItem(this.props.status.get('id'), this.state)
    })
  }


  sendLike = debounce(() => {
    this.props.onLike(this.props.status, this.state.selfLike === 6 ? 5 : this.state.clickLike, location, (res) => {
      this.setState({
        clickLike: 0
      })
      if (res.data.code === 401) {
        toast.info("鄉民，請先綁定 LikeCoin Id！");
        this.setState({
          selfLike: 0,
          totalLike: this.state.totalLike - this.state.selfLike
        }, () => {
          storage.setItem(this.props.status.get('id'), this.state)
        })
      }
      if (res.data.data === 'INVALID_LIKE') {

      }
      if (res.data.data === 'CANNOT_SELF_LIKE') {
        this.setState({
          selfLike: 0,
          totalLike: this.state.totalLike - this.state.selfLike
        }, () => {
          storage.setItem(this.props.status.get('id'), this.state)
        })
      }
    })
  }, 1000)
  fetchAsBlob = url => fetch(url)
    .then(response => response.blob());

  convertBlobToBase64 = blob => new Promise((resolve, reject) => {
    const reader = new FileReader;
    reader.onerror = reject;
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.readAsDataURL(blob);
  });

  openISCN = () => {
    const { status } = this.props;
    const { ISCN_WIDGET_ORIGIN } = this.state;
    const siteurl = window.location.href
    const redirectString = encodeURIComponent(siteurl);
    const popUpWidget = `${ISCN_WIDGET_ORIGIN}/in/widget/iscn-ar?opener=1&redirect_uri=${redirectString}`;
    let popUpWindow = null

    try {
      const popUp = window.open(
        popUpWidget,
        'likePayWindow',
        'menubar=no,location=no,width=576,height=768',
      );
      if (!popUp || popUp.closed || typeof popUp.closed == 'undefined') {
        // TODO: show error in UI
        console.error('POPUP_BLOCKED');
        return;
      }

      popUpWindow = popUp
      this.setState({
        popUpWindow: popUpWindow
      })
    } catch (error) {
      console.error(error);
    }
    if (!status) return

    const likerId = status.get('account').get('liker_id') || null
    let attachmentsUrl = []
    status.get('media_attachments').map((attachment, idx) => {
      attachmentsUrl.push(attachment.get('remote_url') || attachment.get('url'))
    })
    const promises = attachmentsUrl.map(item => {
      return this.fetchAsBlob(item).then(res => {
        return this.convertBlobToBase64(res).then((data) => {
          // console.log(item.split('.')[item.split('.').length - 1])
          return {
            filename: nanoid() + '.' + item.split('.')[item.split('.').length - 1],
            mimeType: data.type,
            data: data.split(',')[1]
          }
        })
      })
    })


    Promise.allSettled(promises).then(results => {
      const files = []
      results.forEach((image, idx) => {
        if (image.status === "fulfilled") {
          files.push(image.value)
        }
      })

      const domParser = new DOMParser();

      const fragment = domParser.parseFromString(status.get('content'), 'text/html');

      let fileListHtml = ''
      files.forEach((file) => {
        fileListHtml = fileListHtml.concat(`<a style="display: block;" href="${file.filename}">${file.filename}</a>`)
      })
      const fragmentBlob = new Blob([fragment.body.innerHTML.concat(fileListHtml)], { type: "text/html" });
      this.convertBlobToBase64(fragmentBlob).then((data) => {
        files.unshift({
          filename: 'index.html',
          mimeType: 'text/html',
          data: data.split(',')[1]
        })

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
          payload: payload
        })
        try {
          const popUp = window.open(
            popUpWidget,
            'likePayWindow',
            'menubar=no,location=no,width=576,height=768',
          );
          if (!popUp || popUp.closed || typeof popUp.closed == 'undefined') {
            // TODO: show error in UI
            console.error('POPUP_BLOCKED');
            return;
          }
          // window.addEventListener('message', onPostMessageCallback, false);
        } catch (error) {
          console.error(error);
        }
      })
    })



  }
  onWidgetReady = () => {
    const { payload, popUpWindow, ISCN_WIDGET_ORIGIN } = this.state

    popUpWindow.postMessage(payload, ISCN_WIDGET_ORIGIN);
  }
  onISCNCallback = (data) => {
    this.props.setISCN(this.state.id,data.iscnId)
  }
  componentWillUnmount() {
    window.removeEventListener('message', this.onISCNmessageBind, false)
  }
  onISCNmessageBind = this.onISCNmessage.bind(this)
  onISCNmessage(event) {
    const ISCN_WIDGET_ORIGIN = 'https://like.co';

    if (event && event.data && event.origin === ISCN_WIDGET_ORIGIN && typeof event.data === 'string') {
      try {
        const { action, data } = JSON.parse(event.data);
        if (action === 'ISCN_WIDGET_READY') {
          this.onWidgetReady()
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
      id: status.get('id')
    })
    window.addEventListener('message', this.onISCNmessageBind);
    if (document.body && document.body.classList.contains('theme-mastodon-light')) {
      this.setState({
        ISCNbage: ISCN_dark
      })
    }
    const account = status.get('account');
    const id = status.get('id')
    const liker_id = account.get('liker_id')
    const url = `${location.origin}/web/statuses/${id}`
    this.setState({
      liker_id: liker_id
    })
    setTimeout(() => {
      this.props.getLikeCount(liker_id, url, (count) => {
        this.setState({
          totalLike: count.data.total
        }, () => {
          storage.setItem(id, this.state)
        })
      })

      this.props.getUserLikeCount(id, location.href, location.origin, (res) => {
        let data = {}
        try {
          data = JSON.parse(res.data.data)
          this.setState({
            selfLike: data?.count || 0
          }, () => {
            storage.setItem(id, this.state)
          })
        } catch (error) {
        }
      })
    }, 500)
  }

  render() {
    const { status, relationship, intl } = this.props;
    const {
      selfLike,
      totalLike,
      liker_id
    } = this.state

    const publicStatus = ['public', 'unlisted'].includes(status.get('visibility'));
    const pinnableStatus = ['public', 'unlisted', 'private'].includes(status.get('visibility'));
    const mutingConversation = status.get('muted');
    const account = status.get('account');
    const writtenByMe = status.getIn(['account', 'id']) === me;

    let menu = [];

    if (publicStatus) {
      menu.push({ text: intl.formatMessage(messages.copy), action: this.handleCopy });
      menu.push({ text: intl.formatMessage(messages.embed), action: this.handleEmbed });
      menu.push(null);
    }

    if (writtenByMe) {
      if (pinnableStatus) {
        menu.push({ text: intl.formatMessage(status.get('pinned') ? messages.unpin : messages.pin), action: this.handlePinClick });
        menu.push(null);
      }

      menu.push({ text: intl.formatMessage(mutingConversation ? messages.unmuteConversation : messages.muteConversation), action: this.handleConversationMuteClick });
      menu.push(null);
      // menu.push({ text: intl.formatMessage(messages.edit), action: this.handleEditClick });
      menu.push({ text: intl.formatMessage(messages.delete), action: this.handleDeleteClick });
      menu.push({ text: intl.formatMessage(messages.redraft), action: this.handleRedraftClick });
    } else {
      menu.push({ text: intl.formatMessage(messages.mention, { name: status.getIn(['account', 'username']) }), action: this.handleMentionClick });
      menu.push(null);

      if (relationship && relationship.get('muting')) {
        menu.push({ text: intl.formatMessage(messages.unmute, { name: account.get('username') }), action: this.handleMuteClick });
      } else {
        menu.push({ text: intl.formatMessage(messages.mute, { name: account.get('username') }), action: this.handleMuteClick });
      }

      if (relationship && relationship.get('blocking')) {
        menu.push({ text: intl.formatMessage(messages.unblock, { name: account.get('username') }), action: this.handleBlockClick });
      } else {
        menu.push({ text: intl.formatMessage(messages.block, { name: account.get('username') }), action: this.handleBlockClick });
      }

      menu.push({ text: intl.formatMessage(messages.report, { name: status.getIn(['account', 'username']) }), action: this.handleReport });

      if (account.get('acct') !== account.get('username')) {
        const domain = account.get('acct').split('@')[1];

        menu.push(null);

        if (relationship && relationship.get('domain_blocking')) {
          menu.push({ text: intl.formatMessage(messages.unblockDomain, { domain }), action: this.handleUnblockDomain });
        } else {
          menu.push({ text: intl.formatMessage(messages.blockDomain, { domain }), action: this.handleBlockDomain });
        }
      }

      if (isStaff) {
        menu.push(null);
        menu.push({ text: intl.formatMessage(messages.admin_account, { name: status.getIn(['account', 'username']) }), href: `/admin/accounts/${status.getIn(['account', 'id'])}` });
        menu.push({ text: intl.formatMessage(messages.admin_status), href: `/admin/accounts/${status.getIn(['account', 'id'])}/statuses?id=${status.get('id')}` });
      }
    }

    const shareButton = ('share' in navigator) && publicStatus && (
      <div className='detailed-status__button'><IconButton title={intl.formatMessage(messages.share)} icon='share-alt' onClick={this.handleShare} /></div>
    );

    let replyIcon;
    if (status.get('in_reply_to_id', null) === null) {
      replyIcon = 'reply';
    } else {
      replyIcon = 'reply-all';
    }

    const reblogPrivate = status.getIn(['account', 'id']) === me && status.get('visibility') === 'private';

    let reblogTitle;
    if (status.get('reblogged')) {
      reblogTitle = intl.formatMessage(messages.cancel_reblog_private);
    } else if (publicStatus) {
      reblogTitle = intl.formatMessage(messages.reblog);
    } else if (reblogPrivate) {
      reblogTitle = intl.formatMessage(messages.reblog_private);
    } else {
      reblogTitle = intl.formatMessage(messages.cannot_reblog);
    }

    return (
      <div className='detailed-status__action-bar'>
        <div className='detailed-status__button'><IconButton title={intl.formatMessage(messages.reply)} icon={status.get('in_reply_to_account_id') === status.getIn(['account', 'id']) ? 'reply' : replyIcon} onClick={this.handleReplyClick} /></div>
        <div className='detailed-status__button' ><IconButton className={classNames({ reblogPrivate })} disabled={!publicStatus && !reblogPrivate} active={status.get('reblogged')} title={reblogTitle} icon='retweet' onClick={this.handleReblogClick} /></div>
        <div className='detailed-status__button'><IconButton className='star-icon' animate active={status.get('favourited')} title={intl.formatMessage(messages.favourite)} icon='star' onClick={this.handleFavouriteClick} /></div>
        {publicStatus === true ? liker_id?.length > 0 ? <div className="detailed-status__button like-button animate__animated animate__fadeIn" onClick={this.handleLikeContent}>
          <img src={selfLike >= 5 ? LikeButtonGold : LikeButton} />
          <div style={selfLike >= 5 ? { color: "#ca8f04" } : null} className="count">{totalLike <= 0 ? 0 : totalLike}</div>
        </div> : null : null}
        {shareButton}
        <div className='detailed-status__button'><IconButton className='bookmark-icon' active={status.get('bookmarked')} title={intl.formatMessage(messages.bookmark)} icon='bookmark' onClick={this.handleBookmarkClick} /></div>
        {me === this.props.status.get('account').get('id') ? <div className='detailed-status__button ISCN-bage' onClick={this.openISCN}>
          {/* <img width='25px' height='25px' src={this.state.ISCNbage} /> */}
          DePub
        </div> : null}

        <div className='detailed-status__action-bar-dropdown'>
          <DropdownMenuContainer size={18} icon='ellipsis-h' status={status} items={menu} direction='left' title={intl.formatMessage(messages.more)} />
        </div>
      </div>
    );
  }

}
