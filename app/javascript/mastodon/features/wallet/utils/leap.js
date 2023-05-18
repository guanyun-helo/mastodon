// fix this file's ts errors

import {
  OfflineSigner,
  LikeCoinWalletConnectorInitResponse,
  LikeCoinWalletConnectorOptions,
} from '../types';

export async function initLeap(options, trys) {
  if (!window.leap || !window.getOfflineSignerAuto) {
    if (trys < options.initAttemptCount) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return initLeap(options, trys + 1);
    }
    throw new Error('LEAP_NOT_INSTALLED');
  }

  try {
    // Some Leap configs not support empty string
    const coinGeckoId = options.coinGeckoId || undefined;
    const walletUrlForStaking = options.walletURLForStaking || undefined;

    await window.leap.experimentalSuggestChain({
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
      features: ['ibc-go', 'ibc-transfer'],

      image: 'https://static.like.co/edm/likecoin-logo.png',
      theme: {
        primaryColor: '#28646e',
        gradient: 'linear-gradient(78deg, #d2f0f0, #f0e6b4)',
      },
    });
  } catch (error) {
    console.error(error);
    throw new Error('LEAP_INIT_FAILED');
  }

  await window.leap.enable(options.chainId);

  const offlineSigner = await window.leap.getOfflineSignerAuto(options.chainId);
  const accounts = await offlineSigner.getAccounts();

  let signer = offlineSigner;
  if (window.leap.signArbitrary) {
    signer.signArbitrary = window.leap.signArbitrary.bind(window.leap);
  }
  return {
    accounts: [...accounts],
    offlineSigner: signer,
  };
}

export function listenLeapKeyStoreChange(handler) {
  if (!handler) return;
  window.addEventListener('leap_keystorechange', handler);
}

export function removeLeapKeyStoreChangeListener(handler) {
  if (!handler) return;
  window.removeEventListener('leap_keystorechange', handler);
}
