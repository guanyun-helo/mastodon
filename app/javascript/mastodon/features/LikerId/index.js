/* eslint-disable react/jsx-no-bind */
import PropTypes from 'prop-types';
import React from 'react';
import { Helmet } from 'react-helmet';
import ImmutablePropTypes from 'react-immutable-proptypes';
import ImmutablePureComponent from 'react-immutable-pure-component';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { createSelector } from 'reselect';
import Icon from 'mastodon/components/icon';
import LoadingIndicator from 'mastodon/components/loading_indicator';
import ScrollableList from 'mastodon/components/scrollable_list';
import Column from 'mastodon/components/column';
import ColumnHeader from 'mastodon/components/column_header';
import { Button, Card, Elevation, Callout } from '@blueprintjs/core';
import { getLikeAuth, getLikerId } from 'mastodon/actions/accounts';
import { changeDrawer } from 'mastodon/actions/app';
import api from '../../api';

const messages = defineMessages({
  heading: { id: 'liker.bind_id', defaultMessage: 'Bind your Liker Id' },
  rebind: { id: 'liker.rebind', defaultMessage: 'Rebind your Liker Id' },
  subheading: { id: 'lists.subheading', defaultMessage: 'Your lists' },
});

const getOrderedLists = createSelector(
  [(state) => state.get('lists')],
  (lists) => {
    if (!lists) {
      return lists;
    }

    return lists
      .toList()
      .filter((item) => !!item)
      .sort((a, b) => a.get('title').localeCompare(b.get('title')));
  },
);

const mapStateToProps = (state) => ({
  lists: getOrderedLists(state),
  connectMethods: state.getIn(['meta', 'connectMethods']),
  address: state.getIn(['meta', 'address']),
});
const mapDispatchToProps = (dispatch) => ({
  openDrawer: (type, props) => dispatch(changeDrawer(true)),
  getLikeAuth: (location, callback) =>
    dispatch(getLikeAuth(location, callback)),
  getLikerId: (location, callback) => dispatch(getLikerId(location, callback)),
});

export default
@connect(mapStateToProps, mapDispatchToProps)
@injectIntl
@withRouter
class LikerId extends ImmutablePureComponent {

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
    liker_id: 'Click to bind',
    user: {
      user: 'default',
      displayName: 'default',
      avatar: 'default',
      wallet: 'default',
      cosmosWallet: 'default',
      likeWallet: 'default',
      isSubscribedCivicLiker: true,
      description: 'civicLikerSince: default',
    },
  };

  getLikerId() {
    this.props.getLikerId((data) => {
      this.setState({
        liker_id: data.data.liker_id,
      });
      api()
        .get(`https://api.like.co/users/id/${data.data.liker_id}/min`)
        .then((res) => {
          this.setState({
            user: res.data,
          });
        });
    });
  }

  componentDidMount() {
    this.getLikerId();
  }

  bindLikeCoinId() {
    if (location.href !== 'https://liker.social/home') {
      this.props.history.push('/home');
    }
    this.props.getLikeAuth(window.location, (res) => {
      if (res.data.code === 301) {
        location.href = 'https://like.co' + res.data.url;
      }
    });
  }

  connectWallet = () => {
    this.props.connectMethods.connect();
  };

  disConnectWallet = () => {
    this.props.connectMethods.disconnect();
  };

  render() {
    const { intl, lists, multiColumn, openDrawer, address } = this.props;
    const { user } = this.state;
    if (!lists) {
      return (
        <Column>
          <LoadingIndicator />
        </Column>
      );
    }

    const emptyMessage = (
      <FormattedMessage
        id='empty_column.lists'
        defaultMessage="You don't have any lists yet. When you create one, it will show up here."
      />
    );

    return (
      <Column
        bindToDocument={!multiColumn}
        label={intl.formatMessage(messages.heading)}
      >
        <ColumnHeader
          title={intl.formatMessage(messages.heading)}
          icon='list-ul'
          multiColumn={multiColumn}
          showBackButton
        />

        <ScrollableList
          scrollKey='lists'
          emptyMessage={emptyMessage}
          bindToDocument={!multiColumn}
        >
          <div className='bind-liker-id'>
            {/* {address} */}

            <div className='bind-area'>
              <div className='bind-button-area'>
                <Card interactive elevation={Elevation.TWO}>
                  <h5>
                    <a href='#'>Liker ID</a>
                  </h5>
                  <p>
                    {user.displayName === 'default'
                      ? 'not bind'
                      : user.displayName}
                  </p>
                  <Button
                    onClick={this.bindLikeCoinId.bind(this)}
                    intent={user.displayName === 'default' ? 'success' : 'Warning'}
                    size='large'
                    className='bind-liker-button'
                  >
                    {user.displayName === 'default' ? intl.formatMessage(messages.heading) : intl.formatMessage(messages.rebind)}
                  </Button>
                </Card>
                <Card interactive elevation={Elevation.TWO}>
                  <h5>
                    <a href='#'>Wallet Connect</a>
                  </h5>
                  <p>{address}</p>
                  <Button
                    onClick={address ? this.disConnectWallet : this.connectWallet}
                    intent={address ? 'Warning' : 'success'}
                    size='large'
                    className='bind-liker-button'
                  >
                    {address ? 'Disconnect' : 'Connect wallet'}
                  </Button>
                </Card>
              </div>
              <Callout title='Tips'>
                <ul>
                  <li>
                    LikerID: 指的是你通過 BindLikerID 功能綁定的
                    ID，其承擔的作用是在拍手時發送和接收 LikeCoin。{' '}
                  </li>
                  <li>
                    Wallet Connect: 指的是你通過 connect wallet 綁定的
                    區塊鏈錢包，其承擔的功能是鑄造、購買、贈送 nft 功能。{' '}
                  </li>
                  <li>
                    {' '}
                    兩個功能並行不悖，LikerID 屬於 web2 世代, 而 Wallet Connect
                    屬於 web3 世代，並且爲了保護你的隱私，Wallet Connect
                    的設計是沙盒式的，其不留存個人資料。你可以任意綁定。{' '}
                  </li>
                </ul>
              </Callout>
            </div>

            {/* <Card interactive elevation={Elevation.TWO}>
              <div class='container'>
                <div class='profile'>
                  <img src={user.avatar} alt='' class='avatar' />
                  <div class='name'>{user.displayName}</div>
                  <div class='wallet'>{user.likeWallet}</div>
                  <div class='vip'>{user.isSubscribedCivicLiker? 'Civic Liker' : 'Liker'}</div>
                  <div class='description'>{user.description}</div>

                  <div className='bind-area'>
                    <Callout title='Tips'>
                      <ul>
                        <li>LikerID: 指的是你通過 BindLikerID 功能綁定的 ID，其承擔的作用是在拍手時發送和接收 LikeCoin。 </li>
                        <li>Wallet Connect: 指的是你通過 connect wallet 綁定的 區塊鏈錢包，其承擔的功能是鑄造、購買、贈送 nft 功能。 </li>
                        <li> 兩個功能並行不悖，LikerID 屬於 web2 世代, 而 Wallet Connect 屬於 web3 世代，並且爲了保護你的隱私，Wallet Connect 的設計是沙盒式的，其不留存個人資料。你可以任意綁定。 </li>
                      </ul>
                    </Callout>
                    <div className='bind-button-area'>
                      <Button
                        onClick={this.bindLikeCoinId.bind(this)}
                        intent='danger'
                        size='large'
                        className='bind-liker-button'
                      >
                        {intl.formatMessage(messages.rebind)}
                      </Button>
                      <Button
                        onClick={this.connectWallet.bind(this)}
                        intent='danger'
                        size='large'
                        className='bind-liker-button'
                      >
                        Connect wallet
                      </Button>
                    </div>
                  </div>
                  {/* <Button
                      onClick={this.bindLikeCoinId.bind(this)}
                      intent='danger'
                      size='large'
                      className='bind-liker-button'
                    >
                      {intl.formatMessage(messages.rebind)}
                    </Button>
                    </div>
                    </div>
                  </Card> */}
          </div>
        </ScrollableList>
        <Helmet>
          <title>{intl.formatMessage(messages.heading)}</title>
          <meta name='robots' content='noindex' />
        </Helmet>
      </Column>
    );
  }

}
