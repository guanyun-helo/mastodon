var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export function initKeplr(options, trys = 0) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(options);
        if (!window.keplr || !window.getOfflineSignerAuto) {
            if (trys < options.initAttemptCount) {
                yield new Promise(resolve => setTimeout(resolve, 1000));
                return initKeplr(options, trys + 1);
            }
            throw new Error('KEPLR_NOT_INSTALLED');
        }
        if (!window.keplr.experimentalSuggestChain) {
            throw new Error('KEPLR_VERSION_OUTDATED');
        }
        try {
            // Some Keplr configs not support empty string
            const coinGeckoId = options.coinGeckoId || undefined;
            const walletUrlForStaking = options.walletURLForStaking || undefined;
            yield window.keplr.experimentalSuggestChain({
                chainId: options.chainId,
                chainName: options.chainName,
                rpc: options.rpcURL,
                rest: options.restURL,
                stakeCurrency: {
                    coinDenom: options.coinDenom,
                    coinMinimalDenom: options.coinMinimalDenom,
                    coinDecimals: options.coinDecimals,
                    coinGeckoId,
                },
                walletUrlForStaking,
                bip44: {
                    coinType: options.coinType,
                },
                bech32Config: {
                    bech32PrefixAccAddr: options.bech32PrefixAccAddr,
                    bech32PrefixAccPub: options.bech32PrefixAccPub,
                    bech32PrefixValAddr: options.bech32PrefixValAddr,
                    bech32PrefixValPub: options.bech32PrefixValPub,
                    bech32PrefixConsAddr: options.bech32PrefixConsAddr,
                    bech32PrefixConsPub: options.bech32PrefixConsPub,
                },
                currencies: [
                    {
                        coinDenom: options.coinDenom,
                        coinMinimalDenom: options.coinMinimalDenom,
                        coinDecimals: options.coinDecimals,
                        coinGeckoId,
                    },
                ],
                feeCurrencies: [
                    {
                        coinDenom: options.coinDenom,
                        coinMinimalDenom: options.coinMinimalDenom,
                        coinDecimals: options.coinDecimals,
                        coinGeckoId,
                        gasPriceStep: {
                            low: options.gasPriceStepLow,
                            average: options.gasPriceStepAverage,
                            high: options.gasPriceStepHigh,
                        },
                    },
                ],
                coinType: options.coinType,
                features: ['ibc-go', 'ibc-transfer', 'no-legacy-stdTx', 'stargate'],
            });
        }
        catch (error) {
            console.error(error);
            throw new Error('KEPLR_INIT_FAILED');
        }
        yield window.keplr.enable(options.chainId);
        const offlineSigner = yield window.getOfflineSignerAuto(options.chainId);
        const accounts = yield offlineSigner.getAccounts();
        let signer = offlineSigner;
        if (window.keplr.signArbitrary) {
            signer.signArbitrary = window.keplr.signArbitrary.bind(window.keplr);
        }
        return {
            accounts: [...accounts],
            offlineSigner: signer,
        };
    });
}
export function listenKeplrKeyStoreChange(handler) {
    if (!handler)
        return;
    window.addEventListener('keplr_keystorechange', handler);
}
export function removeKeplrKeyStoreChangeListener(handler) {
    if (!handler)
        return;
    window.removeEventListener('keplr_keystorechange', handler);
}
