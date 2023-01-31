import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, injectIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import Logo from 'mastodon/components/logo';
import { timelinePreview, showTrends } from 'mastodon/initial_state';
import ColumnLink from './column_link';
import DisabledAccountBanner from './disabled_account_banner';
import FollowRequestsColumnLink from './follow_requests_column_link';
import ListPanel from './list_panel';
import NotificationsCounterIcon from './notifications_counter_icon';
import SignInBanner from './sign_in_banner';
import NavigationPortal from 'mastodon/components/navigation_portal';


// const NavigationPanel = (props) => (
//   <div className='navigation-panel'>
//     <NavLink className='column-link column-link--transparent' to='/home' data-preview-title-id='column.home' data-preview-icon='home' ><Icon className='column-link__icon' id='home' fixedWidth /><FormattedMessage id='tabs_bar.home' defaultMessage='Home' /></NavLink>
//     <NavLink className='column-link column-link--transparent' to='/notifications' data-preview-title-id='column.notifications' data-preview-icon='bell' ><NotificationsCounterIcon className='column-link__icon' /><FormattedMessage id='tabs_bar.notifications' defaultMessage='Notifications' /></NavLink>
//     <FollowRequestsNavLink />
//     <NavLink className='column-link column-link--transparent' to='/explore' data-preview-title-id='explore.title' data-preview-icon='hashtag'><Icon className='column-link__icon' id='hashtag' fixedWidth /><FormattedMessage id='explore.title' defaultMessage='Explore' /></NavLink>
//     <NavLink className='column-link column-link--transparent' to='/public/local' data-preview-title-id='column.community' data-preview-icon='users' ><Icon className='column-link__icon' id='users' fixedWidth /><FormattedMessage id='tabs_bar.local_timeline' defaultMessage='Local' /></NavLink>
//     <NavLink className='column-link column-link--transparent' exact to='/public' data-preview-title-id='column.public' data-preview-icon='globe' ><Icon className='column-link__icon' id='globe' fixedWidth /><FormattedMessage id='tabs_bar.federated_timeline' defaultMessage='Federated' /></NavLink>
//     <NavLink className='column-link column-link--transparent' to='/conversations'><Icon className='column-link__icon' id='at' fixedWidth /><FormattedMessage id='navigation_bar.direct' defaultMessage='Direct messages' /></NavLink>
//     <NavLink className='column-link column-link--transparent' to='/favourites'><Icon className='column-link__icon' id='star' fixedWidth /><FormattedMessage id='navigation_bar.favourites' defaultMessage='Favourites' /></NavLink>
//     <NavLink className='column-link column-link--transparent' to='/bookmarks'><Icon className='column-link__icon' id='bookmark' fixedWidth /><FormattedMessage id='navigation_bar.bookmarks' defaultMessage='Bookmarks' /></NavLink>
//     <NavLink className='column-link column-link--transparent' to='/lists'><Icon className='column-link__icon' id='list-ul' fixedWidth /><FormattedMessage id='navigation_bar.lists' defaultMessage='Lists' /></NavLink>
//     {/* {profile_directory && <NavLink className='column-link column-link--transparent' to='/directory'><Icon className='column-link__icon' id='address-book-o' fixedWidth /><FormattedMessage id='getting_started.directory' defaultMessage='Profile directory' /></NavLink>} */}
//     <div key="liker-id" onClick={props.bindLikeCoinId} className="liker-id column-link column-link--transparent">
//       <img className='column-link__icon' src={props.clapImg} />
//       <div className="bind">Liker Id ({props.liker_id})</div>
//     </div>
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

    return (
      <div className='navigation-panel'>
        <div className='navigation-panel__logo'>
          <Link to='/' className='column-link column-link--logo'><Logo /></Link>
          <hr />
        </div>

        {signedIn && (
          <React.Fragment>
            <ColumnLink transparent to='/home' icon='home' text={intl.formatMessage(messages.home)} />
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
            <ColumnLink transparent to='/favourites' icon='star' text={intl.formatMessage(messages.favourites)} />
            <ColumnLink transparent to='/bookmarks' icon='bookmark' text={intl.formatMessage(messages.bookmarks)} />
            <ColumnLink transparent to='/lists' icon='list-ul' text={intl.formatMessage(messages.lists)} />
            <div key="liker-id" onClick={props.bindLikeCoinId} className="liker-id column-link column-link--transparent">
              <img className='column-link__icon' src={props.clapImg} />
              <div className="bind">Liker Id ({props.liker_id})</div>
            </div>
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
      </div>
    );
  }

}
