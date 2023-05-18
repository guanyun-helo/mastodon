import PropTypes from 'prop-types';
import React from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import ImmutablePureComponent from 'react-immutable-pure-component';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import localforage from 'localforage';
import ScrollContainer from 'mastodon/containers/scroll_container';
import Column from 'mastodon/components/column';
import ColumnHeader from 'mastodon/components/column_header';
import {
  getTrending,
  getTop,
  getLikerInfoByAddress,
  getOwnerByISCN,
  getLatest,
  getNFTmeta,
  getCoinPrice,
} from '../../../utils/api/like';

import { Intent, Button, Spinner, Alert, Drawer, DrawerSize } from '@blueprintjs/core';

import Macy from 'macy';

@injectIntl
export default class NftList extends ImmutablePureComponent {

  static contextTypes = {
    router: PropTypes.object.isRequired,
  };

  static propTypes = {
    intl: PropTypes.object,
    multiColumn: PropTypes.bool,
    contentType: PropTypes.string,
    selected: PropTypes.bool,
  };

  state = {
    collapsed: true,
    animating: false,
    tags: [],
    isLoading: false,
    rawNftList: [],
    index: 0,
    nftList: [],
    currentElementId: null,
    macy: null,
    isOpen: false,
    likecoin:{},
    nftId: '',
    isDrawerDisplay: false,
    currentReadingNft: null,
  };

  getDummy(value){
    if(value === 0){
      return {
        data: {
          'owner': 'liker',
          'latest_version': '2',
          'records': [
            {
              'ipld': 'liker',
              'data': { '@context':{ '@vocab':'http://iscn.io/', 'contentMetadata':{ '@context':null }, 'recordParentIPLD':{ '@container':'@index' }, 'stakeholders':{ '@context':{ '@vocab':'http://schema.org/', 'contributionType':'http://iscn.io/contributionType', 'entity':'http://iscn.io/entity', 'footprint':'http://iscn.io/footprint', 'rewardProportion':'http://iscn.io/rewardProportion' } } }, '@id':'iscn://likecoin-chain/2FsxYWHcJ_Es5oHt4fy2RgtVY3ZGbdZpFg9HZWqdPWk/2', '@type':'Record', 'contentFingerprints':['ar://5uunbWgkdoDCj59xtNdFtqxMnFl6CKT_b4hTwhXjo7w', 'ipfs://QmXbbXAHnA9y4aUR5bMWKzJXpmtL7AXB6fcxJHCW3yNQ8t'], 'contentMetadata':{ '@context':'http://schema.org/', '@type':'Article', 'description':'', 'keywords':'', 'name':'哩哩扣扣 #23 回顧 Solana 的扭曲生態如何形成', 'url':'https://leafwind.tw/2022/12/19/lilicoco-23-solana/', 'usageInfo':'', 'version':1 }, 'recordNotes':'LikeCoin WordPress Plugin', 'recordParentIPLD':{ '/':'baguqeerad6nbud7uo24fmz55fxzh6hwbesujwdlkpysgeftbtjeqfrwdnsmq' }, 'recordTimestamp':'2022-12-22T15:43:42+00:00', 'recordVersion':2, 'stakeholders':[{ 'contributionType':'http://schema.org/author', 'entity':{ '@id':'like1p6xz8ma7xmra64susvp8lxpqlx48skg9e86c9d', 'description':'在日軟體工程師｜資料科學與工程｜熱衷於觀察科技與人性\r\n\u003ca href="https://t.me/all_about_data"\u003e加入TG資料森友會群組\u003c/a\u003e｜\u003ca href="https://leafwind.tw/2020/12/06/about/"\u003e 關於我 \u003c/a\u003e', 'identifier':[{ '@type':'PropertyValue', 'propertyID':'LikeCoin Wallet', 'value':'like1p6xz8ma7xmra64susvp8lxpqlx48skg9e86c9d' }], 'name':'leafwind' }, 'rewardProportion':1 }] },
            },
          ],
        },
      };
    }else if(value === 1){
      return {
        data: {
          'user': 'liker',
          'displayName': 'liker',
          'avatar': 'https://via.placeholder.com/50x50.png?text=Avatar',
          'cosmosWallet': 'unknown',
          'likeWallet': 'unknown',
          'isSubscribedCivicLiker': true,
          'civicLikerSince': 1000,
        },
      };
    } else if(value === 2){
      return {
        data: {
          'nft_meta_collection_name': 'Writing NFT',
          'nft_meta_collection_id': 'likerland_writing_nft',
          'nft_meta_collection_descrption': 'Writing NFT by Liker Land',
          'message': 'liker',
          'id': 'liker',
          'image': 'https://api.like.co/likernft/metadata/image/class_likenft1v3s5wc4hk7v9ufsp792sgvr080zta9eua3qkl7un2zu0vgv6l0xssjr54t?size=1280',
          'external_url': 'liker.land',
        },
      };
    }
  }

  getMore = async () => {
    this.setState({
      isLoading: true,
    });

    let currentTab = this.state.currentTab;

    let nfts = {};
    let classes = [];
    let nftList = [];

    switch (currentTab) {
    case 'feature':
      // nfts = await getTrending();
      classes = this.state.rawNftList.slice(
        this.state.index,
        this.state.index + 1,
      );
      this.setState({
        index: this.state.index + 1,
      });
      nftList = [];
      for (let nft of classes) {
        let owner = await getOwnerByISCN(nft.parent.iscn_id_prefix);
        let likerInfo = await getLikerInfoByAddress(owner.data.owner);
        let meta = await getNFTmeta(nft.id);
        if(owner === undefined){
          owner = this.getDummy(0);
        }
        if(likerInfo === undefined){
          likerInfo = this.getDummy(1);
        }
        if(meta === undefined){
          meta = this.getDummy(2);
        }
        let temNft = { meta:meta.data, owner: likerInfo.data, ...nft };
        nftList.push(temNft);
      }
      this.setState(
        {
          nftList: [...this.state.nftList, ...nftList],
          isLoading: false,
        },
        () => {
          this.setState({
            currentElementId:
              `${this.state.nftList[this.state.nftList.length - 1].id}`,
          });
          if (this.state.macy) {
            this.state.macy.recalculate(true);
          }
        },
      );
      break;

    case 'top':
      classes = this.state.rawNftList.slice(
        this.state.index,
        this.state.index + 1,
      );
      this.setState({
        index: this.state.index + 1,
      });
      nftList = [];
      for (let nft of classes) {
        let owner = await getOwnerByISCN(nft.parent.iscn_id_prefix);
        let likerInfo = await getLikerInfoByAddress(owner.data.owner);
        let meta = await getNFTmeta(nft.id);
        if(owner === undefined){
          owner = this.getDummy(0);
        }
        if(likerInfo === undefined){
          likerInfo = this.getDummy(1);
        }
        if(meta === undefined){
          meta = this.getDummy(2);
        }
        let temNft = { meta:meta.data, owner: likerInfo.data, ...nft };
        nftList.push(temNft);
      }
      this.setState(
        {
          nftList: [...this.state.nftList, ...nftList],
          isLoading: false,
        },
        () => {
          this.setState({
            currentElementId:
                this.state.nftList[this.state.nftList.length - 1].id,
          });
          if (this.state.macy) {
            this.state.macy.recalculate(true);
          }
        },
      );
      break;
    case 'latest':
      const { nextKey } = this.state;
      nfts = await getLatest(nextKey);
      classes = nfts.data.classes;
      nftList = [];
      for (let nft of classes) {
        let owner = await getOwnerByISCN(nft.parent.iscn_id_prefix);
        let likerInfo = await getLikerInfoByAddress(owner.data.owner);
        let meta = await getNFTmeta(nft.id);
        if(owner === undefined){
          owner = this.getDummy(0);
        }
        if(likerInfo === undefined){
          likerInfo = this.getDummy(1);
        }
        if(meta === undefined){
          meta = this.getDummy(2);
        }
        let temNft = { meta:meta.data, owner: likerInfo.data, ...nft };
        nftList.push(temNft);
      }
      this.setState(
        {
          nftList: [...this.state.nftList, ...nftList],
          nextKey: nfts.data.pagination.next_key,
          isLoading: false,
        },
        () => {
          this.setState({
            currentElementId:
                    this.state.nftList[this.state.nftList.length - 1].id,
          });
          if (this.state.macy) {
            this.state.macy.recalculate(true);
          }
        },
      );
      break;

    default:
      break;
    }
  };

  renderList = async (value) => {
    this.setState({
      currentTab: value,
    });
    let nfts = {};
    let classes = [];
    let nftList = [];

    switch (value) {
    case 'feature':
      nfts = await getTrending();
      classes = nfts.data.classes;
      classes = classes.slice(0, 9);
      this.setState({
        rawNftList: nfts.data.classes,
        index: 9,
      });
      localforage.setItem('feature', JSON.stringify(nfts.data.classes));
      nftList = [];
      for (let nft of classes) {
        let owner = await getOwnerByISCN(nft.parent.iscn_id_prefix);
        let likerInfo = await getLikerInfoByAddress(owner.data.owner);
        let meta = await getNFTmeta(nft.id);
        let temNft = { meta: meta.data, owner: likerInfo.data, ...nft };
        nftList.push(temNft);
      }
      this.setState(
        {
          nftList: nftList,
        },
        () => {
          this.setState(
            {
              currentElementId:
                  this.state.nftList[this.state.nftList.length - 1].id,
            },
          );
          this.observer();
        },
      );
      break;

    case 'top':
      nfts = await getTop();
      classes = nfts.data.classes;
      classes = classes.slice(0, 9);
      this.setState({
        rawNftList: nfts.data.classes,
        index: 9,
      });
      nftList = [];
      for (let nft of classes) {
        let owner = await getOwnerByISCN(nft.parent.iscn_id_prefix);
        let likerInfo = await getLikerInfoByAddress(owner.data.owner);
        let meta = await getNFTmeta(nft.id);

        if(owner === undefined){
          owner = this.getDummy(0);
        }
        if(likerInfo === undefined){
          likerInfo = this.getDummy(1);
        }
        if(meta === undefined){
          meta = this.getDummy(2);
        }
        let temNft = { meta: meta.data, owner: likerInfo.data, ...nft };
        nftList.push(temNft);
      }
      this.setState(
        {
          nftList: nftList,
        },
        () => {
          this.setState(
            {
              currentElementId:
                      this.state.nftList[this.state.nftList.length - 1].id,
            },
          );
          this.observer();
        },
      );
      break;
    case 'latest':
      nfts = await getLatest();
      classes = nfts.data.classes;
      nftList = [];
      for (let nft of classes) {
        let owner = await getOwnerByISCN(nft.parent.iscn_id_prefix);
        let likerInfo = await getLikerInfoByAddress(owner.data.owner);
        let meta = await getNFTmeta(nft.id);
        if(owner === undefined){
          owner = this.getDummy(0);
        }
        if(likerInfo === undefined){
          likerInfo = this.getDummy(1);
        }
        if(meta === undefined){
          meta = this.getDummy(2);
        }
        let temNft = { meta: meta.data, owner: likerInfo.data, ...nft };
        nftList.push(temNft);
      }
      this.setState(
        {
          nftList: nftList,
          nextKey: nfts.data.pagination.next_key,
        },
        () => {
          this.setState(
            {
              currentElementId:
                      this.state.nftList[this.state.nftList.length - 1].id,
            },
          );
          this.observer();
        },
      );
      break;

    default:
      break;
    }
  };

  observer = () => {
    const macy = Macy({
      container: `.nft-${this.props.match.params.type}`, // 容器元素的选择器
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
        document.querySelector(`.nft-${this.props.match.params.type}`).addEventListener('scroll', () => {
          // Get the position and size of the box element relative to the viewport
          let elementId = this.state.currentElementId;
          if (elementId === null) return;
          let rect = document
            .querySelector(`.${elementId}`)
            .getBoundingClientRect();
          // Check if the box element is in view
          let inView =(
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <=
              (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <=
              (window.innerWidth || document.documentElement.clientWidth));

          // Change the background color of the box element if it is in view
          if (inView) {
            if(this.state.isLoading) return;
            this.getMore();
          } else {
          }
        });
      },
    );
  };

  goCollect = (nft) =>{
    this.setState({
      isOpen: true,
      nftId: nft,
    });
  };

  onConfirmCancel = () => {
    this.setState({
      isOpen: false,
    });
  };

  onConfirmConfirm = () =>{
    const { nftId } = this.state;
    window.open(`https://liker.land/zh-Hant/nft/class/${nftId}?action=collect`, '_blank');
  };

  goRead = (nft) =>{
    this.setState({
      isDrawerDisplay: true,
      currentReadingNft: nft,
    });
    // window.open(nft.external_url, '_blank');
  };

  goNftDetail = (e) =>{
    this.context.router.history.push(`/writingnft-detail/${e.id}`, { from: 'writingnft', nft: e });
  };

  goReadNft = (e) =>{
    this.context.router.history.push(`/writingnft-frame/${e.id}`, { from: 'writingnft', nft: e });
  };

  closeDrawer = (e) =>{
    this.setState({
      isDrawerDisplay: false,
    });
  };

  componentWillUnmount(){
    console.log('remove');
  }

  componentWillReceiveProps(){

  }


  componentDidUpdate(){
    if (this.state.macy) {
      this.state.macy.recalculate(true);
    }
    if(this.props.match.params.type !== this.state.currentTab){
      this.setState({
        currentTab: this.props.match.params.type,
        nftList: [],
        rawNftList: [],
      }, () => {
        this.renderList(this.props.match.params.type);
      });
    }

  }
  async componentDidMount() {
    this.renderList(this.props.match.params.type);
    let coinData = await getCoinPrice();
    this.setState({
      likecoin: coinData.data.likecoin,
      currentTab: this.props.match.params.type,
    });
  }

  render() {
    const { isLoading, nftList, rawNftList, isOpen, likecoin, currentReadingNft, isDrawerDisplay } = this.state;
    const { match, multiColumn } = this.props;
    return (
      nftList.length === 0 ? <Spinner className='nft-list-container next' size={20} /> :      <div className='nft-list-container'>
        <div className={`nft-list nft-${match.params.type}`} >
          {nftList.map((nft, ndx) => (
            <div class={'nft-container'} key={nft.id}>
              {/* <div>{nft.id}</div> */}
              {/* <Tag>{ndx+1}</Tag> */}
              <div class='container'>

                <div class='book' onClick={this.goRead.bind(this, nft)}>
                  <div class='front'>
                    <div class='cover'>
                      <img
                        className='nft-image'
                        alt={nft.name}
                        // onClick={this.goNftDetail.bind(this, nft)}
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
                        alt={nft.owner ? nft.owner.likeWallet : ''}
                        src={nft.owner ? nft.owner.avatar : ''}
                      />
                      <span>{nft.owner.displayName}</span>

                      {/* <span>{nft.name}</span> */}
                    </h2>
                  </div>
                </div>
              </div>
              {/* <div class='book'>
                <div class='back' />
                <div class='page6' />
                <div class='page5' />
                <div class='page4' />
                <div class='page3'  />
                <div class='page2' />
                <div class='page1' />
                <div class='front' >
                  <img
                    className='nft-image'
                    alt={nft.name}
                    onClick={this.goNftDetail.bind(this, nft)}
                    src={`https://api.like.co/likernft/metadata/image/class_${nft.id}?size=450`}
                  />

                </div>
              </div> */}
              <div className='nft-info'>
                <div class={`nft-title  ${nft.id}`}>{nft.name}</div>
                {/* <div class='nft-description '>{nft.description}</div> */}
                <div className='nft-labels'>
                  <div class='label'>
                    <span>
                      Price:{' '}
                      {nft.currentPrice
                        ? (nft.currentPrice / 1000000000).toFixed(0)
                        : 0}{' '}
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
                      alt={nft.owner ? nft.owner.likeWallet : ''}
                      src={nft.owner ? nft.owner.avatar : ''}
                    />

                    <div class={'author-name'}>{nft.owner.displayName}</div>
                  </div>
                  <div className='nft-buttons'>
                    {/* <div className='nft-collect item' onClick={this.goReadNft.bind(this, nft)}> 讀原文</div> */}
                    <div className='nft-origial item' onClick={this.goCollect.bind(this, nft.id)}>{likecoin?.usd ? ((nft?.latest_price || 1000000000 )/ 1000000000 * likecoin.usd).toFixed(2)  + ' USD': ((nft.latest_price || 1000000000) / 1000000000).toFixed(2) + ' LIKE'}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          { rawNftList.length===nftList.length ? <div className='next'> Nothing more... </div> : isLoading === true ? <Spinner size={20} /> : <Spinner size={20} />}
        </div>
        <Alert
          className='nft-collect-confirm'
          cancelButtonText='作罷'
          confirmButtonText='去收藏'
          icon='info-sign'
          intent={Intent.SUCCESS}
          isOpen={isOpen}
          onCancel={this.onConfirmCancel}
          onConfirm={this.onConfirmConfirm.bind(this)}
        >
          <p>
            Liker.Social 將引入購買<b> NFT </b>功能, 現在暫時你需要跳轉到 Liker.Land 購買, 點按「去收藏」同意跳轉
          </p>
        </Alert>
        <Drawer size={DrawerSize.LARGE} position='bottom' isOpen={isDrawerDisplay} canOutsideClickClose='true' canEscapeKeyClose='true'>
          <Button onClick={this.closeDrawer.bind(this)}>關閉閱讀</Button>
          <ScrollContainer scrollKey='thread'>
            <iframe className='reading-area' title={currentReadingNft ? currentReadingNft.name : ''}  src={currentReadingNft ? currentReadingNft.meta.external_url : ''} width='100%' height='100%' />
          </ScrollContainer>
        </Drawer>
      </div>
    );
  }

}
