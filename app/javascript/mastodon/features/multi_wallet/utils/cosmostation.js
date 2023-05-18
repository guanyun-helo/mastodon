let accountChangeEvent;
export const getCosmostationExtensionOfflineSigner = (chainName) => ({
    getAccounts: async () => {
        const response = await window.cosmostation.cosmos.request({
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
    },
    signAmino: async (_, signDoc) => {
        const response = await window.cosmostation.cosmos.request({
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
    },
    signDirect: async (_, signDoc) => {
        const response = await window.cosmostation.cosmos.request({
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
    },
    signArbitrary: async (_, signer, message) => {
        const { pub_key, signature } = await window.cosmostation.cosmos.request({
            method: 'cos_signMessage',
            params: {
                chainName,
                signer,
                message,
            },
        });
        return { pub_key, signature };
    },
});
export async function addChainToCosmostation(options) {
    await window.cosmostation.cosmos.request({
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
}
export async function initCosmostation(options, trys = 0) {
    if (!window.cosmostation) {
        if (trys < options.initAttemptCount) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            return initCosmostation(options, trys + 1);
        }
        throw new Error('COSMOSTATION_NOT_INSTALLED');
    }
    const groupedSupportedChainIds = await window.cosmostation.cosmos.request({
        method: 'cos_supportedChainIds',
    });
    if (!Object.values(groupedSupportedChainIds).find(group => group.includes(options.chainId))) {
        await addChainToCosmostation(options);
    }
    const offlineSigner = getCosmostationExtensionOfflineSigner(options.chainName);
    let accounts = [];
    try {
        accounts = [...(await offlineSigner.getAccounts())];
    }
    catch (error) {
        switch (error.code) {
            case 4001:
                return undefined;
            case 4100:
                await addChainToCosmostation(options);
                accounts = [...(await offlineSigner.getAccounts())];
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
}
export function listenCosmostationAccountChange(handler) {
    if (!handler)
        return;
    accountChangeEvent = window.cosmostation?.cosmos?.on('accountChanged', handler);
}
export function removeCosmostationAccountChangeListener() {
    if (!accountChangeEvent)
        return;
    window.cosmostation?.cosmos?.off(accountChangeEvent);
}
