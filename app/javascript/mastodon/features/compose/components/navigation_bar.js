import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import ActionBar from './action_bar';
import Avatar from '../../../components/avatar';
import Permalink from '../../../components/permalink';
import IconButton from '../../../components/icon_button';
import { FormattedMessage } from 'react-intl';
import ImmutablePureComponent from 'react-immutable-pure-component';
import civic from '../../../../images/likebutton/civic-liker.svg'
import storage from 'localforage'
import api from '../../../api'
export default class NavigationBar extends ImmutablePureComponent {

  static propTypes = {
    account: ImmutablePropTypes.map.isRequired,
    onLogout: PropTypes.func.isRequired,
    onClose: PropTypes.func,
  };
  state = {
    isSubscribedCivicLiker:false
  }

  componentDidMount() {
    const account = this.props.account;
    const liker_id = account.get('liker_id')
    if (!liker_id) return
    storage.getItem(liker_id, (err, value) => {
      if (value) {
        this.setState({
          isSubscribedCivicLiker: value
        })
        return
      }
      if (!value || value === null) {
        api().get(`https://api.like.co/users/id/${liker_id}/min`).then((res) => {
          if (res.data.isSubscribedCivicLiker) {
            this.setState({
              isSubscribedCivicLiker: res.data.isSubscribedCivicLiker
            }, () => {
              storage.setItem(liker_id, true)
            })
          }
        })
      }
    })
  }

  render () {
    return (
      <div className='navigation-bar'>
        <Permalink style={{
              backgroundImage: this.state.isSubscribedCivicLiker ? `url(${civic})` : null,
              backgroundSize: '50px 50px',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              width: 50,
              height: 50,
              backgroundRepeat: 'no-repeat'
            }} href={this.props.account.get('url')} to={`/accounts/${this.props.account.get('acct')}`}>
          <span style={{ display: 'none' }}>{this.props.account.get('acct')}</span>
          <Avatar account={this.props.account} size={40} />
        </Permalink>

        <div className='navigation-bar__profile'>
          <Permalink href={this.props.account.get('url')} to={`/@${this.props.account.get('acct')}`}>
            <strong className='navigation-bar__profile-account'>@{this.props.account.get('acct')}</strong>
          </Permalink>

          <a href='/settings/profile' className='navigation-bar__profile-edit'><FormattedMessage id='navigation_bar.edit_profile' defaultMessage='Edit profile' /></a>
        </div>

        <div className='navigation-bar__actions'>
          <IconButton className='close' title='' icon='close' onClick={this.props.onClose} />
          <ActionBar account={this.props.account} onLogout={this.props.onLogout} />
        </div>
      </div>
    );
  }

}
