import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { ImmutableHashtag as Hashtag } from 'mastodon/components/hashtag';
import LoadingIndicator from 'mastodon/components/loading_indicator';
import { connect } from 'react-redux';
import { fetchTrendingHashtags } from 'mastodon/actions/trends';
import { FormattedMessage } from 'react-intl';
import DismissableBanner from 'mastodon/components/dismissable_banner';
import Api from '../../api';
import { Card, Tag, Spinner, Elevation } from '@blueprintjs/core';

const mapStateToProps = state => ({
  hashtags: state.getIn(['trends', 'tags', 'items']),
  isLoadingHashtags: state.getIn(['trends', 'tags', 'isLoading']),
});

export default @connect(mapStateToProps)
class Tags extends React.PureComponent {

  static propTypes = {
    hashtags: ImmutablePropTypes.list,
    isLoading: PropTypes.bool,
    dispatch: PropTypes.func.isRequired,
  };

  state = {
    collapsed: true,
    animating: false,
    tags: [],
  };

  componentDidMount () {
    const { dispatch } = this.props;
    dispatch(fetchTrendingHashtags());
    this.getTags();

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
    this.props.history.push(`/tags/${tag.name}`, { tag: tag.name, color: 'green' });
  }

  render () {
    const { isLoading } = this.props;
    const { multiColumn } = this.props;
    const { tags } = this.state;
    // const banner = (
    //   <DismissableBanner id='explore/tags'>
    //     <FormattedMessage id='dismissable_banner.explore_tags' defaultMessage='These hashtags are gaining traction among people on this and other servers of the decentralized network right now.' />
    //   </DismissableBanner>
    // );


    if (!isLoading && tags.length === 0) {
      return (
        <div className='explore__links scrollable scrollable--flex'>
          {/* {banner} */}

          <div className='empty-column-indicator'>
            <FormattedMessage id='empty_column.explore_statuses' defaultMessage='Nothing is trending right now. Check back later!' />
          </div>
        </div>
      );
    }

    return (
      <div className='explore__links'>
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
      </div>
    );
  }

}
