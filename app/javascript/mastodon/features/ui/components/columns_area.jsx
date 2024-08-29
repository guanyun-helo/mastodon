import PropTypes from 'prop-types';
import { Children, cloneElement, useCallback } from 'react';

import ImmutablePropTypes from 'react-immutable-proptypes';
import ImmutablePureComponent from 'react-immutable-pure-component';

import { supportsPassiveEvents } from 'detect-passive-events';
import queryString from 'query-string';

import ISCN_dark from '../../../../images/likebutton/ISCN_dark';
import ISCN_light from '../../../../images/likebutton/ISCN_light';
import LikeCoinClapDark from '../../../../images/likebutton/like-calp-dark.svg';
import LikeCoinClap from '../../../../images/likebutton/like-clap-white.svg';
import { scrollRight } from '../../../scroll';
import BundleContainer from '../containers/bundle_container';
import {
  Compose,
  NotificationsWrapper,
  HomeTimeline,
  CommunityTimeline,
  PublicTimeline,
  HashtagTimeline,
  DirectTimeline,
  FavouritedStatuses,
  BookmarkedStatuses,
  ListTimeline,
  Directory,
} from '../util/async-components';
import { useColumnsContext } from '../util/columns_context';

import BundleColumnError from './bundle_column_error';
import { ColumnLoading } from './column_loading';
import ComposePanel from './compose_panel';
import DrawerLoading from './drawer_loading';
import NavigationPanel from './navigation_panel';


const componentMap = {
  'COMPOSE': Compose,
  'HOME': HomeTimeline,
  'NOTIFICATIONS': NotificationsWrapper,
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

const TabsBarPortal = () => {
  const {setTabsBarElement} = useColumnsContext();

  const setRef = useCallback((element) => {
    if(element)
      setTabsBarElement(element);
  }, [setTabsBarElement]);

  return <div id='tabs-bar__portal' ref={setRef} />;
};

export default class ColumnsArea extends ImmutablePureComponent {
  static propTypes = {
    columns: ImmutablePropTypes.list.isRequired,
    isModalOpen: PropTypes.bool.isRequired,
    singleColumn: PropTypes.bool,
    children: PropTypes.node,
  };

  // Corresponds to (max-width: $no-gap-breakpoint + 285px - 1px) in SCSS
  mediaQuery = 'matchMedia' in window && window.matchMedia('(max-width: 1174px)');

  state = {
    renderComposePanel: !(this.mediaQuery && this.mediaQuery.matches),
    liker_id: 'Click to bind',
    clapImg: LikeCoinClap,
    ISCNbage: ISCN_light,
  };

  componentWillReceiveProps() {
    // if (typeof this.pendingIndex !== 'number' && this.lastIndex !== getIndex(this.context.router.history.location.pathname)) {
    //   this.setState({ shouldAnimate: false });
    // }
  }

  componentDidMount() {

    if (document.body && document.body.classList.contains('theme-mastodon-light')) {
      this.setState({
        ISCNbage: ISCN_dark,
      });
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

    // this.lastIndex = getIndex(this.context.router.history.location.pathname);
    this.isRtlLayout = document.getElementsByTagName('body')[0].classList.contains('rtl');

    this.setState({ shouldAnimate: true });
    if (document.body && document.body.classList.contains('theme-mastodon-light')) {
      this.setState({
        clapImg: LikeCoinClapDark,
      });
    }

    this.getLikerId();

    const code = queryString.parse(location.search).code;

    const tx_hash = queryString.parse(location.search).tx_hash;
    const state = queryString.parse(location.search).state;
    if (tx_hash && state) {
      const { statusId, user } = JSON.parse(state);
      this.context.router.history.push(`/@${user}/${statusId}?tx_hash=${tx_hash}&state=${state}`);
    }
    if (code && code.length > 0) {
      const params = new URLSearchParams();
      params.append('code', code);
      this.props.getTimeLine(code, location, (response)=>{
        if (response.data.code === 200) {
          this.setState({
            liker_id: response.data.user,
          });
        }
        this.getLikerId();
        this.context.router.history.push('/liker-id');
      });
    }
  }

  getLikerId() {

    const { getLikerId } = this.props;

    getLikerId(response => {
      if (response.data.code === 200) {
        if (response.data.liker_id) {
          this.setState({
            liker_id: response.data.liker_id,
          });
        }
      }
    });
    this.isRtlLayout = document.getElementsByTagName('body')[0].classList.contains('rtl');

  }

  UNSAFE_componentWillUpdate(nextProps) {
    if (this.props.singleColumn !== nextProps.singleColumn && nextProps.singleColumn) {
      this.node.removeEventListener('wheel', this.handleWheel);
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.singleColumn !== prevProps.singleColumn && !this.props.singleColumn) {
      this.node.addEventListener('wheel', this.handleWheel, supportsPassiveEvents ? { passive: true } : false);
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
        this.mediaQuery.removeListener(this.handleLayoutChange);
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
  };

  handleWheel = () => {
    if (typeof this._interruptScrollAnimation !== 'function') {
      return;
    }

    this._interruptScrollAnimation();
  };

  setRef = (node) => {
    this.node = node;
  };

  renderLoading = columnId => () => {
    return columnId === 'COMPOSE' ? <DrawerLoading /> : <ColumnLoading multiColumn />;
  };

  renderError = (props) => {
    return <BundleColumnError multiColumn errorType='network' {...props} />;
  };

  bindLikeCoinId() {
    if (location.href !== 'https://liker.social/home') {
      this.context.router.history.push('/home');
    }
    const { getLikeAuth } = this.props;
    getLikeAuth(window.location, (res) => {
      if (res.data.code === 301) {
        location.href = 'https://like.co' + res.data.url;
      }
    });
  }

  render () {
    const { columns, children, singleColumn, isModalOpen } = this.props;
    const { renderComposePanel } = this.state;

    if (singleColumn) {
      return (
        <div className='columns-area__panels'>
          <div className='columns-area__panels__pane columns-area__panels__pane--compositional'>
            <div className='columns-area__panels__pane__inner'>
              {renderComposePanel && <ComposePanel />}
            </div>
          </div>

          <div className='columns-area__panels__main'>
            <div className='tabs-bar__wrapper'><TabsBarPortal /></div>
            <div className='columns-area columns-area--mobile'>{children}</div>
          </div>

          <div className='columns-area__panels__pane columns-area__panels__pane--start columns-area__panels__pane--navigational'>
            <div className='columns-area__panels__pane__inner' style={{ width: '400px' }}>
              <NavigationPanel bindLikeCoinId={this.bindLikeCoinId.bind(this)} clapImg={this.state.clapImg} liker_id={this.state.liker_id} />
            </div>
          </div>
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

        {Children.map(children, child => cloneElement(child, { multiColumn: true }))}
      </div>
    );
  }

}
