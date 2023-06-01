import React from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import PropTypes from 'prop-types';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import Button from 'mastodon/components/button';
import ImmutablePureComponent from 'react-immutable-pure-component';
import { autoPlayGif, me, domain } from 'mastodon/initial_state';
import classNames from 'classnames';
import Icon from 'mastodon/components/icon';
import IconButton from 'mastodon/components/icon_button';
import Avatar from 'mastodon/components/avatar';
import { counterRenderer } from 'mastodon/components/common_counter';
import ShortNumber from 'mastodon/components/short_number';
import { NavLink } from 'react-router-dom';
import DropdownMenuContainer from 'mastodon/containers/dropdown_menu_container';
import AccountNoteContainer from '../containers/account_note_container';
import civic from '../../../../images/likebutton/civic-liker.svg';
import api from '../../../api';
import storage from 'localforage';
import CivicLiker from '../../../../images/likebutton/support-icon.svg';
import FollowRequestNoteContainer from '../containers/follow_request_note_container';
import {
  NFT_INDEXER_LIMIT_MAX,
  signTransferNFT,
  signGrant,
  signBuyNFT,
  broadcastTx,
  getNFTCountByClassId,
  getISCNRecord,
  getNFTClassCollectionType,
  getFormattedNFTEvents,
  parseNFTMetadataURL,
  getNFTHistoryDataMap,
  populateGrantEvent,
  getUniqueAddressesFromEvent,
} from '../../multi_wallet/utils/nft';
import {
  PERMISSION_MANAGE_USERS,
  PERMISSION_MANAGE_FEDERATION,
} from 'mastodon/permissions';
import { Helmet } from 'react-helmet';
import { connect } from 'react-redux';
import {
  Intent,
  Tag,
  Callout,
  Spinner,
  Alert,
  Drawer,
  DrawerSize,
  HTMLSelect,
  InputGroup,
  Dialog,
  DialogBody,
} from '@blueprintjs/core';
import {
  getOwnerByISCN,
  getNFTbyID,
  getNFTmeta,
  getCoinPrice,
  getISCNListByOwner,
  getNFTListByOwner,
  getLikerInfoByAddress,
  getCollectRankByCollecterAddress,
  getNFTbyISCNID,
  getNFTListByOwnerAddress,
  getChainNFTIdList,
} from '../../../utils/api/like';
import Macy from 'macy';
import { LikerId } from 'mastodon/features/ui/util/async-components';

const messages = defineMessages({
  unfollow: { id: 'account.unfollow', defaultMessage: 'Unfollow' },
  follow: { id: 'account.follow', defaultMessage: 'Follow' },
  cancel_follow_request: {
    id: 'account.cancel_follow_request',
    defaultMessage: 'Withdraw follow request',
  },
  requested: {
    id: 'account.requested',
    defaultMessage: 'Awaiting approval. Click to cancel follow request',
  },
  unblock: { id: 'account.unblock', defaultMessage: 'Unblock @{name}' },
  edit_profile: { id: 'account.edit_profile', defaultMessage: 'Edit profile' },
  linkVerifiedOn: {
    id: 'account.link_verified_on',
    defaultMessage: 'Ownership of this link was checked on {date}',
  },
  account_locked: {
    id: 'account.locked_info',
    defaultMessage:
      'This account privacy status is set to locked. The owner manually reviews who can follow them.',
  },
  mention: { id: 'account.mention', defaultMessage: 'Mention @{name}' },
  direct: { id: 'account.direct', defaultMessage: 'Direct message @{name}' },
  unmute: { id: 'account.unmute', defaultMessage: 'Unmute @{name}' },
  block: { id: 'account.block', defaultMessage: 'Block @{name}' },
  mute: { id: 'account.mute', defaultMessage: 'Mute @{name}' },
  report: { id: 'account.report', defaultMessage: 'Report @{name}' },
  share: { id: 'account.share', defaultMessage: 'Share @{name}\'s profile' },
  media: { id: 'account.media', defaultMessage: 'Media' },
  blockDomain: {
    id: 'account.block_domain',
    defaultMessage: 'Block domain {domain}',
  },
  unblockDomain: {
    id: 'account.unblock_domain',
    defaultMessage: 'Unblock domain {domain}',
  },
  hideReblogs: {
    id: 'account.hide_reblogs',
    defaultMessage: 'Hide boosts from @{name}',
  },
  showReblogs: {
    id: 'account.show_reblogs',
    defaultMessage: 'Show boosts from @{name}',
  },
  enableNotifications: {
    id: 'account.enable_notifications',
    defaultMessage: 'Notify me when @{name} posts',
  },
  disableNotifications: {
    id: 'account.disable_notifications',
    defaultMessage: 'Stop notifying me when @{name} posts',
  },
  pins: { id: 'navigation_bar.pins', defaultMessage: 'Pinned posts' },
  preferences: {
    id: 'navigation_bar.preferences',
    defaultMessage: 'Preferences',
  },
  follow_requests: {
    id: 'navigation_bar.follow_requests',
    defaultMessage: 'Follow requests',
  },
  favourites: { id: 'navigation_bar.favourites', defaultMessage: 'Favourites' },
  lists: { id: 'navigation_bar.lists', defaultMessage: 'Lists' },
  followed_tags: {
    id: 'navigation_bar.followed_tags',
    defaultMessage: 'Followed hashtags',
  },
  blocks: { id: 'navigation_bar.blocks', defaultMessage: 'Blocked users' },
  domain_blocks: {
    id: 'navigation_bar.domain_blocks',
    defaultMessage: 'Blocked domains',
  },
  mutes: { id: 'navigation_bar.mutes', defaultMessage: 'Muted users' },
  endorse: { id: 'account.endorse', defaultMessage: 'Feature on profile' },
  unendorse: {
    id: 'account.unendorse',
    defaultMessage: 'Don\'t feature on profile',
  },
  add_or_remove_from_list: {
    id: 'account.add_or_remove_from_list',
    defaultMessage: 'Add or Remove from lists',
  },
  admin_account: {
    id: 'status.admin_account',
    defaultMessage: 'Open moderation interface for @{name}',
  },
  admin_domain: {
    id: 'status.admin_domain',
    defaultMessage: 'Open moderation interface for {domain}',
  },
  languages: {
    id: 'account.languages',
    defaultMessage: 'Change subscribed languages',
  },
  openOriginalPage: {
    id: 'account.open_original_page',
    defaultMessage: 'Open original page',
  },
});

const titleFromAccount = (account) => {
  const displayName = account.get('display_name');
  const acct =
    account.get('acct') === account.get('username')
      ? `${account.get('username')}@${domain}`
      : account.get('acct');
  const prefix =
    displayName.trim().length === 0 ? account.get('username') : displayName;

  return `${prefix} (@${acct})`;
};

const dateFormatOptions = {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour12: false,
  hour: '2-digit',
  minute: '2-digit',
};
const mapStateToProps = (state) => ({
  drawerParams: state.getIn(['meta', 'drawerParams']),
  address: state.getIn(['meta', 'address']),
  profileAddress: state.getIn(['meta', 'profileAddress']),
  drawerType: state.getIn(['meta', 'drawerType']),
  isMintNftOpen: state.getIn(['meta', 'isMintNftOpen']),
  nftStatus: state.getIn(['meta', 'nftStatus']),
  signer: state.getIn(['meta', 'signer']),
  isNFTResultOpen: state.getIn(['meta', 'isNFTResultOpen']),
  nftResultData: state.getIn(['meta', 'nftResult']),
});
export default
@connect(mapStateToProps)
@injectIntl
class Header extends ImmutablePureComponent {

  static contextTypes = {
    identity: PropTypes.object,
    router: PropTypes.object,
  };

  static propTypes = {
    account: ImmutablePropTypes.map,
    identity_props: ImmutablePropTypes.list,
    onFollow: PropTypes.func.isRequired,
    onBlock: PropTypes.func.isRequired,
    onMention: PropTypes.func.isRequired,
    onDirect: PropTypes.func.isRequired,
    onReblogToggle: PropTypes.func.isRequired,
    onNotifyToggle: PropTypes.func.isRequired,
    onReport: PropTypes.func.isRequired,
    onMute: PropTypes.func.isRequired,
    onBlockDomain: PropTypes.func.isRequired,
    onUnblockDomain: PropTypes.func.isRequired,
    onEndorseToggle: PropTypes.func.isRequired,
    onAddToList: PropTypes.func.isRequired,
    onEditAccountNote: PropTypes.func.isRequired,
    onChangeLanguages: PropTypes.func.isRequired,
    onInteractionModal: PropTypes.func.isRequired,
    onOpenAvatar: PropTypes.func.isRequired,
    intl: PropTypes.object.isRequired,
    domain: PropTypes.string.isRequired,
    hidden: PropTypes.bool,
  };

  state = {
    isSubscribedCivicLiker: false,
    balances: 0,
    wallet: '',
    price: {
      last_updated_at: 0,
      usd: 0,
      usd_24h_change: 0,
      usd_24h_vol: 0,
      usd_market_cap: 0,
    },
    isSendNftDrawerOpen: false,
    rawISCNList: [],
    nftList: [],
    index: 0,
    currentElementId: null,
    macy: null,
    isTXhashOpen: false,
    hashCode: '',
  };

  openEditProfile = () => {
    window.open('/settings/profile', '_blank');
  };

  isStatusesPageActive = (match, location) => {
    if (!match) {
      return false;
    }

    return !location.pathname.match(/\/(followers|following)\/?$/);
  };

  handleMouseEnter = ({ currentTarget }) => {
    if (autoPlayGif) {
      return;
    }

    const emojis = currentTarget.querySelectorAll('.custom-emoji');

    for (var i = 0; i < emojis.length; i++) {
      let emoji = emojis[i];
      emoji.src = emoji.getAttribute('data-original');
    }
  };

  handleMouseLeave = ({ currentTarget }) => {
    if (autoPlayGif) {
      return;
    }

    const emojis = currentTarget.querySelectorAll('.custom-emoji');

    for (var i = 0; i < emojis.length; i++) {
      let emoji = emojis[i];
      emoji.src = emoji.getAttribute('data-static');
    }
  };

  handleAvatarClick = (e) => {
    if (e.button === 0 && !(e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      this.props.onOpenAvatar();
    }
  };

  handleShare = () => {
    const { account } = this.props;

    navigator
      .share({
        text: `${titleFromAccount(account)}\n${account.get('note_plain')}`,
        url: account.get('url'),
      })
      .catch((e) => {
        if (e.name !== 'AbortError') console.error(e);
      });
  };

  transferNft = async (nft) => {
    const { wallet, memo, selectNftId } = this.state;
    let params = {
      fromAddress: this.props.address,
      toAddress: wallet,
      classId: nft.classId,
      nftId: selectNftId !== undefined ? selectNftId : nft.nftIds[0],
      memo: memo === undefined ? '' : memo,
      signer: this.props.signer,
    };
    const signData = await signTransferNFT(params);
    const { txHash, code } = await broadcastTx(signData, this.props.signer);
    this.setState({
      hashCode: txHash,
      isTXhashOpen: true,
      sentNft: { ...nft, txHash, code },
    });
  };

  getCoinPrice() {
    api()
      .get(
        'https://api.coingecko.com/api/v3/simple/price?ids=likecoin&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&include_last_updated_at=true',
      )
      .then((response) => {
        if (response.status === 200) {
          this.setState({
            price: response.data.likecoin,
          });
        }
      });
  }

  getDelegation(cosmosWallet) {
    // https://mainnet-node.like.co/cosmos/staking/v1beta1/delegations/cosmos1g2dpslkge0wmhgpdegeg0wq549syz8tjx48fhz
    return api().get(
      `https://api.like.co/cosmos/lcd/cosmos/staking/v1beta1/delegations/${cosmosWallet}`,
    );
  }

  getUnbonding(cosmosWallet) {
    // https://mainnet-node.like.co/cosmos/staking/v1beta1/delegators/cosmos1g2dpslkge0wmhgpdegeg0wq549syz8tjx48fhz/unbonding_delegations
    return api().get(
      `https://api.like.co/cosmos/lcd/cosmos/staking/v1beta1/delegators/${cosmosWallet}/unbonding_delegations`,
    );
  }

  getBalances(cosmosWallet) {
    return api().get(
      `https://api.like.co/cosmos/lcd/cosmos/bank/v1beta1/balances/${cosmosWallet}`,
    );
  }

  componentDidUpdate() {
    const { account } = this.props;
    if (me === account.get('id')) {
    } else {
      this.setState({
        balances: 0,
      });
    }
    if (!account) {
      return null;
    }
  }

  componentDidMount() {
    const account = this.props.account;
    let liker_id = account.get('liker_id');
    liker_id = 'guanyun';
    if (!liker_id) return;
    this.getCoinPrice();

    api()
      .get(`https://api.like.co/users/id/${liker_id}/min`)
      .then((res) => {
        if (res.data.likeWallet) {
          let balancesTotal = 0;
          let wallet = res.data.likeWallet;

          Promise.allSettled([
            this.getBalances(wallet),
            this.getDelegation(wallet),
            this.getUnbonding(wallet),
          ]).then((res) => {
            if (res[0].status === 'fulfilled') {
              balancesTotal +=
                Number(res[0].value.data.balances[0].amount) / 1000000000;
            }
            if (res[1].status === 'fulfilled') {
              let delegatedBalances = 0;
              res[1].value.data.delegation_responses.forEach((item) => {
                delegatedBalances += Number(item.balance.amount) / 1000000000;
              });
              balancesTotal += delegatedBalances;
            }
            if (res[2].status === 'fulfilled') {
              let unbondingBalances = 0;
              res[2].value.data.unbonding_responses.forEach((item) => {
                item.entries.forEach((ele) => {
                  unbondingBalances += Number(ele.balance) / 1000000000;
                });
              });
              balancesTotal += unbondingBalances;
            }
            this.setState({
              balances: balancesTotal,
              wallet: wallet,
            });
          });
        }
      });

    storage.getItem(liker_id, (err, value) => {
      if (value) {
        this.setState({
          isSubscribedCivicLiker: value,
        });
        return;
      }
      if (!value || value === null) {
        api()
          .get(`https://api.like.co/users/id/${liker_id}/min`)
          .then((res) => {
            if (res.data.isSubscribedCivicLiker) {
              this.setState(
                {
                  isSubscribedCivicLiker: res.data.isSubscribedCivicLiker,
                },
                () => {
                  storage.setItem(liker_id, true);
                },
              );
            }
          });
      }
    });
  }

  changeNftDrawer = async () => {
    this.setState(
      {
        isSendNftDrawerOpen: !this.state.isSendNftDrawerOpen,
      },
      () => {
        this.getNftList();
      },
    );
  };
  observer = () => {
    const { contentType } = this.props;
    const { nftList } = this.state;
    if (nftList.length.length === 0) return;
    const macy = Macy({
      container: '.my-nft-list', // 容器元素的选择器
      trueOrder: true,
      waitForImages: true,
      margin: 0,
      columns: 1,
      breakAt: {
        1200: 1,
        940: 1,
        520: 1,
        400: 1,
      },
    });

    this.setState(
      {
        macy: macy,
      },
      () => {
        document
          .querySelector('.my-nft-list')
          .addEventListener('scroll', () => {
            console.log('scrolled');
            // Get the position and size of the box element relative to the viewport
            let elementId = this.state.currentElementId;
            console.log('currentElementId', elementId);
            if (elementId === null) return;
            let rect = document
              .querySelector(`.${elementId}`)
              .getBoundingClientRect();
            // Check if the box element is in view
            let inView =
              rect.top >= 0 &&
              rect.left >= 0 &&
              rect.bottom <=
                (window.innerHeight || document.documentElement.clientHeight) &&
              rect.right <=
                (window.innerWidth || document.documentElement.clientWidth);

            // Change the background color of the box element if it is in view
            if (inView) {
              console.log('in view');
              if (this.state.isLoading) return;
              this.getMore(this.props.contentType);
            } else {
            }
          });
      },
    );
  };
  getDummy(value) {
    if (value === 0) {
      return {
        data: {
          owner: 'liker',
          latest_version: '2',
          records: [
            {
              ipld: 'liker',
              data: {
                '@context': {
                  '@vocab': 'http://iscn.io/',
                  contentMetadata: { '@context': null },
                  recordParentIPLD: { '@container': '@index' },
                  stakeholders: {
                    '@context': {
                      '@vocab': 'http://schema.org/',
                      contributionType: 'http://iscn.io/contributionType',
                      entity: 'http://iscn.io/entity',
                      footprint: 'http://iscn.io/footprint',
                      rewardProportion: 'http://iscn.io/rewardProportion',
                    },
                  },
                },
                '@id':
                  'iscn://likecoin-chain/2FsxYWHcJ_Es5oHt4fy2RgtVY3ZGbdZpFg9HZWqdPWk/2',
                '@type': 'Record',
                contentFingerprints: [
                  'ar://5uunbWgkdoDCj59xtNdFtqxMnFl6CKT_b4hTwhXjo7w',
                  'ipfs://QmXbbXAHnA9y4aUR5bMWKzJXpmtL7AXB6fcxJHCW3yNQ8t',
                ],
                contentMetadata: {
                  '@context': 'http://schema.org/',
                  '@type': 'Article',
                  description: '',
                  keywords: '',
                  name: '',
                  url: '',
                  usageInfo: '',
                  version: 1,
                },
                recordNotes: 'LikeCoin WordPress Plugin',
                recordParentIPLD: {
                  '/': 'baguqeerad6nbud7uo24fmz55fxzh6hwbesujwdlkpysgeftbtjeqfrwdnsmq',
                },
                recordTimestamp: '2022-12-22T15:43:42+00:00',
                recordVersion: 2,
                stakeholders: [
                  {
                    contributionType: 'http://schema.org/author',
                    entity: {
                      '@id': '',
                      description: '',
                      identifier: [
                        {
                          '@type': 'PropertyValue',
                          propertyID: 'LikeCoin Wallet',
                          value: '',
                        },
                      ],
                      name: 'leafwind',
                    },
                    rewardProportion: 1,
                  },
                ],
              },
            },
          ],
        },
      };
    } else if (value === 1) {
      return {
        data: {
          user: 'liker',
          displayName: 'liker',
          avatar: 'https://via.placeholder.com/50x50.png?text=Avatar',
          cosmosWallet: 'unknown',
          likeWallet: 'unknown',
          isSubscribedCivicLiker: true,
          civicLikerSince: 1000,
        },
      };
    } else if (value === 2) {
      return {
        data: {
          nft_meta_collection_name: 'Writing NFT',
          nft_meta_collection_id: 'likerland_writing_nft',
          nft_meta_collection_descrption: 'Writing NFT by Liker Land',
          message: 'liker',
          id: 'liker',
          image:
            'https://api.like.co/likernft/metadata/image/class_likenft1v3s5wc4hk7v9ufsp792sgvr080zta9eua3qkl7un2zu0vgv6l0xssjr54t?size=1280',
          external_url: 'liker.land',
        },
      };
    }
  }
  filterNftList = async (type) => {
    const { rawISCNList, nftList, index } = this.state;
    const { likerInfo } = this.props;
    let temISCNList = rawISCNList.slice(index, 5);
    let temNftList = [];
    for (const item of temISCNList) {
      let owner = await getOwnerByISCN(item.parent.iscn_id_prefix);
      let liker = await getLikerInfoByAddress(owner.owner);
      let result = await getNFTmeta(item.id);
      let nftDetail = await getNFTbyID(item.id);
      let nftIdResult = await getChainNFTIdList(item.id);
      let nftIds;
      if (nftIdResult.owners.length > 0) {
        nftIdResult.owners.forEach((ele) => {
          if (ele.owner === item.owner) {
            nftIds = ele.nfts;
          }
        });
      }
      console.log('nftIds', nftIds);
      if (result !== undefined) {
        temNftList.push({
          ...result,
          ...nftDetail,
          liker: liker === undefined ? this.getDummy(1) : liker,
          owner: owner,
          nftIds: nftIds !== null ? [...nftIds] : [],
        });
      }
    }
    this.setState(
      {
        nftList: [...nftList, ...temNftList],
        index: index + 5,
      },
      () => {
        this.setState(
          {
            currentElementId:
              this.state.nftList[this.state.nftList.length - 1].id,
          },
          () => {
            // this.observer();
          },
        );
      },
    );
  };
  getNftList = async () => {
    const { address } = this.props;
    let nftList = await getISCNListByOwner(address);
    this.setState(
      {
        rawISCNList: nftList.classes,
      },
      () => {
        this.filterNftList();
      },
    );
  };

  changeMemo = (e) => {
    this.setState({
      memo: e.target.value,
    });
  };

  selectNftId = (e) => {
    this.setState({
      selectedNftId: e.target.value,
    });
  };

  handleCloseTX = (e) => {
    this.setState({
      isTXhashOpen: false,
    });
  };

  tellGift = () => {
    const { sentNft } = this.state;
    this.props.onDirect(
      this.props.account,
      this.context.router.history,
      sentNft,
    );
  };

  render() {
    const { account, hidden, intl, domain } = this.props;
    const { signedIn, permissions } = this.context.identity;

    const {
      balances,
      price,
      isSendNftDrawerOpen,
      nftList,
      isTXhashOpen,
      hashCode,
    } = this.state;
    let self = false;
    if (me === account.get('id')) {
      self = true;
    } else {
      this.setState({
        balances: 0,
      });
    }
    if (!account) {
      return null;
    }

    const suspended = account.get('suspended');
    const isRemote = account.get('acct') !== account.get('username');
    const remoteDomain = isRemote ? account.get('acct').split('@')[1] : null;

    let info = [];
    let actionBtn = '';
    let bellBtn = '';
    let lockedIcon = '';
    let menu = [];

    if (
      me !== account.get('id') &&
      account.getIn(['relationship', 'followed_by'])
    ) {
      info.push(
        <span key='followed_by' className='relationship-tag'>
          <FormattedMessage
            id='account.follows_you'
            defaultMessage='Follows you'
          />
        </span>,
      );
    } else if (
      me !== account.get('id') &&
      account.getIn(['relationship', 'blocking'])
    ) {
      info.push(
        <span key='blocked' className='relationship-tag'>
          <FormattedMessage id='account.blocked' defaultMessage='Blocked' />
        </span>,
      );
    }

    if (me !== account.get('id') && account.getIn(['relationship', 'muting'])) {
      info.push(
        <span key='muted' className='relationship-tag'>
          <FormattedMessage id='account.muted' defaultMessage='Muted' />
        </span>,
      );
    } else if (
      me !== account.get('id') &&
      account.getIn(['relationship', 'domain_blocking'])
    ) {
      info.push(
        <span key='domain_blocked' className='relationship-tag'>
          <FormattedMessage
            id='account.domain_blocked'
            defaultMessage='Domain blocked'
          />
        </span>,
      );
    }

    if (
      account.getIn(['relationship', 'requested']) ||
      account.getIn(['relationship', 'following'])
    ) {
      bellBtn = (
        <IconButton
          icon={
            account.getIn(['relationship', 'notifying']) ? 'bell' : 'bell-o'
          }
          size={24}
          active={account.getIn(['relationship', 'notifying'])}
          title={intl.formatMessage(
            account.getIn(['relationship', 'notifying'])
              ? messages.disableNotifications
              : messages.enableNotifications,
            { name: account.get('username') },
          )}
          onClick={this.props.onNotifyToggle}
        />
      );
    }

    if (me !== account.get('id')) {
      if (signedIn && !account.get('relationship')) {
        // Wait until the relationship is loaded
        actionBtn = '';
      } else if (account.getIn(['relationship', 'requested'])) {
        actionBtn = (
          <Button
            className={classNames('logo-button', {
              'button--with-bell': bellBtn !== '',
            })}
            text={intl.formatMessage(messages.cancel_follow_request)}
            title={intl.formatMessage(messages.requested)}
            onClick={this.props.onFollow}
          />
        );
      } else if (!account.getIn(['relationship', 'blocking'])) {
        actionBtn = (
          <Button
            disabled={account.getIn(['relationship', 'blocked_by'])}
            className={classNames('logo-button', {
              'button--destructive': account.getIn([
                'relationship',
                'following',
              ]),
              'button--with-bell': bellBtn !== '',
            })}
            text={intl.formatMessage(
              account.getIn(['relationship', 'following'])
                ? messages.unfollow
                : messages.follow,
            )}
            onClick={
              signedIn ? this.props.onFollow : this.props.onInteractionModal
            }
          />
        );
      } else if (account.getIn(['relationship', 'blocking'])) {
        actionBtn = (
          <Button
            className='logo-button'
            text={intl.formatMessage(messages.unblock, {
              name: account.get('username'),
            })}
            onClick={this.props.onBlock}
          />
        );
      }
    } else {
      actionBtn = (
        <Button
          className='logo-button'
          text={intl.formatMessage(messages.edit_profile)}
          onClick={this.openEditProfile}
        />
      );
    }

    if (account.get('moved') && !account.getIn(['relationship', 'following'])) {
      actionBtn = '';
    }

    if (account.get('locked')) {
      lockedIcon = (
        <Icon id='lock' title={intl.formatMessage(messages.account_locked)} />
      );
    }

    if (signedIn && account.get('id') !== me) {
      menu.push({
        text: intl.formatMessage(messages.mention, {
          name: account.get('username'),
        }),
        action: this.props.onMention,
      });
      menu.push({
        text: intl.formatMessage(messages.direct, {
          name: account.get('username'),
        }),
        action: this.props.onDirect,
      });
      menu.push(null);
    }

    if (isRemote) {
      menu.push({
        text: intl.formatMessage(messages.openOriginalPage),
        href: account.get('url'),
      });
      menu.push(null);
    }

    if ('share' in navigator) {
      menu.push({
        text: intl.formatMessage(messages.share, {
          name: account.get('username'),
        }),
        action: this.handleShare,
      });
      menu.push(null);
    }

    if (account.get('id') === me) {
      menu.push({
        text: intl.formatMessage(messages.edit_profile),
        href: '/settings/profile',
      });
      menu.push({
        text: intl.formatMessage(messages.preferences),
        href: '/settings/preferences',
      });
      menu.push({ text: intl.formatMessage(messages.pins), to: '/pinned' });
      menu.push(null);
      menu.push({
        text: intl.formatMessage(messages.follow_requests),
        to: '/follow_requests',
      });
      menu.push({
        text: intl.formatMessage(messages.favourites),
        to: '/favourites',
      });
      menu.push({ text: intl.formatMessage(messages.lists), to: '/lists' });
      menu.push({
        text: intl.formatMessage(messages.followed_tags),
        to: '/followed_tags',
      });
      menu.push(null);
      menu.push({ text: intl.formatMessage(messages.mutes), to: '/mutes' });
      menu.push({ text: intl.formatMessage(messages.blocks), to: '/blocks' });
      menu.push({
        text: intl.formatMessage(messages.domain_blocks),
        to: '/domain_blocks',
      });
    } else if (signedIn) {
      if (account.getIn(['relationship', 'following'])) {
        if (!account.getIn(['relationship', 'muting'])) {
          if (account.getIn(['relationship', 'showing_reblogs'])) {
            menu.push({
              text: intl.formatMessage(messages.hideReblogs, {
                name: account.get('username'),
              }),
              action: this.props.onReblogToggle,
            });
          } else {
            menu.push({
              text: intl.formatMessage(messages.showReblogs, {
                name: account.get('username'),
              }),
              action: this.props.onReblogToggle,
            });
          }

          menu.push({
            text: intl.formatMessage(messages.languages),
            action: this.props.onChangeLanguages,
          });
          menu.push(null);
        }

        menu.push({
          text: intl.formatMessage(
            account.getIn(['relationship', 'endorsed'])
              ? messages.unendorse
              : messages.endorse,
          ),
          action: this.props.onEndorseToggle,
        });
        menu.push({
          text: intl.formatMessage(messages.add_or_remove_from_list),
          action: this.props.onAddToList,
        });
        menu.push(null);
      }

      if (account.getIn(['relationship', 'muting'])) {
        menu.push({
          text: intl.formatMessage(messages.unmute, {
            name: account.get('username'),
          }),
          action: this.props.onMute,
        });
      } else {
        menu.push({
          text: intl.formatMessage(messages.mute, {
            name: account.get('username'),
          }),
          action: this.props.onMute,
        });
      }

      if (account.getIn(['relationship', 'blocking'])) {
        menu.push({
          text: intl.formatMessage(messages.unblock, {
            name: account.get('username'),
          }),
          action: this.props.onBlock,
        });
      } else {
        menu.push({
          text: intl.formatMessage(messages.block, {
            name: account.get('username'),
          }),
          action: this.props.onBlock,
        });
      }

      menu.push({
        text: intl.formatMessage(messages.report, {
          name: account.get('username'),
        }),
        action: this.props.onReport,
      });
    }

    if (signedIn && isRemote) {
      menu.push(null);

      if (account.getIn(['relationship', 'domain_blocking'])) {
        menu.push({
          text: intl.formatMessage(messages.unblockDomain, {
            domain: remoteDomain,
          }),
          action: this.props.onUnblockDomain,
        });
      } else {
        menu.push({
          text: intl.formatMessage(messages.blockDomain, {
            domain: remoteDomain,
          }),
          action: this.props.onBlockDomain,
        });
      }
    }

    if (
      (account.get('id') !== me &&
        (permissions & PERMISSION_MANAGE_USERS) === PERMISSION_MANAGE_USERS) ||
      (isRemote &&
        (permissions & PERMISSION_MANAGE_FEDERATION) ===
          PERMISSION_MANAGE_FEDERATION)
    ) {
      menu.push(null);
      if ((permissions & PERMISSION_MANAGE_USERS) === PERMISSION_MANAGE_USERS) {
        menu.push({
          text: intl.formatMessage(messages.admin_account, {
            name: account.get('username'),
          }),
          href: `/admin/accounts/${account.get('id')}`,
        });
      }
      if (
        isRemote &&
        (permissions & PERMISSION_MANAGE_FEDERATION) ===
          PERMISSION_MANAGE_FEDERATION
      ) {
        menu.push({
          text: intl.formatMessage(messages.admin_domain, {
            domain: remoteDomain,
          }),
          href: `/admin/instances/${remoteDomain}`,
        });
      }
    }

    const content = { __html: account.get('note_emojified') };
    const displayNameHtml = { __html: account.get('display_name_html') };
    const fields = account.get('fields');
    const isLocal = account.get('acct').indexOf('@') === -1;
    const acct =
      isLocal && domain
        ? `${account.get('acct')}@${domain}`
        : account.get('acct');
    const isIndexable = !account.get('noindex');

    let badge;

    if (account.get('bot')) {
      badge = (
        <div className='account-role bot'>
          <FormattedMessage id='account.badges.bot' defaultMessage='Bot' />
        </div>
      );
    } else if (account.get('group')) {
      badge = (
        <div className='account-role group'>
          <FormattedMessage id='account.badges.group' defaultMessage='Group' />
        </div>
      );
    } else {
      badge = null;
    }

    let liker_id = account.get('liker_id') || null;
    liker_id = 'guanyun';
    return (
      <div
        className={classNames('account__header', {
          inactive: !!account.get('moved'),
        })}
        onMouseEnter={this.handleMouseEnter}
        onMouseLeave={this.handleMouseLeave}
      >
        {!(suspended || hidden || account.get('moved')) &&
          account.getIn(['relationship', 'requested_by']) && (
          <FollowRequestNoteContainer account={account} />
        )}

        <div className='account__header__image'>
          <div className='account__header__info'>{!suspended && info}</div>

          {!(suspended || hidden) && (
            <img
              src={
                autoPlayGif
                  ? account.get('header')
                  : account.get('header_static')
              }
              alt=''
              className='parallax'
            />
          )}
        </div>

        <div className='account__header__bar'>
          <div className='account__header__tabs'>
            <a
              className='avatar'
              style={{
                backgroundImage: this.state.isSubscribedCivicLiker
                  ? `url(${civic})`
                  : null,
                backgroundSize: '94px 94px',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundRepeat: 'no-repeat',
                height: '94px',
              }}
              href={account.get('avatar')}
              rel='noopener noreferrer'
              target='_blank'
              onClick={this.handleAvatarClick}
            >
              <Avatar
                account={suspended || hidden ? undefined : account}
                size={70}
              />
            </a>

            {!suspended && (
              <div className='account__header__tabs__buttons'>
                {!hidden && (
                  <React.Fragment>
                    {actionBtn}
                    {bellBtn}
                  </React.Fragment>
                )}

                <DropdownMenuContainer
                  disabled={menu.length === 0}
                  items={menu}
                  icon='ellipsis-v'
                  size={24}
                  direction='right'
                />
              </div>
            )}
          </div>

          <div className='account__header__tabs__name'>
            <h1>
              <span dangerouslySetInnerHTML={displayNameHtml} /> {badge}
              <small>
                @{acct} {lockedIcon}
              </small>
              {liker_id ? (
                <div
                  className='civic-liker'
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    fontSize: '13px',
                    marginTop: '10px',
                  }}
                >
                  <img src={CivicLiker} style={{ width: '27px' }} />
                  <a
                    style={{
                      marginLeft: '5px',
                      color: '#50e3c2',
                      textDecoration: 'none',
                      fontWeight: 500,
                    }}
                    target='_blank'
                    onClick={this.changeNftDrawer}
                  >
                    贈送 nft
                  </a>
                </div>
              ) : null}
              <Drawer
                size={DrawerSize.LARGE}
                position='bottom'
                isOpen={isSendNftDrawerOpen}
                canOutsideClickClose='true'
                canEscapeKeyClose='true'
                onClose={this.changeNftDrawer}
              >
                <div className='my-nft-list'>
                  {nftList.map((nft) => {
                    return (
                      <div class={'nft-container'} key={nft.id}>
                        <div className='nft-info'>
                          <div class={'nft-title'}>{nft.name}</div>
                          <div class='nft-description '>{nft.description}</div>
                          <div className='nft-labels'>
                            <div class='label'>
                              <Tag>
                                {' '}
                                <span>
                                  Copies Sold:{' '}
                                  {nft.soldCount ? nft.soldCount : 0}
                                </span>
                              </Tag>
                            </div>{' '}
                            <div class='label'>
                              <Tag>
                                <span>
                                  Price: {nft.currentPrice.toFixed(1) + ' LIKE'}
                                </span>
                              </Tag>
                            </div>{' '}
                            {price?.usd ? (
                              <div class='label'>
                                <Tag>
                                  {' '}
                                  <span>
                                    Price Usd:{' '}
                                    {(nft?.currentPrice * price?.usd).toFixed(
                                      2,
                                    )}
                                  </span>
                                </Tag>
                              </div>
                            ) : null}
                          </div>
                          <div className='nft-actions'>
                            <div className='nft-buttons'>
                              <div className={'nft-origial'}> 將 </div>{' '}
                            </div>
                            <HTMLSelect
                              defaultValue={nft.nftIds[0]}
                              onChange={this.selectNftId}
                              options={nft.nftIds}
                              style={{ maxWidth: '10vw' }}
                            />

                            <div className='nft-buttons'>
                              <div className={`nft-collect ${nft.id}`}>
                                {' '}
                                贈送給 {liker_id}
                              </div>
                              {/* <div
                                  className='nft-origial item'
                                  // onClick={this.goCollect.bind(this, nft)}
                                >
                                  立即收藏
                                </div> */}
                            </div>
                          </div>
                          <div className='memo-input'>
                            <InputGroup
                              large='large'
                              placeholder='留言'
                              onChange={this.changeMemo}
                            />
                          </div>
                          <div className='nft-transfer'>
                            <Button
                              fill='true'
                              onClick={this.transferNft.bind(this, nft)}
                            >
                              贈送
                            </Button>
                          </div>
                        </div>
                        <div class='container'>
                          <div class='book'>
                            <div class='front'>
                              <div class='cover'>
                                <img
                                  className='nft-image'
                                  alt={nft.name}
                                  // onClick={this.goNftDetail.bind(this, nft)}
                                  src={`https://api.like.co/likernft/metadata/image/class_${nft.id}?size=450`}
                                />
                                <div class={'nft-title'}>{nft.name}</div>
                                <div class='author'>
                                  <div className='author-by'>
                                    Written by {'  '}
                                  </div>
                                  <img
                                    className='author-avatar'
                                    alt={nft.liker ? nft.liker.likeWallet : ''}
                                    src={nft.liker ? nft.liker.avatar : ''}
                                  />

                                  <div class={'author-name'}>
                                    {nft.liker.displayName}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div class='left-side'>
                              <h2>
                                <img
                                  className='author-avatar'
                                  alt={nft.liker ? nft.liker.likeWallet : ''}
                                  src={nft.liker ? nft.liker.avatar : ''}
                                />
                                <span>{nft.liker.displayName}</span>

                                {/* <span>{nft.name}</span> */}
                              </h2>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Drawer>
              {self ? (
                liker_id ? (
                  <div
                    className='civic-liker-asset'
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      fontSize: '13px',
                      marginTop: '10px',
                    }}
                  >
                    <a
                      style={{
                        marginLeft: '5px',
                        color: '#50e3c2',
                        textDecoration: 'none',
                        fontWeight: 500,
                      }}
                      target='_blank'
                      href={`https://liker.land/${liker_id}/civic?utm_source=likersocial`}
                    >
                      LIKE balances:
                    </a>
                    <div>
                      {' '}
                      &nbsp; {balances.toFixed(2)} LIKE ≈{' '}
                      {(price.usd * balances).toFixed(2)} USD
                    </div>
                  </div>
                ) : null
              ) : null}
            </h1>
          </div>
          <Dialog
            isOpen={isTXhashOpen}
            title='是否通過私信告訴他此次贈送！'
            icon='info-sign'
          >
            <Button onClick={this.tellGift}>告訴他！</Button>
            <Button onCLick={this.handleCloseTX}> 不啦！</Button>
          </Dialog>
          {!(suspended || hidden) && (
            <div className='account__header__extra'>
              <div className='account__header__bio'>
                {account.get('id') !== me && signedIn && (
                  <AccountNoteContainer account={account} />
                )}

                {account.get('note').length > 0 &&
                  account.get('note') !== '<p></p>' && (
                  <div
                    className='account__header__content translate'
                    dangerouslySetInnerHTML={content}
                  />
                )}

                <div className='account__header__fields'>
                  <dl>
                    <dt>
                      <FormattedMessage
                        id='account.joined_short'
                        defaultMessage='Joined'
                      />
                    </dt>
                    <dd>
                      {intl.formatDate(account.get('created_at'), {
                        year: 'numeric',
                        month: 'short',
                        day: '2-digit',
                      })}
                    </dd>
                  </dl>

                  {fields.map((pair, i) => (
                    <dl
                      key={i}
                      className={classNames({
                        verified: pair.get('verified_at'),
                      })}
                    >
                      <dt
                        dangerouslySetInnerHTML={{
                          __html: pair.get('name_emojified'),
                        }}
                        title={pair.get('name')}
                        className='translate'
                      />

                      <dd className='translate' title={pair.get('value_plain')}>
                        {pair.get('verified_at') && (
                          <span
                            title={intl.formatMessage(messages.linkVerifiedOn, {
                              date: intl.formatDate(
                                pair.get('verified_at'),
                                dateFormatOptions,
                              ),
                            })}
                          >
                            <Icon id='check' className='verified__mark' />
                          </span>
                        )}{' '}
                        <span
                          dangerouslySetInnerHTML={{
                            __html: pair.get('value_emojified'),
                          }}
                        />
                      </dd>
                    </dl>
                  ))}
                </div>
              </div>

              <div className='account__header__extra__links'>
                <NavLink
                  isActive={this.isStatusesPageActive}
                  activeClassName='active'
                  to={`/@${account.get('acct')}`}
                  title={intl.formatNumber(account.get('statuses_count'))}
                >
                  <ShortNumber
                    value={account.get('statuses_count')}
                    renderer={counterRenderer('statuses')}
                  />
                </NavLink>

                <NavLink
                  exact
                  activeClassName='active'
                  to={`/@${account.get('acct')}/following`}
                  title={intl.formatNumber(account.get('following_count'))}
                >
                  <ShortNumber
                    value={account.get('following_count')}
                    renderer={counterRenderer('following')}
                  />
                </NavLink>

                <NavLink
                  exact
                  activeClassName='active'
                  to={`/@${account.get('acct')}/followers`}
                  title={intl.formatNumber(account.get('followers_count'))}
                >
                  <ShortNumber
                    value={account.get('followers_count')}
                    renderer={counterRenderer('followers')}
                  />
                </NavLink>
              </div>
            </div>
          )}
        </div>

        <Helmet>
          <title>{titleFromAccount(account)}</title>
          <meta
            name='robots'
            content={isLocal && isIndexable ? 'all' : 'noindex'}
          />
        </Helmet>
      </div>
    );
  }

}
