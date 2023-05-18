var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
let accountChangeEvent;
export const getCosmostationExtensionOfflineSigner = (chainName) => ({
    getAccounts: () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield window.cosmostation.cosmos.request({
            method: 'cos_requestAccount',
            params: { chainName },
        });
        return [
            {
                address: response.address,
                pubkey: response.publicKey,
                algo: 'secp256k1',
            },
        ];
    }),
    signAmino: (_, signDoc) => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield window.cosmostation.cosmos.request({
            method: 'cos_signAmino',
            params: {
                chainName,
                doc: signDoc,
                isEditMemo: true,
                isEditFee: true,
            },
        });
        return {
            signed: response.signed_doc,
            signature: {
                pub_key: response.pub_key,
                signature: response.signature,
            },
        };
    }),
    signDirect: (_, signDoc) => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield window.cosmostation.cosmos.request({
            method: 'cos_signDirect',
            params: {
                chainName,
                doc: {
                    account_number: String(signDoc.accountNumber),
                    auth_info_bytes: signDoc.authInfoBytes,
                    body_bytes: signDoc.bodyBytes,
                    chain_id: signDoc.chainId,
                },
            },
        });
        return {
            signed: {
                accountNumber: response.signed_doc.account_number,
                chainId: response.signed_doc.chain_id,
                authInfoBytes: response.signed_doc.auth_info_bytes,
                bodyBytes: response.signed_doc.body_bytes,
            },
            signature: {
                pub_key: response.pub_key,
                signature: response.signature,
            },
        };
    }),
    signArbitrary: (_, signer, message) => __awaiter(void 0, void 0, void 0, function* () {
        const { pub_key, signature } = yield window.cosmostation.cosmos.request({
            method: 'cos_signMessage',
            params: {
                chainName,
                signer,
                message,
            },
        });
        return { pub_key, signature };
    }),
});
export function addChainToCosmostation(options) {
    return __awaiter(this, void 0, void 0, function* () {
        yield window.cosmostation.cosmos.request({
            method: 'cos_addChain',
            params: {
                chainId: options.chainId,
                chainName: options.chainName,
                addressPrefix: options.bech32PrefixAccAddr,
                baseDenom: options.coinMinimalDenom,
                displayDenom: options.coinDenom,
                restURL: options.restURL,
                coinType: options.coinType.toString(),
                decimals: options.coinDecimals,
                gasRate: {
                    tiny: `${options.gasPriceStepLow}`,
                    low: `${options.gasPriceStepAverage}`,
                    average: `${options.gasPriceStepHigh}`,
                },
                sendGas: '350000',
            },
        });
    });
}
export function initCosmostation(options, trys = 0) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!window.cosmostation) {
            if (trys < options.initAttemptCount) {
                yield new Promise(resolve => setTimeout(resolve, 1000));
                return initCosmostation(options, trys + 1);
            }
            throw new Error('COSMOSTATION_NOT_INSTALLED');
        }
        const groupedSupportedChainIds = yield window.cosmostation.cosmos.request({
            method: 'cos_supportedChainIds',
        });
        if (!Object.values(groupedSupportedChainIds).find(group => group.includes(options.chainId))) {
            yield addChainToCosmostation(options);
        }
        const offlineSigner = getCosmostationExtensionOfflineSigner(options.chainName);
        let accounts = [];
        try {
            accounts = [...(yield offlineSigner.getAccounts())];
        }
        catch (error) {
            switch (error.code) {
                case 4001:
                    return undefined;
                case 4100:
                    yield addChainToCosmostation(options);
                    accounts = [...(yield offlineSigner.getAccounts())];
                    break;
                default:
                    throw error;
            }
        }
        if (!accounts.length) {
            throw new Error('COSMOSTATION_ACCOUNT_NOT_FOUND');
        }
        return {
            accounts,
            offlineSigner,
        };
    });
}
export function listenCosmostationAccountChange(handler) {
    var _a, _b;
    if (!handler)
        return;
    accountChangeEvent = (_b = (_a = window.cosmostation) === null || _a === void 0 ? void 0 : _a.cosmos) === null || _b === void 0 ? void 0 : _b.on('accountChanged', handler);
}
export function removeCosmostationAccountChangeListener() {
    var _a, _b;
    if (!accountChangeEvent)
        return;
    (_b = (_a = window.cosmostation) === null || _a === void 0 ? void 0 : _a.cosmos) === null || _b === void 0 ? void 0 : _b.off(accountChangeEvent);
}
