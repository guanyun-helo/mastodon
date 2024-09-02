/* eslint-disable react/jsx-no-bind */
import PropTypes from 'prop-types';
import React from 'react';

import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';

import { Helmet } from 'react-helmet';
import { withRouter } from 'react-router-dom';

import ImmutablePropTypes from 'react-immutable-proptypes';
import ImmutablePureComponent from 'react-immutable-pure-component';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';

import { getLikeAuth, getLikerId } from 'mastodon/actions/accounts';
import { changeDrawer } from 'mastodon/actions/app';
import Column from 'mastodon/components/column';
import ColumnHeader from 'mastodon/components/column_header';
import { LoadingIndicator } from 'mastodon/components/loading_indicator';
import ScrollableList from 'mastodon/components/scrollable_list';

// import vips from 'images/vips/vips.png';
import VerifiedUser from '@/material-icons/400-24px/verified_user.svg?react';
import { Icon } from 'mastodon/components/icon'; import api from '../../api';
import './index.scss';

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
  signer: state.getIn(['meta', 'signer']),
});
const mapDispatchToProps = (dispatch) => ({
  openDrawer: (type, props) => dispatch(changeDrawer(true)),
  getLikeAuth: (location, callback) =>
    dispatch(getLikeAuth(location, callback)),
  getLikerId: (location, callback) => dispatch(getLikerId(location, callback)),
});


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
      isDarkTheme: false,
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

  detectTheme = () => {
    const isDark = !document.body?.classList.contains('theme-mastodon-light');
    this.setState({ isDarkTheme: isDark });
  };

  componentDidMount() {
    this.getLikerId();
    this.detectTheme();
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

  connectWallet = async () => {
    if (this.props.signer === null) {
      // let signer = await props.connectMethods.initIfNecessary();
      await this.props.connectMethods.initWallet();
      // await props.connectMethods.connect();
      return;
      // await props.changeSigner(signer.offlineSigner);
    }
    this.props.connectMethods.connect();
  };

  disConnectWallet = () => {
    this.props.connectMethods.disconnect();
  };

  render() {
    const { intl, lists, multiColumn } = this.props;
    const { user, isDarkTheme } = this.state;

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
        className={`liker-id-bind`}
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
          <div className={`liker-id-container instagram-style ${isDarkTheme ? 'dark-theme' : 'light-theme'}`}>
            <div className='liker-id-content'>
              <div className='liker-id-profile'>
                <div className='profile-picture'>
                  {user.avatar !== 'default' && <img src={user.avatar} alt={user.displayName} />}
                </div>
                <div className='profile-info'>
                  <h2 className='username'>{user.displayName === 'default' ? 'Not Bound' : user.displayName}</h2>
                  <p className='bio'>{user.description}</p>
                  <button
                    onClick={this.bindLikeCoinId.bind(this)}
                    className={`action-button ${user.displayName === 'default' ? 'primary' : 'secondary'}`}
                  >
                    {user.displayName === 'default' ? intl.formatMessage(messages.heading) : intl.formatMessage(messages.rebind)}
                  </button>
                </div>
              </div>
              <div className='tips-container'>
                <h3 className='tips-title'>Tips</h3>
                <ul className='tips-list'>
                  <li>
                    LikerID: 指的是你通過 BindLikerID 功能綁定的
                    ID，其承擔的作用是在拍手時發送和接收 LikeCoin。
                  </li>
                  <li>
                    Wallet Connect: 指的是你通過 connect wallet 綁定的
                    區塊鏈錢包，其承擔的功能是鑄造、購買、贈送 nft 功能。
                  </li>
                  <li>
                    兩個功能並行不悖，LikerID 屬於 web2 世代, 而 Wallet Connect
                    屬於 web3 世代，並且爲了保護你的隱私，Wallet Connect
                    的設計是沙盒式的，其不留存個人資料。你可以任意綁定。
                  </li>
                </ul>
              </div>

              <div className='patreon-container'>
                <h3 className='patreon-title'>Subscribe to Our Patreon - 贊助我們，獲得藍勾勾 <Icon id='VerifiedUser' icon={VerifiedUser} /></h3>
                <p className='patreon-description'>Support us on Patreon and enjoy exclusive benefits - 享受獨特權益!</p>
                <a href='https://www.patreon.com/liker_social?fan_landing=true&rel=me' target='_blank' rel='noopener noreferrer' className='patreon-button'>
                  Become a Patron
                </a>
                <div className='benefits-container'>
                  <h4 className='benefits-title'>Patron Benefits:</h4>
                  <ul className='benefits-list'>
                    <li>學員 (Cadet)：@Editor 幫你推廣嘟文</li>
                    <li>中尉 (Lieutenant)：在 Liker.Social 的公告欄發布公告</li>
                    <li>艦長 (Captain)：
                      <ul style={{marginLeft: '10px',marginTop: '5px'}}>
                        <li>你可以在 Liker.Social 的公告欄發布公告</li>
                        <li>你可以自定義伺服器表情符號的權利</li>
                      </ul>
                    </li>
                    <li>不同會員等級專享不同徽章</li>
                    <li>平台特別藍勾認證</li>
                    <li>優先支援服務</li>
                  </ul>
                </div>
              </div>
            </div>
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

const WithRouter = withRouter(LikerId);
const WithIntl = injectIntl(WithRouter);
const ConnectedLikerId = connect(mapStateToProps, mapDispatchToProps)(WithIntl);

export default ConnectedLikerId;
