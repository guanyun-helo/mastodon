import PropTypes from 'prop-types';
import React from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import ImmutablePureComponent from 'react-immutable-pure-component';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import localforage from 'localforage';
import ScrollContainer from 'mastodon/containers/scroll_container';
import Column from 'mastodon/components/column';
import ColumnHeader from 'mastodon/components/column_header';
import _ from 'lodash';
import {
  getOwnerByISCN,
  getNFTbyID,
  getNFTmeta,
  getCoinPrice,
  getISCNListByOwner,
  getNFTListByOwner,
  getLikerInfoByAddress,
  getCollectRankByCollecterAddress,
} from '../../../utils/api/like';

import {
  Intent,
  Button,
  Callout,
  Spinner,
  Alert,
  Drawer,
  DrawerSize,
} from '@blueprintjs/core';

import Macy from 'macy';

@injectIntl
export default class NftList extends ImmutablePureComponent {

  static contextTypes = {
    router: PropTypes.object.isRequired,
  };

  static propTypes = {
    intl: PropTypes.object,
    address: PropTypes.string,
    likerInfo: PropTypes.object,
  };

  state = {
    collectNftList: [],
    createorNftList: [],
    nftList: [],
    rawCollectedList: [],
    rawISCNList: [],
    rawNftList: [],
    nextKey: [],
    index: 0,
    currentElementId: '',
    macy: null,
    isLoading: false,
    likecoin: null,
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
                  description:
                    '',
                  keywords: '',
                  name: '哩哩扣扣 #23 回顧 Solana 的扭曲生態如何形成',
                  url: 'https://leafwind.tw/2022/12/19/lilicoco-23-solana/',
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
                      '@id': 'like1p6xz8ma7xmra64susvp8lxpqlx48skg9e86c9d',
                      description:
                        '在日軟體工程師｜資料科學與工程｜熱衷於觀察科技與人性\r\n\u003ca href="https://t.me/all_about_data"\u003e加入TG資料森友會群組\u003c/a\u003e｜\u003ca href="https://leafwind.tw/2020/12/06/about/"\u003e 關於我 \u003c/a\u003e',
                      identifier: [
                        {
                          '@type': 'PropertyValue',
                          propertyID: 'LikeCoin Wallet',
                          value: 'like1p6xz8ma7xmra64susvp8lxpqlx48skg9e86c9d',
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
  getMore = async () => {
    this.setState({
      isLoading: true,
    });
    const { rawISCNList, rawCollectedList, nftList, index } = this.state;
    const { likerInfo, contentType } = this.props;
    let temISCNList = [];
    if(contentType === 'collect'){
      temISCNList = rawCollectedList.slice(index, index+1);
    }else{
      temISCNList=rawISCNList.slice(index, index+1);
    }
    let temNftList = [];
    for (const item of temISCNList) {
      let owner = await getOwnerByISCN(item.parent.iscn_id_prefix);
      let liker = contentType === 'latest'
        ? { data: likerInfo }
        : await getLikerInfoByAddress(owner.data.owner);
      let result = await getNFTmeta(item.id);
      let nftDetail = await getNFTbyID(item.id);

      if (result !== undefined) {
        temNftList.push({
          liker: liker.data,
          owner: owner.data,
          ...result.data,
          ...nftDetail.data,
        });
      }
    }
    this.setState(
      {
        nftList: [...nftList, ...temNftList],
        index: index + 1,
        isLoading: false,
      },
      () => {
        this.setState(
          {
            currentElementId:
              this.state.nftList[this.state.nftList.length - 1].id,
          },
          () => {
            if (this.state.macy === null) return;
            this.state.macy.recalculate(true);
            // this.observer();
          },
        );
      },
    );
  };
  observer = () => {
    const { contentType } = this.props;
    const  { nftList } = this.state;
    if(nftList.length.length === 0) return;
    const macy = Macy({
      container: `.nft-${this.props.contentType}`, // 容器元素的选择器
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
          .querySelector(`.nft-list-${contentType}-container`)
          .addEventListener('scroll', () => {
            // Get the position and size of the box element relative to the viewport
            let elementId = this.state.currentElementId;
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
              if (this.state.isLoading) return;
              this.getMore();
            } else {
            }
          });
      },
    );
  };
  getCollected = async (address) => {
    let result = await getNFTListByOwner(
      'like13f4glvg80zvfrrs7utft5p68pct4mcq7t5atf6',
    );
    // this.setState({
    //   rawNftList: result.data.nfts,
    //   nextKey: result.data.next_key,
    // });

    let nftList = [];
    nftList = result.data.nfts.slice(0, 5);
    let temNftList = [];
    for (let nft of nftList) {
      let meta = await getNFTmeta(nft.class_id);
      let creator = await getLikerInfoByAddress(meta.data.iscn_owner);
      let temNft = {
        creator: creator,
        meta: meta.data,
        owner: this.props.likerInfo,
        ...nft,
      };
      temNftList.push(temNft);
    }
    this.setState(
      {
        nftList: temNftList,
      },
      () => {
        this.setState({
          currentElementId:
            this.state.nftList[this.state.nftList.length - 1].id,
        });
        // this.observer();
      },
    );
  };

  filterNftList = async (type) => {
    const { rawISCNList, rawCollectedList, nftList, index } = this.state;
    const { likerInfo } = this.props;
    let temISCNList =
      type === 'collect'
        ? rawCollectedList.slice(index, 5)
        : rawISCNList.slice(index, 5);
    let temNftList = [];
    for (const item of temISCNList) {
      let owner = await getOwnerByISCN(item.parent.iscn_id_prefix);
      let liker = type === 'latest'
        ? { data: likerInfo }
        : await getLikerInfoByAddress(owner.data.owner);
      let result = await getNFTmeta(item.id);
      let nftDetail = await getNFTbyID(item.id);
      if (result !== undefined) {
        temNftList.push({
          liker: liker.data,
          owner: owner.data,
          ...result.data,
          ...nftDetail.data,
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
            this.observer();
          },
        );
      },
    );
  };
  // tell me what's wrong with my code, i keep get loop error
  getNFTListByOwner = (addres, next) => {
    this.setState({
      isLoading: true,
    });
    getNFTListByOwner('like13f4glvg80zvfrrs7utft5p68pct4mcq7t5atf6', next)
      .then((result) => {
        let nftList = new Map();
        if (result.data.nfts !== null) {
          result.data.nfts.forEach((item) => {
            if (item.data) {
              nftList.set(item.data?.class_parent?.iscn_id_prefix, item);
            }
          });
        }
        this.setState({
          rawNftList: new Map([...this.state.rawNftList].concat([...nftList])),
          isLoading: false,
        });
        if (result.data.pagination?.next_key === null) {
          return;
        }
        if (result.data.pagination?.next_key !== null) {
          this.getNFTListByOwner(addres, result.data.pagination?.next_key);
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  getISCNListByOwner = (address, next) => {
    getISCNListByOwner(address, next)
      .then((result) => {
        this.setState(
          {
            rawISCNList: result.data?.classes
              ? [...this.state.rawISCNList, ...result.data.classes]
              : [...this.state.rawISCNList],
          },
          () => {
            if (result.data.pagination?.next_key === undefined) {
              this.filterNftList(this.props.contentType);
            }
          },
        );
        if (result.data.pagination?.next_key === undefined) return;
        this.getISCNListByOwner(address, result.data.pagination?.next_key);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  getCollectRankByCollecterAddress = async (address) => {
    let result = await getCollectRankByCollecterAddress(address);
    this.setState(
      {
        rawCollectedList: result.data?.classes
          ? [...this.state.rawCollectedList, ...result.data.classes]
          : [...this.state.rawCollectedList],
      },
      () => {
        this.filterNftList(this.props.contentType);
      },
    );

  };

  componentDidUpdate() {
    if (this.props.selected === false) return;
    // this.renderList(this.props.contentType);
    if (this.state.macy) {
      this.state.macy.recalculate(true);
    }
  }

  getCoinPrice = async () => {
    let result = await getCoinPrice();
    this.setState({
      likecoin: result.data?.likecoin,
    });
  };

  componentDidMount() {
    const { address, contentType } = this.props;

    if (contentType === 'latest') {
      this.getISCNListByOwner('like13f4glvg80zvfrrs7utft5p68pct4mcq7t5atf6');
    } else {
      this.getCollectRankByCollecterAddress(
        'like13f4glvg80zvfrrs7utft5p68pct4mcq7t5atf6',
      );
    }
    this.getCoinPrice();
    // this.getISCNListByOwner('like13f4glvg80zvfrrs7utft5p68pct4mcq7t5atf6');
    // this.getNFTListByOwner(address);
  }

  render() {
    const { isLoading, nftList, rawNftList, likecoin } = this.state;
    const { contentType, likerInfo } = this.props;
    return nftList.length === 0 ? (
      <Spinner className='nft-list-container next' size={20} />
    ) : (
      <div className={`nft-list-container nft-list-${contentType}-container`}>
        <div className={`nft-list nft-${contentType}`}>
          {nftList.map((nft, ndx) => (
            <div class={'nft-container'} key={nft.id}>
              <div class='container'>
                <div class='book'>
                  <div class='front'>
                    <div class='cover'>
                      <img
                        className='nft-image'
                        alt={nft.name}
                        src={`https://api.like.co/likernft/metadata/image/class_${nft.id}?size=450`}
                      />
                      <div class={`nft-title  ${nft.id}`}>{nft.name}</div>
                      <div class='nft-description '>{nft.description}</div>
                    </div>
                  </div>
                  <div class='left-side'>
                    <h2>
                      <img
                        className='author-avatar'
                        alt={nft?.liker ? nft?.liker.likeWallet : ''}
                        src={nft?.liker ? nft?.liker.avatar : ''}
                      />
                      <span>{nft?.liker.displayName}</span>

                      {/* <span>{nft.name}</span> */}
                    </h2>
                  </div>
                </div>
              </div>
              <div className='nft-info'>
                <div class={`nft-title  ${nft.id}`}>{nft.name}</div>
                <div className='nft-labels'>
                  <div class='label'>
                    <span>
                      Price:{' '}
                      {nft.currentPrice.toFixed(0)}
                      LIKE
                    </span>
                  </div>
                  <div class='label'>
                    <span>
                      Copies Sold: {nft.soldCount ? nft.soldCount : 0}
                    </span>
                  </div>
                  {/* <div class='label'>
                    <span>
                      Total Value:{' '}
                      {nft.total_sold_value
                        ? (nft.total_sold_value / 1000000000).toFixed(0)
                        : 0}{' '}
                      LIKE
                    </span>
                  </div> */}
                </div>
                <div className='nft-actions'>
                  <div class='author'>
                    <img
                      className='author-avatar'
                      alt={nft?.liker ? nft?.liker.likeWallet : ''}
                      src={nft?.liker ? nft?.liker.avatar : ''}
                    />

                    <div class={'author-name'}>{nft?.liker.displayName}</div>
                  </div>
                  <div className='nft-buttons'>
                    <div className='nft-origial item'>${ likecoin === null  ? (nft.currentPrice).toFixed(2):(nft.currentPrice * likecoin.usd).toFixed(2)}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {rawNftList.length === nftList.length ? (
            <div className='next'> Nothing more... </div>
          ) : isLoading === true ? (
            <Spinner size={20} />
          ) : (
            <Spinner size={20} />
          )}
        </div>
      </div>
    );
  }

}
