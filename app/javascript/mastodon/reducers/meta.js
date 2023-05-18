import { STORE_HYDRATE } from 'mastodon/actions/store';
import { APP_LAYOUT_CHANGE, ADDRESS_CHANGE, DRAWER_CHANGE, PROFILE_ADDRESS_CHANGE } from 'mastodon/actions/app';
import { Map as ImmutableMap } from 'immutable';
import { layoutFromWindow } from 'mastodon/is_mobile';

const initialState = ImmutableMap({
  streaming_api_base_url: null,
  access_token: null,
  layout: layoutFromWindow(),
  permissions: '0',
  drawerParams: {},
  address: '',
  drawerType: '',
});

export default function meta(state = initialState, action) {
  switch(action.type) {
  case PROFILE_ADDRESS_CHANGE:
    return state.set('profileAddress', action.address);
  case ADDRESS_CHANGE:
    return state.set('address', action.address);
  case DRAWER_CHANGE:
    return state.set('drawerParams', action.drawerParams);
  case STORE_HYDRATE:
    return state.merge(action.state.get('meta')).set('permissions', action.state.getIn(['role', 'permissions']));
  case APP_LAYOUT_CHANGE:
    return state.set('layout', action.layout);
  default:
    return state;
  }
}
