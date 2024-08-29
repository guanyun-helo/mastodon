import PropTypes from 'prop-types';

import { defineMessages, injectIntl } from 'react-intl';

import { Helmet } from 'react-helmet';

import { List as ImmutableList } from 'immutable';
import ImmutablePropTypes from 'react-immutable-proptypes';
import ImmutablePureComponent from 'react-immutable-pure-component';
import { connect } from 'react-redux';

import queryString from 'query-string';

import AlternateEmailIcon from '@/material-icons/400-24px/alternate_email.svg?react';
import BookmarksIcon from '@/material-icons/400-24px/bookmarks-fill.svg?react';
import ExploreIcon from '@/material-icons/400-24px/explore.svg?react';
import PeopleIcon from '@/material-icons/400-24px/group.svg?react';
import HomeIcon from '@/material-icons/400-24px/home-fill.svg?react';
import ListAltIcon from '@/material-icons/400-24px/list_alt.svg?react';
import MenuIcon from '@/material-icons/400-24px/menu.svg?react';
import PersonAddIcon from '@/material-icons/400-24px/person_add.svg?react';
import PublicIcon from '@/material-icons/400-24px/public.svg?react';
import SettingsIcon from '@/material-icons/400-24px/settings-fill.svg?react';
import StarIcon from '@/material-icons/400-24px/star.svg?react';
import { fetchFollowRequests, getLikeAuth, getLikerId, getTimeLine } from 'mastodon/actions/accounts';
import Column from 'mastodon/components/column';
import ColumnHeader from 'mastodon/components/column_header';
import LinkFooter from 'mastodon/features/ui/components/link_footer';
import { identityContextPropShape, withIdentity } from 'mastodon/identity_context';



//like
import LikeCoinAirdrop from '../../../images/airdrop/background.png';
import LikeCoinStake from '../../../images/airdrop/stake.png';
import LikeCoinClapDark from "../../../images/likebutton/like-calp-dark.svg";
import LikeCoinClap from "../../../images/likebutton/like-clap-white.svg";
import api from '../../api';
import { me, showTrends } from '../../initial_state';
import { NavigationBar } from '../compose/components/navigation_bar';
import ColumnLink from '../ui/components/column_link';
import ColumnSubheading from '../ui/components/column_subheading';

import TrendsContainer from './containers/trends_container';

const messages = defineMessages({
  home_timeline: { id: 'tabs_bar.home', defaultMessage: 'Home' },
  notifications: { id: 'tabs_bar.notifications', defaultMessage: 'Notifications' },
  public_timeline: { id: 'navigation_bar.public_timeline', defaultMessage: 'Federated timeline' },
  settings_subheading: { id: 'column_subheading.settings', defaultMessage: 'Settings' },
  community_timeline: { id: 'navigation_bar.community_timeline', defaultMessage: 'Local timeline' },
  explore: { id: 'navigation_bar.explore', defaultMessage: 'Explore' },
  direct: { id: 'navigation_bar.direct', defaultMessage: 'Private mentions' },
  bookmarks: { id: 'navigation_bar.bookmarks', defaultMessage: 'Bookmarks' },
  preferences: { id: 'navigation_bar.preferences', defaultMessage: 'Preferences' },
  follow_requests: { id: 'navigation_bar.follow_requests', defaultMessage: 'Follow requests' },
  favourites: { id: 'navigation_bar.favourites', defaultMessage: 'Favorites' },
  blocks: { id: 'navigation_bar.blocks', defaultMessage: 'Blocked users' },
  domain_blocks: { id: 'navigation_bar.domain_blocks', defaultMessage: 'Blocked domains' },
  mutes: { id: 'navigation_bar.mutes', defaultMessage: 'Muted users' },
  pins: { id: 'navigation_bar.pins', defaultMessage: 'Pinned posts' },
  lists: { id: 'navigation_bar.lists', defaultMessage: 'Lists' },
  discover: { id: 'navigation_bar.discover', defaultMessage: 'Discover' },
  personal: { id: 'navigation_bar.personal', defaultMessage: 'Personal' },
  security: { id: 'navigation_bar.security', defaultMessage: 'Security' },
  menu: { id: 'getting_started.heading', defaultMessage: 'Getting started' },
});

const mapStateToProps = state => ({
  myAccount: state.getIn(['accounts', me]),
  unreadFollowRequests: state.getIn(['user_lists', 'follow_requests', 'items'], ImmutableList()).size,
});

const mapDispatchToProps = dispatch => ({
  fetchFollowRequests: () => dispatch(fetchFollowRequests()),
  getLikeAuth: (location, callback) => dispatch(getLikeAuth(location, callback)),
  getTimeLine: (code, location, callback) => dispatch(getTimeLine(code, location, callback)),
});

const badgeDisplay = (number, limit) => {
  if (number === 0) {
    return undefined;
  } else if (limit && number >= limit) {
    return `${limit}+`;
  } else {
    return number;
  }
};

class GettingStarted extends ImmutablePureComponent {
  static propTypes = {
    identity: identityContextPropShape,
    intl: PropTypes.object.isRequired,
    myAccount: ImmutablePropTypes.record,
    multiColumn: PropTypes.bool,
    fetchFollowRequests: PropTypes.func.isRequired,
    getLikeAuth: PropTypes.func,
    unreadFollowRequests: PropTypes.number,
    unreadNotifications: PropTypes.number,
  };

  state = {
    clapImg: LikeCoinClap,
    liker_id: 'Click to bind',
    coins: {
      cosmos: { usd: 0, usd_market_cap: 0, usd_24h_vol: 0, usd_24h_change: 0, last_updated_at: 0 },
      likecoin: { usd: 0, usd_market_cap: 0, usd_24h_vol: 0, usd_24h_change: 0, last_updated_at: 0 },
      bitcoin: { usd: 0, usd_market_cap: 0, usd_24h_vol: 0, usd_24h_change: 0, last_updated_at: 0 },
      cosmos: { usd: 0, usd_market_cap: 0, usd_24h_vol: 0, usd_24h_change: 0, last_updated_at: 0 },
      'crypto-com-chain': { usd: 0, usd_market_cap: 0, usd_24h_vol: 0, usd_24h_change: 0, last_updated_at: 0 },
      ethereum: { usd: 0, usd_market_cap: 0, usd_24h_vol: 0, usd_24h_change: 0, last_updated_at: 0 },
      likecoin: { usd: 0, usd_market_cap: 0, usd_24h_vol: 0, usd_24h_change: 0, last_updated_at: 0 },
      osmosis: { usd: 0, usd_market_cap: 0, usd_24h_vol: 0, usd_24h_change: 0, last_updated_at: 0 },
      ion: { usd: 0, usd_market_cap: 0, usd_24h_vol: 0, usd_24h_change: 0, last_updated_at: 0 },

    },
  };

  componentDidMount() {
    if (document.body && document.body.classList.contains('theme-mastodon-light')) {
      this.setState({
        clapImg: LikeCoinClapDark,
      });
    }
    const { fetchFollowRequests } = this.props;
    const { signedIn } = this.props.identity;

    if (!signedIn) {
      return;
    }
    const code = queryString.parse(location.search).code;

    if (code && code.length > 0) {
      const params = new URLSearchParams();
      params.append('code', code);
      this.props.getTimeLine(code, location, (response) => {
        if (response.data.code === 200) {
          this.props.myAccount.set('liker_id', response.data.user);
          if (response.data.user) {
            this.setState({
              liker_id: response.data.user,
            });
          }
        }
        this.getLikerId();
      });
      // api().get(`/api/v1/timelines/home?code=${code}&url=${location.origin}${location.pathname}`).then(response => {
      //   // dispatch(unblockAccountSuccess(response.data));
      //   if (response.data.code === 200) {
      //     this.props.myAccount.set('liker_id', response.data.user)
      //     if (response.data.user) {
      //       this.setState({
      //         liker_id: response.data.user
      //       })
      //     }
      //   }
      //   this.getLikerId()
      // }).catch(error => {
      //   // dispatch(unblockAccountFail(id, error));
      // });
    }
    fetchFollowRequests();
    this.getCoinPrice();
    const liker_id = this.props.myAccount.get('liker_id');
    if (liker_id) {
      this.setState({
        liker_id: liker_id,
      });
    }


  }
  bindLikeCoinId() {
    const { getLikeAuth } = this.props;
    getLikeAuth(window.location, (res) => {
      if (res.data.code === 301) {
        location.href = 'https://like.co' + res.data.url;
      }
    });
  }
  getLikerId() {
    getLikerId((data) => {
      this.setState({
        liker_id: response.data.liker_id,
      });
    });
  }

  getCoinPrice() {
    api().get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,cosmos,ion,crypto-com-chain,osmosis,likecoin&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&include_last_updated_at=true').then(response => {
      // if(response.data.code === 200){

      if (response.status === 200) {
        this.setState({
          coins: response.data,
        });
      }
      // }
    });
  }

  render() {
    const { intl, myAccount, multiColumn, unreadFollowRequests } = this.props;
    const { signedIn } = this.props.identity;

    const { coins } = this.state;
    const navItems = [];

    navItems.push(
      <ColumnSubheading key='header-discover' text={intl.formatMessage(messages.discover)} />,
    );

    if (showTrends) {
      navItems.push(
        <ColumnLink key='explore' icon='explore' iconComponent={ExploreIcon} text={intl.formatMessage(messages.explore)} to='/explore' />,
      );
    }

    height += 34 + 48 * 2;
    navItems.push(
      <ColumnLink key='community_timeline' icon='users' iconComponent={PeopleIcon} text={intl.formatMessage(messages.community_timeline)} to='/public/local' />,
      <ColumnLink key='public_timeline' icon='globe' iconComponent={PublicIcon} text={intl.formatMessage(messages.public_timeline)} to='/public' />,
    );

    if (signedIn) {
      navItems.push(
        <ColumnSubheading key='header-personal' text={intl.formatMessage(messages.personal)} />,
        <ColumnLink key='home' icon='home' iconComponent={HomeIcon} text={intl.formatMessage(messages.home_timeline)} to='/home' />,
        <ColumnLink key='direct' icon='at' iconComponent={AlternateEmailIcon} text={intl.formatMessage(messages.direct)} to='/conversations' />,
        <ColumnLink key='bookmark' icon='bookmarks' iconComponent={BookmarksIcon} text={intl.formatMessage(messages.bookmarks)} to='/bookmarks' />,
        <ColumnLink key='favourites' icon='star' iconComponent={StarIcon} text={intl.formatMessage(messages.favourites)} to='/favourites' />,
        <ColumnLink key='lists' icon='list-ul' iconComponent={ListAltIcon} text={intl.formatMessage(messages.lists)} to='/lists' />,
        <div key='liker-id' onClick={this.bindLikeCoinId.bind(this)} className='liker-id column-link'>
          <img src={this.state.clapImg} />
          <div className='bind'>Liker Id ({this.state.liker_id})</div>
        </div>,
      );

      const airdrop = {
        backgroundImage: `url(${LikeCoinAirdrop})`, backgroundRepeat: 'no-repeat',
        'backgroundPosition': 'center',
        'backgroundSize': 'cover',
        color: 'black',
      };

      const stake = {
        backgroundImage: `url(${LikeCoinStake})`, backgroundRepeat: 'no-repeat',
        'backgroundPosition': 'center',
        'backgroundSize': 'cover',
        color: 'black',
      };

      if (myAccount.get('locked') || unreadFollowRequests > 0) {
        navItems.push(<ColumnLink key='follow_requests' icon='user-plus' iconComponent={PersonAddIcon} text={intl.formatMessage(messages.follow_requests)} badge={badgeDisplay(unreadFollowRequests, 40)} to='/follow_requests' />);
      }

      navItems.push(
        <ColumnSubheading key='header-settings-crypto' text={'Cryptos'} />,
        <div style={stake} className='column-link' key='airdrop' icon='gears' text={'LIKE'}  ><a
          style={{
            display: 'inline-block', minHeight: '30px', width: '100%',
          }} href='https://dao.like.co/validators/likevaloper1mztweu8y2lazpapfgtqmadxaqaapyasv7nhexk' target='_blank'
        /></div>,


        <div className='column-link' key='BTC' icon='gears' text={'BTC'}  >BTC: {coins.bitcoin.usd.toFixed(2)} usd <div className={coins.bitcoin.usd_24h_change > 0 ? 'price-change price-change-red' : 'price-change price-change-green'}>{coins.bitcoin.usd_24h_change.toFixed(2) > 0 ? '+' : null} {coins.bitcoin.usd_24h_change.toFixed(2)} %</div></div>,
        <div className='column-link' key='ETH' icon='gears' text={'ETH'}  >ETH: {coins.ethereum.usd.toFixed(2)} usd <div className={coins.ethereum.usd_24h_change > 0 ? 'price-change price-change-red' : 'price-change price-change-green'}>{coins.ethereum.usd_24h_change.toFixed(2) > 0 ? '+' : null} {coins.ethereum.usd_24h_change.toFixed(2)} %</div></div>,
        <div className='column-link' key='ATOM' icon='gears' text={'ATOM'}  >ATOM: {coins.cosmos.usd.toFixed(2)} usd  <div className={coins.cosmos.usd_24h_change > 0 ? 'price-change price-change-red' : 'price-change price-change-green'}>{coins.cosmos.usd_24h_change.toFixed(2) > 0 ? '+' : null} {coins.cosmos.usd_24h_change.toFixed(2)} %</div></div>,
        <div className='column-link' key='LIKE' icon='gears' text={'LIKE'}  >LIKE: {coins.likecoin.usd.toFixed(2)} usd <div className={coins.likecoin.usd_24h_change > 0 ? 'price-change price-change-red' : 'price-change price-change-green'}>{coins.likecoin.usd_24h_change.toFixed(2) > 0 ? '+' : null} {coins.likecoin.usd_24h_change.toFixed(2)} %</div></div>,
        <div className='column-link' key='OSMO' icon='gears' text={'OSMO'}  >OSMO: {coins.osmosis.usd.toFixed(2)} usd <div className={coins.osmosis.usd_24h_change > 0 ? 'price-change price-change-red' : 'price-change price-change-green'}>{coins.osmosis.usd_24h_change.toFixed(2) > 0 ? '+' : null} {coins.osmosis.usd_24h_change.toFixed(2)} %</div></div>,
        <div className='column-link' key='CRO' icon='gears' text={'CRO'}  >CRO: {coins['crypto-com-chain'].usd.toFixed(2)} usd <div className={coins['crypto-com-chain'].usd_24h_change > 0 ? 'price-change price-change-red' : 'price-change price-change-green'}>{coins['crypto-com-chain'].usd_24h_change.toFixed(2) > 0 ? '+' : null} {coins['crypto-com-chain'].usd_24h_change.toFixed(2)} %</div></div>,
        // <div style={stake} className="column-link" key='stake' icon='gears' text={'LIKE'}  ><a style={{
        //   display: 'inline-block', minHeight: '30px', width: '100%'
        // }} href="https://app.like.co/airdrop/check" target="_blank"></a></div>,
        <ColumnSubheading key='header-settings' text={intl.formatMessage(messages.settings_subheading)} />,
        <ColumnLink key='preferences' icon='cog' iconComponent={SettingsIcon} text={intl.formatMessage(messages.preferences)} href='/settings/preferences' />,
      );
    }

    return (
      <Column>
        {(signedIn && !multiColumn) ? <NavigationBar /> : <ColumnHeader title={intl.formatMessage(messages.menu)} icon='bars' iconComponent={MenuIcon} multiColumn={multiColumn} />}

        <div className='getting-started scrollable scrollable--flex'>
          <div className='getting-started__wrapper'>
            {navItems}
          </div>

          {!multiColumn && <div className='flex-spacer' />}

          <LinkFooter multiColumn />
        </div>

        {(multiColumn && showTrends) && <TrendsContainer />}

        <Helmet>
          <title>{intl.formatMessage(messages.menu)}</title>
          <meta name='robots' content='noindex' />
        </Helmet>
      </Column>
    );
  }

}

export default withIdentity(connect(mapStateToProps, mapDispatchToProps)(injectIntl(GettingStarted)));
