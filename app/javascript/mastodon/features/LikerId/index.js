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
import { Button, Card, Elevation } from '@blueprintjs/core';
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
      description:
        'civicLikerSince: default',
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

  render() {
    const { intl, lists, multiColumn, openDrawer } = this.props;
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
        <Button onClick={()=>{
          openDrawer();
        }}
        >openDrawer</Button>
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
            {user.user === 'default' ? (
              <Button
                onClick={this.bindLikeCoinId.bind(this)}
                intent='danger'
                size='large'
                className='bind-liker-button'
              >
                {intl.formatMessage(messages.heading)}
              </Button>
            ) : (
              <Card interactive elevation={Elevation.TWO}>
                <div class='container'>
                  <div class='profile'>
                    <img src={user.avatar} alt='' class='avatar' />
                    <div class='name'>{user.displayName}</div>
                    <div class='wallet'>{user.likeWallet}</div>
                    <div class='vip'>{user.isSubscribedCivicLiker? 'Civic Liker' : 'Liker'}</div>
                    <div class='description'>{user.description}</div>
                    <Button
                      onClick={this.bindLikeCoinId.bind(this)}
                      intent='danger'
                      size='large'
                      className='bind-liker-button'
                    >
                      {intl.formatMessage(messages.rebind)}
                    </Button>
                  </div>
                </div>
              </Card>
            )}
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
