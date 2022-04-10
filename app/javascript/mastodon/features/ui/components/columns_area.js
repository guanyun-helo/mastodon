import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, injectIntl } from 'react-intl';
import ImmutablePropTypes from 'react-immutable-proptypes';
import ImmutablePureComponent from 'react-immutable-pure-component';

import ReactSwipeableViews from 'react-swipeable-views';
import TabsBar, { links, getIndex, getLink } from './tabs_bar';
import { Link } from 'react-router-dom';

import { disableSwiping } from 'mastodon/initial_state';
import queryString from "query-string"
import LikeCoinClapDark from '../../../../images/likebutton/like-calp-dark.svg'
import LikeCoinClap from '../../../../images/likebutton/like-clap-white.svg'
import ISCN_dark from '../../../../images/likebutton/ISCN_dark'
import ISCN_light from '../../../../images/likebutton/ISCN_light'
import BundleContainer from '../containers/bundle_container';
import ColumnLoading from './column_loading';
import DrawerLoading from './drawer_loading';
import BundleColumnError from './bundle_column_error';
import {
  Compose,
  Notifications,
  HomeTimeline,
  CommunityTimeline,
  PublicTimeline,
  HashtagTimeline,
  DirectTimeline,
  FavouritedStatuses,
  BookmarkedStatuses,
  ListTimeline,
  Directory,
} from '../../ui/util/async-components';
import Icon from 'mastodon/components/icon';
import ComposePanel from './compose_panel';
import NavigationPanel from './navigation_panel';

import { supportsPassiveEvents } from 'detect-passive-events';
import { scrollRight } from '../../../scroll';
import api from '../.././../api'

const componentMap = {
  'COMPOSE': Compose,
  'HOME': HomeTimeline,
  'NOTIFICATIONS': Notifications,
  'PUBLIC': PublicTimeline,
  'REMOTE': PublicTimeline,
  'COMMUNITY': CommunityTimeline,
  'HASHTAG': HashtagTimeline,
  'DIRECT': DirectTimeline,
  'FAVOURITES': FavouritedStatuses,
  'BOOKMARKS': BookmarkedStatuses,
  'LIST': ListTimeline,
  'DIRECTORY': Directory,
};

const messages = defineMessages({
  publish: { id: 'compose_form.publish', defaultMessage: 'Toot' },
});

const shouldHideFAB = path => path.match(/^\/statuses\/|^\/@[^/]+\/\d+|^\/publish|^\/explore|^\/getting-started|^\/start/);

export default @(component => injectIntl(component, { withRef: true }))
class ColumnsArea extends ImmutablePureComponent {

  static contextTypes = {
    router: PropTypes.object.isRequired,
  };

  static propTypes = {
    intl: PropTypes.object.isRequired,
    columns: ImmutablePropTypes.list.isRequired,
    isModalOpen: PropTypes.bool.isRequired,
    singleColumn: PropTypes.bool,
    children: PropTypes.node,
  };

  // Corresponds to (max-width: 600px + (285px * 1) + (10px * 1)) in SCSS
  mediaQuery = 'matchMedia' in window && window.matchMedia('(max-width: 895px)');

  state = {
    shouldAnimate: false,
    renderComposePanel: !(this.mediaQuery && this.mediaQuery.matches),
    liker_id: "Click to bind",
    clapImg: LikeCoinClap,
    ISCNbage: ISCN_light,

  }

  componentWillReceiveProps() {
    if (typeof this.pendingIndex !== 'number' && this.lastIndex !== getIndex(this.context.router.history.location.pathname)) {
      this.setState({ shouldAnimate: false });
    }
  }

  componentDidMount() {

    if (document.body && document.body.classList.contains('theme-mastodon-light')) {
      this.setState({
        ISCNbage: ISCN_dark
      })
    }
    // ?tx_hash=298620E3951C6C65E7A5CB5789C1E3A5F5F1D93B86860103AF21600236E8FC79&state=http%3A%2F%2Flocalhost%3A3000%2Fweb%2Fstatuses%2F106374183524751866&remarks=Transaction%20from%20Liker%20Social
    if (!this.props.singleColumn) {
      this.node.addEventListener('wheel', this.handleWheel, supportsPassiveEvents ? { passive: true } : false);
    }

    if (this.mediaQuery) {
      if (this.mediaQuery.addEventListener) {
        this.mediaQuery.addEventListener('change', this.handleLayoutChange);
      } else {
        this.mediaQuery.addListener(this.handleLayoutChange);
      }
      this.setState({ renderComposePanel: !this.mediaQuery.matches });
    }

    this.lastIndex = getIndex(this.context.router.history.location.pathname);
    this.isRtlLayout = document.getElementsByTagName('body')[0].classList.contains('rtl');

    this.setState({ shouldAnimate: true });
    if (document.body && document.body.classList.contains('theme-mastodon-light')) {
      this.setState({
        clapImg: LikeCoinClapDark
      })
    }

    this.getLikerId()

    const code = queryString.parse(location.search).code

    const tx_hash = queryString.parse(location.search).tx_hash
    const state = queryString.parse(location.search).state
    if (tx_hash && state) {
      const { statusId } = JSON.parse(state)
      this.context.router.history.push(`/statuses/${statusId}?tx_hash=${tx_hash}&state=${state}`);
    }
    if (code && code.length > 0) {
      const params = new URLSearchParams()
      params.append("code", code)
      api().get(`/api/v1/timelines/home?code=${code}&url=${location.origin}${location.pathname}`).then(response => {
        // dispatch(unblockAccountSuccess(response.data));
        if (response.data.code === 200) {
          this.setState({
            liker_id: response.data.user
          })
        }
        this.getLikerId()
      }).catch(error => {
        // dispatch(unblockAccountFail(id, error));
      });
    }
  }

  getLikerId() {
    api().get(`/api/v1/accounts/liker_id`).then(response => {
      if (response.data.code === 200) {
        if (response.data.liker_id) {
          this.setState({
            liker_id: response.data.liker_id
          })
        }
      }
    }).catch(error => {
      // dispatch(unblockAccountFail(id, error));
    });
  }

  componentWillUpdate(nextProps) {
    if (this.props.singleColumn !== nextProps.singleColumn && nextProps.singleColumn) {
      this.node.removeEventListener('wheel', this.handleWheel);
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.singleColumn !== prevProps.singleColumn && !this.props.singleColumn) {
      this.node.addEventListener('wheel', this.handleWheel, supportsPassiveEvents ? { passive: true } : false);
    }

    const newIndex = getIndex(this.context.router.history.location.pathname);

    if (this.lastIndex !== newIndex) {
      this.lastIndex = newIndex;
      this.setState({ shouldAnimate: true });
    }
  }

  componentWillUnmount() {
    if (!this.props.singleColumn) {
      this.node.removeEventListener('wheel', this.handleWheel);
    }

    if (this.mediaQuery) {
      if (this.mediaQuery.removeEventListener) {
        this.mediaQuery.removeEventListener('change', this.handleLayoutChange);
      } else {
        this.mediaQuery.removeListener(this.handleLayouteChange);
      }
    }
  }

  handleChildrenContentChange() {
    if (!this.props.singleColumn) {
      const modifier = this.isRtlLayout ? -1 : 1;
      this._interruptScrollAnimation = scrollRight(this.node, (this.node.scrollWidth - window.innerWidth) * modifier);
    }
  }

  handleLayoutChange = (e) => {
    this.setState({ renderComposePanel: !e.matches });
  }

  handleSwipe = (index) => {
    this.pendingIndex = index;

    const nextLinkTranslationId = links[index].props['data-preview-title-id'];
    const currentLinkSelector = '.tabs-bar__link.active';
    const nextLinkSelector = `.tabs-bar__link[data-preview-title-id="${nextLinkTranslationId}"]`;

    // HACK: Remove the active class from the current link and set it to the next one
    // React-router does this for us, but too late, feeling laggy.
    document.querySelector(currentLinkSelector).classList.remove('active');
    document.querySelector(nextLinkSelector).classList.add('active');

    if (!this.state.shouldAnimate && typeof this.pendingIndex === 'number') {
      this.context.router.history.push(getLink(this.pendingIndex));
      this.pendingIndex = null;
    }
  }

  handleAnimationEnd = () => {
    if (typeof this.pendingIndex === 'number') {
      this.context.router.history.push(getLink(this.pendingIndex));
      this.pendingIndex = null;
    }
  }

  handleWheel = () => {
    if (typeof this._interruptScrollAnimation !== 'function') {
      return;
    }

    this._interruptScrollAnimation();
  }

  setRef = (node) => {
    this.node = node;
  }

  renderView = (link, index) => {
    const columnIndex = getIndex(this.context.router.history.location.pathname);
    const title = this.props.intl.formatMessage({ id: link.props['data-preview-title-id'] });
    const icon = link.props['data-preview-icon'];

    const view = (index === columnIndex) ?
      React.cloneElement(this.props.children) :
      <ColumnLoading title={title} icon={icon} />;

    return (
      <div className='columns-area columns-area--mobile' key={index}>
        {view}
      </div>
    );
  }

  renderLoading = columnId => () => {
    return columnId === 'COMPOSE' ? <DrawerLoading /> : <ColumnLoading />;
  }

  renderError = (props) => {
    return <BundleColumnError {...props} />;
  }

  bindLikeCoinId() {
    if (location.href !== 'https://liker.social/web/timelines/home') {
      this.context.router.history.push('/timelines/home')
    }
    const { getLikeAuth } = this.props;
    getLikeAuth(window.location, (res) => {
      if (res.data.code === 301) {
        location.href = 'https://like.co' + res.data.url
      }
    })
  }

  render() {
    const { columns, children, singleColumn, isModalOpen, intl } = this.props;
    const { shouldAnimate, renderComposePanel } = this.state;

    const columnIndex = getIndex(this.context.router.history.location.pathname);

    if (singleColumn) {
      const floatingActionButton = shouldHideFAB(this.context.router.history.location.pathname) ? null : <Link key='floating-action-button' to='/publish' className='floating-action-button' aria-label={intl.formatMessage(messages.publish)}><Icon id='pencil' /></Link>;

      const content = columnIndex !== -1 ? (
        <ReactSwipeableViews key='content' hysteresis={0.2} threshold={15} index={columnIndex} onChangeIndex={this.handleSwipe} onTransitionEnd={this.handleAnimationEnd} animateTransitions={shouldAnimate} springConfig={{ duration: '400ms', delay: '0s', easeFunction: 'ease' }} style={{ height: '100%' }} disabled={disableSwiping}>
          {links.map(this.renderView)}
        </ReactSwipeableViews>
      ) : (
        <div key='content' className='columns-area columns-area--mobile'>{children}</div>
      );

      return (
        <div className='columns-area__panels'>
          <div className='columns-area__panels__pane columns-area__panels__pane--compositional'>
            <div className='columns-area__panels__pane__inner'>
              {renderComposePanel && <ComposePanel />}
            </div>
          </div>

          <div className='columns-area__panels__main'>
            <TabsBar key='tabs' />
            {content}
          </div>

          <div className='columns-area__panels__pane columns-area__panels__pane--start columns-area__panels__pane--navigational'>
            <div className='columns-area__panels__pane__inner'>
              <NavigationPanel bindLikeCoinId={this.bindLikeCoinId.bind(this)} clapImg={this.state.clapImg} liker_id={this.state.liker_id} />
            </div>
          </div>

          {floatingActionButton}
        </div>
      );
    }

    return (
      <div className={`columns-area ${isModalOpen ? 'unscrollable' : ''}`} ref={this.setRef}>
        {columns.map(column => {
          const params = column.get('params', null) === null ? null : column.get('params').toJS();
          const other = params && params.other ? params.other : {};

          return (
            <BundleContainer key={column.get('uuid')} fetchComponent={componentMap[column.get('id')]} loading={this.renderLoading(column.get('id'))} error={this.renderError}>
              {SpecificComponent => <SpecificComponent columnId={column.get('uuid')} params={params} multiColumn {...other} />}
            </BundleContainer>
          );
        })}

        {React.Children.map(children, child => React.cloneElement(child, { multiColumn: true }))}
      </div>
    );
  }

}
