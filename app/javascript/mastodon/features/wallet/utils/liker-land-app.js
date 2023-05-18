import { AminoSignResponse } from '@cosmjs/amino';
import {
  AccountData,
  DirectSignResponse,
  OfflineSigner,
} from '@cosmjs/proto-signing';
import WalletConnect from '@walletconnect/client';
import { IQRCodeModal, IWalletConnectOptions } from '@walletconnect/types';
import { payloadId } from '@walletconnect/utils';
import { SignDoc } from 'cosmjs-types/cosmos/tx/v1beta1/tx';

import {
  LikeCoinWalletConnectorInitResponse,
  LikeCoinWalletConnectorMethodType,
  LikeCoinWalletConnectorOptions,
} from '../types';

import { convertWalletConnectAccountResponse } from './wallet';

const LIKER_LAND_APP_USER_AGENT_KEY = 'LikeCoinApp';

// Ref: https://github.com/likecoin/likecoin-app/blob/b1109871821b20228bf54cf736c032a8e9fe6ed0/app/services/api/api-config.ts#L6-L7
export const checkIsInLikerLandAppInAppBrowser = () =>
  navigator.userAgent.includes(LIKER_LAND_APP_USER_AGENT_KEY);

export function getLikerLandAppWCConnector(options) {
  const wc = new WalletConnect({
    signingMethods: ['cosmos_getAccounts', 'cosmos_signAmino'],
    ...options,
  });

  if (checkIsInLikerLandAppInAppBrowser()) {
    // Ref: https://github.com/osmosis-labs/osmosis-frontend/blob/49bede85f9a772fc40ffcdcd03d193b4d8178179/packages/web/hooks/use-keplr/context.tsx#L133
    // @ts-ignore
    wc._clientMeta = {
      name: LIKER_LAND_APP_USER_AGENT_KEY,
    };
  }

  return wc;
}

export async function initLikerLandApp(
  options,
  qrcodeModal,
  sessionMethod,
  sessionAccounts
) {
  const wcConnector = getLikerLandAppWCConnector({
    bridge: options.likerLandAppWCBridge,
    qrcodeModal,
  });
  let accounts = [];
  if (
    wcConnector.connected &&
    sessionMethod === LikeCoinWalletConnectorMethodType.LikerId &&
    sessionAccounts.length > 0
  ) {
    accounts = sessionAccounts;
  } else {
    if (wcConnector.connected) {
      await wcConnector.killSession();
    }
    await wcConnector.connect();
    const [account] = await wcConnector.sendCustomRequest({
      id: payloadId(),
      jsonrpc: '2.0',
      method: 'cosmos_getAccounts',
      params: [options.chainId],
    });
    accounts = [convertWalletConnectAccountResponse(account)];
  }
  if (!accounts.length) {
    throw new Error('WALLETCONNECT_ACCOUNT_NOT_FOUND');
  }

  const offlineSigner = {
    getAccounts: () => Promise.resolve(accounts),
    signAmino: async (signerBech32Address, signDoc) => {
      const signedTx = await wcConnector.sendCustomRequest({
        id: payloadId(),
        jsonrpc: '2.0',
        method: 'cosmos_signAmino',
        params: [options.chainId, signerBech32Address, signDoc],
      });
      return signedTx[0];
    },
    signDirect: async (signerBech32Address, signDoc) => {
      const { signed: signedInJSON, signature } =
        await wcConnector.sendCustomRequest({
          id: payloadId(),
          jsonrpc: '2.0',
          method: 'cosmos_signDirect',
          params: [signerBech32Address, SignDoc.toJSON(signDoc)],
        });
      return {
        signed: SignDoc.fromJSON(signedInJSON),
        signature,
      };
    },
  };

  return {
    accounts,
    offlineSigner,
  };
}
