import PropTypes from 'prop-types';
import React from 'react';
import { Helmet } from 'react-helmet';
import ImmutablePropTypes from 'react-immutable-proptypes';
import ImmutablePureComponent from 'react-immutable-pure-component';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { fetchLists } from 'mastodon/actions/lists';
import Column from 'mastodon/components/column';
import ColumnHeader from 'mastodon/components/column_header';
import Api from '../../api';
import { Card, Tag, Callout, Spinner, Elevation } from '@blueprintjs/core';

import Icon from 'mastodon/components/icon';

// const messages = defineMessages({
//   heading: { id: 'column.lists', defaultMessage: 'Lists' },
//   subheading: { id: 'lists.subheading', defaultMessage: 'Your lists' },
// });

const getOrderedLists = createSelector([state => state.get('lists')], lists => {
  if (!lists) {
    return lists;
  }

  return lists.toList().filter(item => !!item).sort((a, b) => a.get('title').localeCompare(b.get('title')));
});

const mapStateToProps = state => ({
  lists: getOrderedLists(state),
});

export default @connect(mapStateToProps)
@injectIntl
class Interests extends ImmutablePureComponent {

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
  };

  componentWillMount() {
    this.props.dispatch(fetchLists());
  }
  getTags() {
    // eslint-disable-next-line promise/catch-or-return
    Api().get('https://tags.vercel.app/api/taggroup').then(response => {
      if (response.status === 200) {
        this.setState({
          tags: response.data.data,
        });
      }
    });
  }

  toTag(tag) {
    this.context.router.history.push(`/tags/${tag.name}`, { tag: tag.name, color: 'green' });
  }

  componentDidMount() {
    this.getTags();
  }

  render() {
    const { multiColumn } = this.props;

    const { tags } = this.state;
    return (

      <Column bindToDocument={!multiColumn} label={'興趣部落'}>
        <ColumnHeader title={'興趣部落'} icon='star' multiColumn={multiColumn} showBackButton />

        <div className='interests-zone'>
          {
            tags.length === 0 ? (
              <Spinner
                size={30}
              />
            ) : (<div className='cards-container' variant='outlined' sx={{ width: 320 }}>
              {tags.map((card) => (
                <Card interactive elevation={Elevation.TWO} key={card.name} >{card.name}
                  <div className='card-area'>
                    {
                      card.children.map(tag=>(
                        // eslint-disable-next-line react/jsx-no-bind
                        <Tag onClick={this.toTag.bind(this, tag)} large minimal round key={tag.name} >{tag.name}</Tag>
                      ))
                    }
                  </div>

                </Card>
                // <Card onClick={this.toTag.bind(this, tag)} large minimal round key={tag.name} >{tag.name}</Card>

              ))}
            </div>)
          }
        </div>
        {/* <Divider /> */}
        <Callout intent='success' title={'小編的話'}>
          <Icon id='star' /> 發現共同的興趣，建立屬於自己的社群!
          我們新增的社群功能讓你可以根據興趣愛好及話題與志同道合的人建立聯系。找到喜歡討論相同話題的朋友，組建自己的小團體，分享想法與見解，一起探討關心的事物。無論你的興趣是攝影、遊歷、閱讀或其他，這裡都有屬於你的社群。讓 solid connections 不再只停留在線上，將它發展成真誠的友誼。立即開始建立你的社群，找到志同道合的夥伴，分享生活中的大大小小! (by chatGPT)
        </Callout>
      </Column>
    );
  }

}
