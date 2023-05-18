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
import { SignDoc } from 'cosmjs-types/cosmos/tx/v1beta1/tx';
import { LikeCoinWalletConnectorMethodType, } from '../types';
import { convertWalletConnectAccountResponse } from './wallet';
export function getCosmostationMobileWCConnector(options = {}) {
    return new WalletConnect(Object.assign({ signingMethods: [
            'cosmostation_wc_accounts_v1',
            'cosmostation_wc_sign_tx_v1',
        ] }, options));
}
export function initCosmostationMobile(options, qrcodeModal, sessionMethod, sessionAccounts = []) {
    return __awaiter(this, void 0, void 0, function* () {
        const wcConnector = getCosmostationMobileWCConnector({
            bridge: options.cosmostationAppWCBridge,
            qrcodeModal,
        });
        let accounts = [];
        if (wcConnector.connected &&
            sessionMethod === LikeCoinWalletConnectorMethodType.CosmostationMobile &&
            sessionAccounts.length > 0) {
            accounts = sessionAccounts;
        }
        else {
            if (wcConnector.connected) {
                yield wcConnector.killSession();
            }
            yield wcConnector.connect();
            const results = yield wcConnector.sendCustomRequest({
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
            signAmino: (signerBech32Address, signDoc) => __awaiter(this, void 0, void 0, function* () {
                const [result] = yield wcConnector.sendCustomRequest({
                    id: payloadId(),
                    jsonrpc: '2.0',
                    method: 'cosmostation_wc_sign_tx_v1',
                    params: [options.chainId, signerBech32Address, signDoc],
                });
                return result;
            }),
        };
        if (options.cosmostationDirectSignEnabled) {
            offlineSigner = Object.assign(Object.assign({}, offlineSigner), { signDirect: (signerBech32Address, signDoc) => __awaiter(this, void 0, void 0, function* () {
                    const { signed: signedInJSON, signature, } = yield wcConnector.sendCustomRequest({
                        id: payloadId(),
                        jsonrpc: '2.0',
                        method: 'cosmostation_wc_sign_direct_tx_v1',
                        params: [signerBech32Address, SignDoc.toJSON(signDoc)],
                    });
                    return {
                        signed: SignDoc.fromJSON(signedInJSON),
                        signature,
                    };
                }) });
        }
        return {
            accounts,
            offlineSigner,
        };
    });
}
export const checkIsInCosmostationMobileInAppBrowser = () => navigator.userAgent.includes('Cosmostation/APP');
