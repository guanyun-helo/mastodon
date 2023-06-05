/* eslint-disable react/jsx-no-bind */
import * as React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';

import Icon from 'mastodon/components/icon';
import { changeDrawer } from 'mastodon/actions/app';
import { Tab, Tabs, Drawer, DrawerSize, Callout } from '@blueprintjs/core';
import NftList from './component/nft_list';
import { Tooltip2 } from '@blueprintjs/popover2';
import {
  getLikerInfoByAddress,
  getSaleStatsByAddress,
  getCoinPrice,
  getCollectRankByCollecterAddress,
} from '../../utils/api/like';

export class NftDrawer extends React.Component {

  static propTypes = {
    address: '',
    drawerParams: {},
    profileAddress: '',
    drawerType: '',
    dispatch: PropTypes.func,
  };
  // find options in state;
  // and stringify all value in options
  state = {
    address: '',
    profileAddress: '',
    currentTab: 'collect',
  };
  componentDidUpdate() {
    const { address, profileAddress, drawerParams } = this.props;
    if (drawerParams.isWalletDrawerOpen === false) return;
    if (
      drawerParams.drawerType === 'wallet' &&
      address !== this.state.address
    ) {
      this.setState({ address });
      this.getProfile(address);
    }
    if (
      drawerParams.drawerType === 'profile' &&
      profileAddress !== this.state.address
    ) {
      this.setState({ address: profileAddress });
      this.getProfile(profileAddress);
    }
  }

  handleTabChange = (e) => {
    this.setState({
      currentTab: e,
    });
  };

  getProfile = async (address) => {
    let result = await getLikerInfoByAddress(address);
    if (result === undefined) {
      result = {
        avatar: 'https://like.co/_nuxt/img/62834a5.svg',
        displayName: 'Liker',
        description: '',
        likeWallet: address,
        isRegistered: false,
      };
    }
    let sales = await getSaleStatsByAddress(address);
    let coinPrice = await getCoinPrice(address);
    this.setState({
      profile: result,
      saleStats: sales,
      coinPrice: coinPrice?.likecoin,
    });
  };
  closeWalletDrawer = () => {
    this.setState({
      address: '',
      profileAddress: '',
      currentTab: 'collect',
    });
    this.props.dispatch(changeDrawer({ isDrawerOpen: false }));
  };

  componentDidMount() {}
  render() {
    const { intl, lists, profileAddress, multiColumn, drawerParams } =
      this.props;
    const { address, profile, saleStats, coinPrice, currentTab } = this.state;
    if (!profile?.likeWallet) return <div />;
    return (
      <div class='nft-drawer'>
        <Drawer
          isOpen={drawerParams.isDrawerOpen}
          className='wallet-drawer'
          icon='id-number'
          onClose={this.closeWalletDrawer}
          title='Wallet'
          size={screen.width > 600 ? '50%' : '90%'}
        >
          {drawerParams.isDrawerOpen === true ? (
            <div class='wallet-drawer-container'>
              {profile.isRegistered === false ? (
                <Callout>
                  你似乎還沒有用此錢包註冊 LikerID{' '}
                  <a target='_blank' href='https://like.co/in/register'>
                    點此
                  </a>
                  註冊吧！
                </Callout>
              ) : null}
              <img src={profile.avatar} alt='Avatar' class='avatar' />
              {/* <div className='logout' onClick={this.disconnect}>
              <Icon id='right-from-bracket' className='column-link__icon' />
              <div>Log Out</div>
            </div> */}
              <div class='name'>{profile.displayName}</div>
              <div class='wallet'>{profile.likeWallet}</div>
              {/* <div class='wallet'>{profile.cosmosWallet}</div> */}
              {/* <div class='wallet'>{profile.wallet}</div> */}

              <div class='intro'>{profile.description}</div>
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
                  <div class='label'>NFT Value</div>
                  <div class='value'>
                    {saleStats.collectedValue} LIKE{' '}
                    {+' ≈ ' + coinPrice?.likecoin
                      ? `${(
                        saleStats.collectedValue * coinPrice?.likecoin?.usd
                      ).toFixed(1)} USD`
                      : ''}
                  </div>
                </div>
              </div>
              <div class='lists'>
                <div className='profile-nft-zone'>
                  <ul>
                    <button
                      id='collect'
                      type='button'
                      className={`tab ${
                        currentTab === 'collect' ? 'active' : ''
                      }`}
                      onClick={() => this.handleTabChange('collect')}
                    >
                      我收藏的 NFT
                    </button>
                    <button
                      id='latest'
                      type='button'
                      className={`tab ${
                        currentTab === 'latest' ? 'active' : ''
                      }`}
                      onClick={() => this.handleTabChange('latest')}
                    >
                      我創作的 NFT
                    </button>
                  </ul>
                  <div className='tab-content'>
                    {' '}
                    {drawerParams.isDrawerOpen === true ? (
                      <>
                        <NftList
                          className='nft-list-collect'
                          likerInfo={profile}
                          isDrawerOpen={drawerParams.isDrawerOpen}
                          address={
                            profileAddress.length !== 0 ? profileAddress : ''
                          }
                          selected={currentTab === 'collect' ? true : false}
                          contentType='collect'
                        />

                        <NftList
                          className='nft-list-latest'
                          likerInfo={profile}
                          isDrawerOpen={drawerParams.isDrawerOpen}
                          address={
                            profileAddress.length !== 0 ? profileAddress : ''
                          }
                          selected={currentTab === 'latest' ? true : false}
                          contentType='latest'
                        />
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </Drawer>
      </div>
    );
  }

}
