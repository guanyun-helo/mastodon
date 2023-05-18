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

