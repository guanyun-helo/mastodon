import { STORE_HYDRATE } from 'mastodon/actions/store';
// import { NFT_RESULT, IS_MINT_NFT_OPEN, ADDRESS_CHANGE, DRAWER_CHANGE, PROFILE_ADDRESS_CHANGE, SIGNER_CHANGE, INIT_CONNECT_METHODS, CHANGE_NFT_STATUS , IS_NFT_RESULT_OPEN} from 'mastodon/actions/app';
import { Map as ImmutableMap } from 'immutable';

import { changeLayout } from 'mastodon/actions/app';
import { layoutFromWindow } from 'mastodon/is_mobile';

const initialState = ImmutableMap({
  streaming_api_base_url: null,
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
  // case NFT_RESULT:
  //   return state.set('nftResult', action.nft);
  // case IS_NFT_RESULT_OPEN:
  //   return state.set('isNFTResultOpen', action.isOpen);
  // case IS_MINT_NFT_OPEN:
  //   return state.set('isMintNftOpen', action.isOpen);
  // case CHANGE_NFT_STATUS:
  //   return state.set('nftStatus', action.status);
  // case INIT_CONNECT_METHODS:
  //   return state.set('connectMethods', action.methods);
  // case SIGNER_CHANGE:
  //   return state.set('signer', action.signer);
  // case PROFILE_ADDRESS_CHANGE:
  //   return state.set('profileAddress', action.address);
  // case ADDRESS_CHANGE:
  //   return state.set('address', action.address);
  // case DRAWER_CHANGE:
  //   return state.set('drawerParams', action.drawerParams);
  case STORE_HYDRATE:
    // we do not want `access_token` to be stored in the state
    return state.merge(action.state.get('meta')).delete('access_token').set('permissions', action.state.getIn(['role', 'permissions']));
  case changeLayout.type:
    return state.set('layout', action.payload.layout);
  default:
    return state;
  }
}
