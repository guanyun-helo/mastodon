import { OfflineAminoSigner } from '@cosmjs/amino';
import { AccountData } from '@cosmjs/proto-signing';
import { KeplrSignOptions } from '@keplr-wallet/types';
import WalletConnect from '@walletconnect/client';
import { IQRCodeModal, IWalletConnectOptions } from '@walletconnect/types';
import { payloadId } from '@walletconnect/utils';

import {
  LikeCoinWalletConnectorInitResponse,
  LikeCoinWalletConnectorMethodType,
  LikeCoinWalletConnectorOptions,
} from '../types';

import { convertWalletConnectAccountResponse } from './wallet';

export function getKeplrMobileWCConnector(options) {
  return new WalletConnect({
    signingMethods: [
      'keplr_enable_wallet_connect_v1',
      'keplr_get_key_wallet_connect_v1',
      'keplr_sign_amino_wallet_connect_v1',
    ],
    ...options,
  });
}

export async function initKeplrMobile(
  options,
  qrcodeModal,
  sessionMethod,
  sessionAccounts
) {
  const wcConnector = getKeplrMobileWCConnector({
    bridge: options.keplrMobileWCBridge,
    qrcodeModal,
  });
  let accounts = [];
  if (
    wcConnector.connected &&
    sessionMethod === LikeCoinWalletConnectorMethodType.KeplrMobile &&
    sessionAccounts.length > 0
  ) {
    accounts = sessionAccounts;
  } else {
    if (wcConnector.connected) {
      await wcConnector.killSession();
    }
    await wcConnector.connect();
    await wcConnector.sendCustomRequest({
      id: payloadId(),
      jsonrpc: '2.0',
      method: 'keplr_enable_wallet_connect_v1',
      params: [options.chainId],
    });
    const [account] = await wcConnector.sendCustomRequest({
      id: payloadId(),
      jsonrpc: '2.0',
      method: 'keplr_get_key_wallet_connect_v1',
      params: [options.chainId],
    });
    accounts = [convertWalletConnectAccountResponse(account)];
  }
  if (!accounts.length) {
    throw new Error('WALLETCONNECT_ACCOUNT_NOT_FOUND');
  }

  const offlineSigner = {
    getAccounts: () => Promise.resolve(accounts),
    signAmino: async (signerBech32Address, signDoc, signOptions = {}) => {
      const [result] = await wcConnector.sendCustomRequest({
        id: payloadId(),
        jsonrpc: '2.0',
        method: 'keplr_sign_amino_wallet_connect_v1',
        params: [
          options.chainId,
          signerBech32Address,
          signDoc,
          { ...options.keplrSignOptions, ...signOptions },
        ],
      });
      return result;
    },
  };

  return {
    accounts,
    offlineSigner,
  };
}
