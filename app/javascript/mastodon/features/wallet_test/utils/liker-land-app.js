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
const LIKER_LAND_APP_USER_AGENT_KEY = 'LikeCoinApp';
// Ref: https://github.com/likecoin/likecoin-app/blob/b1109871821b20228bf54cf736c032a8e9fe6ed0/app/services/api/api-config.ts#L6-L7
export const checkIsInLikerLandAppInAppBrowser = () => navigator.userAgent.includes(LIKER_LAND_APP_USER_AGENT_KEY);
export function getLikerLandAppWCConnector(options = {}) {
    const wc = new WalletConnect(Object.assign({ signingMethods: ['cosmos_getAccounts', 'cosmos_signAmino'] }, options));
    if (checkIsInLikerLandAppInAppBrowser()) {
        // Ref: https://github.com/osmosis-labs/osmosis-frontend/blob/49bede85f9a772fc40ffcdcd03d193b4d8178179/packages/web/hooks/use-keplr/context.tsx#L133
        // @ts-ignore
        wc._clientMeta = {
            name: LIKER_LAND_APP_USER_AGENT_KEY,
        };
    }
    return wc;
}
export function initLikerLandApp(options, qrcodeModal, sessionMethod, sessionAccounts = []) {
    return __awaiter(this, void 0, void 0, function* () {
        const wcConnector = getLikerLandAppWCConnector({
            bridge: options.likerLandAppWCBridge,
            qrcodeModal,
        });
        let accounts = [];
        if (wcConnector.connected &&
            sessionMethod === LikeCoinWalletConnectorMethodType.LikerId &&
            sessionAccounts.length > 0) {
            accounts = sessionAccounts;
        }
        else {
            if (wcConnector.connected) {
                yield wcConnector.killSession();
            }
            yield wcConnector.connect();
            const [account] = yield wcConnector.sendCustomRequest({
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
            signAmino: (signerBech32Address, signDoc) => __awaiter(this, void 0, void 0, function* () {
                const signedTx = yield wcConnector.sendCustomRequest({
                    id: payloadId(),
                    jsonrpc: '2.0',
                    method: 'cosmos_signAmino',
                    params: [options.chainId, signerBech32Address, signDoc],
                });
                return signedTx[0];
            }),
            signDirect: (signerBech32Address, signDoc) => __awaiter(this, void 0, void 0, function* () {
                const { signed: signedInJSON, signature, } = yield wcConnector.sendCustomRequest({
                    id: payloadId(),
                    jsonrpc: '2.0',
                    method: 'cosmos_signDirect',
                    params: [signerBech32Address, SignDoc.toJSON(signDoc)],
                });
                return {
                    signed: SignDoc.fromJSON(signedInJSON),
                    signature,
                };
            }),
        };
        return {
            accounts,
            offlineSigner,
        };
    });
}
