import PropTypes from 'prop-types';
import React from 'react';
import { Helmet } from 'react-helmet';
import ImmutablePropTypes from 'react-immutable-proptypes';
import ImmutablePureComponent from 'react-immutable-pure-component';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import Column from 'mastodon/components/column';
import ColumnHeader from 'mastodon/components/column_header';
import {
} from '../../../utils/api/like';
import {
  Tab,
  Tabs,
  Icon,
} from '@blueprintjs/core';
import ScrollContainer from 'mastodon/containers/scroll_container';

// import Icon from 'mastodon/components/icon';

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
});

const messages = defineMessages({
  deleteConfirm: { id: 'confirmations.delete.confirm', defaultMessage: 'Delete' },
  deleteMessage: { id: 'confirmations.delete.message', defaultMessage: 'Are you sure you want to delete this status?' },
  redraftConfirm: { id: 'confirmations.redraft.confirm', defaultMessage: 'Delete & redraft' },
  redraftMessage: { id: 'confirmations.redraft.message', defaultMessage: 'Are you sure you want to delete this status and re-draft it? Favourites and boosts will be lost, and replies to the original post will be orphaned.' },
  revealAll: { id: 'status.show_more_all', defaultMessage: 'Show more for all' },
  hideAll: { id: 'status.show_less_all', defaultMessage: 'Show less for all' },
  detailedStatus: { id: 'status.detailed_status', defaultMessage: 'Detailed conversation view' },
  replyConfirm: { id: 'confirmations.reply.confirm', defaultMessage: 'Reply' },
  replyMessage: { id: 'confirmations.reply.message', defaultMessage: 'Replying now will overwrite the message you are currently composing. Are you sure you want to proceed?' },
  blockDomainConfirm: { id: 'confirmations.domain_block.confirm', defaultMessage: 'Hide entire domain' },
});

export default
@connect(mapStateToProps)
@injectIntl
class WritingNftIframe extends ImmutablePureComponent {

  static contextTypes = {
    router: PropTypes.object.isRequired,
  };

  static propTypes = {
    params: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,
    lists: ImmutablePropTypes.list,
    intl: PropTypes.object.isRequired,
    multiColumn: PropTypes.bool,
  };

  state = {
    collapsed: true,
    animating: false,
    tags: [],
    currentTab: 'feature',
    isLoading: false,
    rawNftList: [],
    index: 0,
    nftList: [],
    currentElementId: null,
    macy: null,
    url: '',
  };


  componentDidMount() {
    console.log(this.context);
    this.setState({
      url: this.context.router.history.location.state.nft.meta.external_url,
    });
  }

  handleTabChange = (e) => {
    this.setState(
      {
        currentTab: e,
      },
    );
  };

  scrollToTop(){
    document.querySelector(`.nft-${this.state.currentTab}`).scrollTop = 0;
  }
  render() {
    const { multiColumn, isLoading, status, ancestorsIds, descendantsIds, intl, pictureInPicture } = this.props;

    const { url } = this.state;
    return (
      <Column bindToDocument={!multiColumn} label={intl.formatMessage(messages.detailedStatus)}>
        <ColumnHeader
          showBackButton
          multiColumn={multiColumn}
          extraButton={(
            <button type='button' className='column-header__button' title={'hello'} aria-label={'hello'} onClick={'heelo'}><Icon id={'eye'} /></button>
          )}
        />
        <ScrollContainer scrollKey='thread'>
          <iframe  src={url} width='100%' height='100%' />
        </ScrollContainer>

        <Helmet>
          {/* <title>{titleFromStatus(status)}</title> */}
          {/* <meta name='robots' content={(isLocal && isIndexable) ? 'all' : 'noindex'} /> */}
        </Helmet>
      </Column>
    );
  }

}
