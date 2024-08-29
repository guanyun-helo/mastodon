import { createAction } from '@reduxjs/toolkit';

import type { LayoutType } from '../is_mobile';

export const focusApp = createAction('APP_FOCUS');
export const unfocusApp = createAction('APP_UNFOCUS');

interface ChangeLayoutPayload {
  layout: LayoutType;
}
export const changeLayout = createAction<ChangeLayoutPayload>('APP_LAYOUT_CHANGE');

export const changeAddress = createAction<string>('ADDRESS_CHANGE');
export const changeDrawer = createAction<any>('DRAWER_CHANGE');
export const changeProfileAddress = createAction<string>('PROFILE_ADDRESS_CHANGE');
export const changeSigner = createAction<any>('SIGNER_CHANGE');
export const initConnectMethods = createAction<any[]>('INIT_CONNECT_METHODS');
export const changeNftStatus = createAction<any>('CHANGE_NFT_STATUS');
export const openMintNftDrawer = createAction<boolean>('IS_MINT_NFT_OPEN');
export const changeNftResultModal = createAction<boolean>('IS_NFT_RESULT_OPEN');
export const changeResultNft = createAction<any>('NFT_RESULT');

