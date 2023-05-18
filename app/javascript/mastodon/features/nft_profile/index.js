/* eslint-disable react/jsx-no-bind */
import * as React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';

import Icon from 'mastodon/components/icon';
import { changeDrawer } from 'mastodon/actions/app';
import { Tab, Tabs, Drawer, DrawerSize } from '@blueprintjs/core';
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

  getProfile = async (address) => {
    let result = await getLikerInfoByAddress(address);
    let sales = await getSaleStatsByAddress(address);
    let coinPrice = await getCoinPrice(address);
    this.setState({
      profile: result.data,
      saleStats: sales.data,
      coinPrice: coinPrice.data?.likecoin,
    });
  };
  closeWalletDrawer = () => {
    this.props.dispatch(changeDrawer({ isDrawerOpen: false }));
  };

  componentDidMount() {}
  render() {
    const { intl, lists, multiColumn, drawerParams } = this.props;
    const { address, profile, saleStats, coinPrice, currentTab } = this.state;

    if (!profile?.likeWallet) return <>1</>;
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
          <div class='wallet-drawer-container'>
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
                <div class='label'>Saled Value</div>
                <div class='value'>
                  {saleStats.collectedValue} LIKE ≈{' '}
                  {coinPrice?.likecoin
                    ? `${(
                      saleStats.collectedValue * coinPrice?.likecoin?.usd
                    ).toFixed(1)} USD`
                    : ''}
                </div>
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
                  panel={
                    <NftList
                      likerInfo={profile}
                      address={address !== 0 ? address : ''}
                      selected={currentTab === 'latest' ? true : false}
                      contentType='latest'
                    />
                  }
                  panelClassName='nft-list-latest'
                />
                <Tab
                  id='collect'
                  title='我收藏的 NFT'
                  panel={
                    <NftList
                      likerInfo={profile}
                      address={address !== 0 ? address : ''}
                      selected={currentTab === 'collect' ? true : false}
                      contentType='collect'
                    />
                  }
                  panelClassName='nft-list-collect'
                />
              </Tabs>
            </div>
          </div>
        </Drawer>
      </div>
    );
  }

}
