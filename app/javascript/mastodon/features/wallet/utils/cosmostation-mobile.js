// javascript version of cosmosmation-mobile.ts
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
  WalletConnectAccountResponse,
} from '../types';

import { convertWalletConnectAccountResponse } from './wallet';

export function getCosmostationMobileWCConnector(options) {
  return new WalletConnect({
    signingMethods: [
      'cosmostation_wc_accounts_v1',
      'cosmostation_wc_sign_tx_v1',
    ],
    ...options,
  });
}

export async function initCosmostationMobile(
  options,
  qrcodeModal,
  sessionMethod,
  sessionAccounts
) {
  const wcConnector = getCosmostationMobileWCConnector({
    bridge: options.cosmostationAppWCBridge,
    qrcodeModal,
  });
  let accounts = [];
  if (
    wcConnector.connected &&
    sessionMethod === LikeCoinWalletConnectorMethodType.CosmostationMobile &&
    sessionAccounts.length > 0
  ) {
    accounts = sessionAccounts;
  } else {
    if (wcConnector.connected) {
      await wcConnector.killSession();
    }
    await wcConnector.connect();
    const results = await wcConnector.sendCustomRequest({
      id: payloadId(),
      jsonrpc: '2.0',
      method: 'cosmostation_wc_accounts_v1',
      params: [options.chainId],
    });
    accounts = results.map(convertWalletConnectAccountResponse);
  }
  if (!accounts.length) {
    throw new Error('WALLETCONNECT_ACCOUNT_NOT_FOUND');
  }

  let offlineSigner = {
    getAccounts: () => Promise.resolve(accounts),
    signAmino: async (signerBech32Address, signDoc) => {
      const [result] = await wcConnector.sendCustomRequest({
        id: payloadId(),
        jsonrpc: '2.0',
        method: 'cosmostation_wc_sign_tx_v1',
        params: [options.chainId, signerBech32Address, signDoc],
      });
      return result;
    },
  };

  if (options.cosmostationDirectSignEnabled) {
    offlineSigner = {
      ...offlineSigner,
      signDirect: async (signerBech32Address, signDoc) => {
        const { signed: signedInJSON, signature } =
          await wcConnector.sendCustomRequest({
            id: payloadId(),
            jsonrpc: '2.0',
            method: 'cosmostation_wc_sign_direct_tx_v1',
            params: [signerBech32Address, SignDoc.toJSON(signDoc)],
          });
        return {
          signed: SignDoc.fromJSON(signedInJSON),
          signature,
        };
      },
    };
  }

  return {
    accounts,
    offlineSigner,
  };
}

export const checkIsInCosmostationMobileInAppBrowser = () =>
  navigator.userAgent.includes('Cosmostation/APP');
