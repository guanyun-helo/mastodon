import { STORE_HYDRATE } from 'mastodon/actions/store';
import { IS_MINT_NFT_OPEN, APP_LAYOUT_CHANGE, ADDRESS_CHANGE, DRAWER_CHANGE, PROFILE_ADDRESS_CHANGE, SIGNER_CHANGE, INIT_CONNECT_METHODS, CHANGE_NFT_STATUS } from 'mastodon/actions/app';
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
  isMintNftOpen: false,
  nftStatus: null,
  signer: null,
});

export default function meta(state = initialState, action) {
  switch(action.type) {
  case IS_MINT_NFT_OPEN:
    return state.set('isMintNftOpen', action.isOpen);
  case CHANGE_NFT_STATUS:
    return state.set('nftStatus', action.status);
  case INIT_CONNECT_METHODS:
    return state.set('connectMethods', action.methods);
  case SIGNER_CHANGE:
    return state.set('signer', action.signer);
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
