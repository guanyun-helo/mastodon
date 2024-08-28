import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, injectIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import Logo from 'mastodon/components/logo';
import { Adsense } from '@ctrl/react-adsense';
import { timelinePreview, showTrends } from 'mastodon/initial_state';
import ColumnLink from './column_link';
import DisabledAccountBanner from './disabled_account_banner';
import FollowRequestsColumnLink from './follow_requests_column_link';
import ListPanel from './list_panel';
import NotificationsCounterIcon from './notifications_counter_icon';
import SignInBanner from './sign_in_banner';
import NavigationPortal from 'mastodon/components/navigation_portal';
import LikeCoinWalletConnector from 'mastodon/features/multi_wallet/index';

const messages = defineMessages({
  home: { id: 'tabs_bar.home', defaultMessage: 'Home' },
  notifications: { id: 'tabs_bar.notifications', defaultMessage: 'Notifications' },
  explore: { id: 'explore.title', defaultMessage: 'Explore' },
  local: { id: 'tabs_bar.local_timeline', defaultMessage: 'Local' },
  federated: { id: 'tabs_bar.federated_timeline', defaultMessage: 'Federated' },
  direct: { id: 'navigation_bar.direct', defaultMessage: 'Direct messages' },
  favourites: { id: 'navigation_bar.favourites', defaultMessage: 'Favourites' },
  bookmarks: { id: 'navigation_bar.bookmarks', defaultMessage: 'Bookmarks' },
  lists: { id: 'navigation_bar.lists', defaultMessage: 'Lists' },
  preferences: { id: 'navigation_bar.preferences', defaultMessage: 'Preferences' },
  followsAndFollowers: { id: 'navigation_bar.follows_and_followers', defaultMessage: 'Follows and followers' },
  about: { id: 'navigation_bar.about', defaultMessage: 'About' },
  search: { id: 'navigation_bar.search', defaultMessage: 'Search' },
  // interests: { id: 'navigation_bar.interests', defaultMessage: 'Interests' },
  writingnft: { id: 'navigation_bar.writingnft', defaultMessage: 'NFT BookStore' },
});

export default @injectIntl
class NavigationPanel extends React.Component {

  static contextTypes = {
    router: PropTypes.object.isRequired,
    identity: PropTypes.object.isRequired,
  };

  static propTypes = {
    intl: PropTypes.object.isRequired,
  };

  render() {
    const { intl } = this.props;
    const props = this.props;
    const { signedIn, disabledAccountId } = this.context.identity;
    let globalTheme = 'dark';
    if (
      document.body &&
      document.body.classList.contains('theme-mastodon-light')
    ) {
      globalTheme = 'light';
    }
    return (
      <div className='navigation-panel'>
        <div className='navigation-panel__logo'>
          {/* <Link to='/' className='column-link column-link--logo'><Logo /></Link> */}
          {/* <Keplr /> */}
          <LikeCoinWalletConnector />
          <hr />
        </div>

        {signedIn && (
          <React.Fragment>
            <ColumnLink transparent to='/home' icon='home' text={intl.formatMessage(messages.home)} />
            <ColumnLink type='self' transparent to='/writingnft' icon='nftIcon' text={intl.formatMessage(messages.writingnft)} />
            {/* <ColumnLink transparent to='/interests' icon='star' text={intl.formatMessage(messages.interests)} /> */}
            <ColumnLink transparent to='/notifications' icon={<NotificationsCounterIcon className='column-link__icon' />} text={intl.formatMessage(messages.notifications)} />
            <FollowRequestsColumnLink />
          </React.Fragment>
        )}

        {showTrends ? (
          <ColumnLink transparent to='/explore' icon='hashtag' text={intl.formatMessage(messages.explore)} />
        ) : (
          <ColumnLink transparent to='/search' icon='search' text={intl.formatMessage(messages.search)} />
        )}

        {(signedIn || timelinePreview) && (
          <>
            <ColumnLink transparent to='/public/local' icon='users' text={intl.formatMessage(messages.local)} />
            <ColumnLink transparent exact to='/public' icon='globe' text={intl.formatMessage(messages.federated)} />
          </>
        )}

        {!signedIn && (
          <div className='navigation-panel__sign-in-banner'>
            <hr />
            {disabledAccountId ? <DisabledAccountBanner /> : <SignInBanner />}
          </div>
        )}

        {signedIn && (
          <React.Fragment>
            <ColumnLink transparent to='/conversations' icon='at' text={intl.formatMessage(messages.direct)} />
            <ColumnLink transparent to='/bookmarks' icon='bookmark' text={intl.formatMessage(messages.bookmarks)} />
            <ColumnLink transparent to='/favourites' icon='heart' text={intl.formatMessage(messages.favourites)} />
            <ColumnLink transparent to='/lists' icon='list-ul' text={intl.formatMessage(messages.lists)} />
            <ColumnLink type='self' transparent to='/liker-id' icon='clap' text={`Liker Id (${props.liker_id})`} />
            {/* <div key="liker-id" onClick={props.bindLikeCoinId} className="liker-id column-link column-link--transparent">
              <img className='column-link__icon' src={props.clapImg} />
              <div className="bind">Liker Id ({props.liker_id})</div>
            </div> */}
            <ListPanel />

            <hr />

            <ColumnLink transparent href='/settings/preferences' icon='cog' text={intl.formatMessage(messages.preferences)} />
          </React.Fragment>
        )}

        <div className='navigation-panel__legal'>
          <hr />
          <ColumnLink transparent to='/about' icon='ellipsis-h' text={intl.formatMessage(messages.about)} />
        </div>

        <NavigationPortal />

        {/* {globalTheme === 'light' ? <Adsense
          client='ca-pub-8575447765690857'
          slot='4023331835'
          style={{ display: 'block' }}
          layout='in-article'
          format='fluid'
          className='adsbygoogle'
          layoutKey='-fb+5w+4e-db+86'
        /> : <Adsense
          client='ca-pub-8575447765690857'
          slot='7375171918'
          style={{ display: 'block' }}
          layout='in-article'
          format='fluid'
          className='adsbygoogle'
          layoutKey='-fc+56+8s-cu-6p'
        />} */}
      </div>
    );
  }

}
