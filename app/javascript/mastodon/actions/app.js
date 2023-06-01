export const APP_FOCUS   = 'APP_FOCUS';
export const APP_UNFOCUS = 'APP_UNFOCUS';

export const focusApp = () => ({
  type: APP_FOCUS,
});

export const unfocusApp = () => ({
  type: APP_UNFOCUS,
});

export const APP_LAYOUT_CHANGE = 'APP_LAYOUT_CHANGE';

export const changeLayout = layout => ({
  type: APP_LAYOUT_CHANGE,
  layout,
});


export const ADDRESS_CHANGE = 'ADDRESS_CHANGE';
export const DRAWER_CHANGE = 'DRAWER_CHANGE';
export const PROFILE_ADDRESS_CHANGE = 'PROFILE_ADDRESS_CHANGE';
export const SIGNER_CHANGE = 'SIGNER_ADDRESS';
export const INIT_CONNECT_METHODS = 'INIT_CONNECT_METHODS';
export const CHANGE_NFT_STATUS = 'CHANGE_NFT_STATUS';
export const IS_MINT_NFT_OPEN = 'IS_MINT_NFT_OPEN';
export const IS_NFT_RESULT_OPEN = 'IS_NFT_RESULT_OPEN';
export const NFT_RESULT = 'NFT_RESULT';

export const changeResultNft = (nft) => {
  return ({
    type: NFT_RESULT,
    nft: nft,
  });
};

export const changeNftResultModal = (isOpen) => {
  return ({
    type: IS_NFT_RESULT_OPEN,
    isOpen: isOpen,
  });
};

export const openMintNftDrawer = (isOpen) => {
  return ({
    type: IS_MINT_NFT_OPEN,
    isOpen: isOpen,
  });
};

export const changeNftStatus = (status) => {
  return ({
    type: CHANGE_NFT_STATUS,
    status: status,
  });
};

export const initConnectMethods = (methods) => {
  return ({
    type: INIT_CONNECT_METHODS,
    methods: methods,
  });
};

export const changeDrawer = (drawerParams) => {
  return ({
    type: DRAWER_CHANGE,
    drawerParams: drawerParams,
  });
};

export const changeAddress = address => ({
  type: ADDRESS_CHANGE,
  address,
});

export const changeProfileAddress = address => {
  return ({
    type: PROFILE_ADDRESS_CHANGE,
    address,
  });
};

export const changeSigner = signer => {
  return ({
    type: SIGNER_CHANGE,
    signer,
  });
};

