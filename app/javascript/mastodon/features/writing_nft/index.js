/* eslint-disable react/jsx-no-bind */
import PropTypes from 'prop-types';
import React from 'react';
import { Helmet } from 'react-helmet';
import { NavLink, Switch, Route } from 'react-router-dom';

import ImmutablePropTypes from 'react-immutable-proptypes';
import ImmutablePureComponent from 'react-immutable-pure-component';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import Column from 'mastodon/components/column';
import ColumnHeader from 'mastodon/components/column_header';
import {
  Tab,
  Tabs,
  Spinner,
  Icon,
} from '@blueprintjs/core';

import NftList from './components/nft_list';
import Macy from 'macy';

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

export default
@connect(mapStateToProps)
@injectIntl
class WritingNft extends ImmutablePureComponent {

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
  };


  componentDidMount() {
    this.context.router.history.push('/writingnft/feature');
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

    return (

      <div className='nft-zone'>

        <div className='account__section-headline'>
          <NavLink
            onClick={()=>{
              this.handleTabChange('feature');
            }} type='feature' exact to='/writingnft/feature'
          >
            <FormattedMessage tagName='div' id='explore.feature' defaultMessage='Feature' />
          </NavLink>
          <NavLink
            onClick={()=>{
              this.handleTabChange('latest');
            }} type='latest' exact to='/writingnft/latest'
          >
            <FormattedMessage tagName='div' id='explore.latest' defaultMessage='Latest' />
          </NavLink>
          <NavLink
            onClick={()=>{
              this.handleTabChange('top');
            }} type='top' exact to='/writingnft/top'
          >
            <FormattedMessage tagName='div' id='explore.top' defaultMessage='Top' />
          </NavLink>
        </div>

        <Switch>
          <Route exact path='/writingnft/:type' component={NftList}   />
          <Route exact path='/writingnft/:type' component={NftList}  />
          <Route exact path='/writingnft/:type' component={NftList}  />
          {/* <Route exact path={['/explore', '/explore/posts', '/search']} component={<NftList selected={currentTab === 'feature' ? true : false} contentType='feature' />} componentParams={{ multiColumn }} /> */}
        </Switch>
        {/* render={(props) => <NftList selected={currentTab === 'feature' ? true : false} contentType='feature' />} */}
        {/* render={(props) => <NftList selected={currentTab === 'latest' ? true : false} contentType='latest' />} */}
        {/* render={(props) => <NftList selected={currentTab === 'top' ? true : false} contentType='top' />} */}
        {/* <Tabs
          id='nft-tabs'
          onChange={this.handleTabChange}
          selectedTabId={currentTab}
        >
          <Tab
            id='feature'
            title='精選'
            panel={<NftList selected={currentTab === 'feature' ? true : false} contentType='feature' />}
            panelClassName='nft-list-feature'
          />
          <Tab
            id='latest'
            title='最新'
            panel={<NftList selected={currentTab === 'latest' ? true : false} contentType='latest' />}
            panelClassName='nft-list-latest'
          />
          <Tab
            id='top'
            title='最熱'
            panel={<NftList selected={currentTab === 'top' ? true : false} contentType='top' />}
            panelClassName='nft-list-top'
          />
        </Tabs> */}
        <Icon onClick={this.scrollToTop.bind(this)} className='back-to-top' icon='arrow-up' size='30' />
      </div>
      // </Column>
    );
  }

}
