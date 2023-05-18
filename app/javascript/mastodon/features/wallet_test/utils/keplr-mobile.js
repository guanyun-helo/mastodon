var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import WalletConnect from '@walletconnect/client';
import { payloadId } from '@walletconnect/utils';
import { LikeCoinWalletConnectorMethodType, } from '../types';
import { convertWalletConnectAccountResponse } from './wallet';
export function getKeplrMobileWCConnector(options = {}) {
    return new WalletConnect(Object.assign({ signingMethods: [
            'keplr_enable_wallet_connect_v1',
            'keplr_get_key_wallet_connect_v1',
            'keplr_sign_amino_wallet_connect_v1',
        ] }, options));
}
export function initKeplrMobile(options, qrcodeModal, sessionMethod, sessionAccounts = []) {
    return __awaiter(this, void 0, void 0, function* () {
        const wcConnector = getKeplrMobileWCConnector({
            bridge: options.keplrMobileWCBridge,
            qrcodeModal,
        });
        let accounts = [];
        if (wcConnector.connected &&
            sessionMethod === LikeCoinWalletConnectorMethodType.KeplrMobile &&
            sessionAccounts.length > 0) {
            accounts = sessionAccounts;
        }
        else {
            if (wcConnector.connected) {
                yield wcConnector.killSession();
            }
            yield wcConnector.connect();
            yield wcConnector.sendCustomRequest({
                id: payloadId(),
                jsonrpc: '2.0',
                method: 'keplr_enable_wallet_connect_v1',
                params: [options.chainId],
            });
            const [account] = yield wcConnector.sendCustomRequest({
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
            signAmino: (signerBech32Address, signDoc, signOptions = {}) => __awaiter(this, void 0, void 0, function* () {
                const [result] = yield wcConnector.sendCustomRequest({
                    id: payloadId(),
                    jsonrpc: '2.0',
                    method: 'keplr_sign_amino_wallet_connect_v1',
                    params: [
                        options.chainId,
                        signerBech32Address,
                        signDoc,
                        Object.assign(Object.assign({}, options.keplrSignOptions), signOptions),
                    ],
                });
                return result;
            }),
        };
        return {
            accounts,
            offlineSigner,
        };
    });
}
