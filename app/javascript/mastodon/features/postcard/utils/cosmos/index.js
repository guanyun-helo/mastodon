import BigNumber from 'bignumber.js';
import config from '../../constant/network';
import { COSMOS_DENOM } from '../../constant';
import axios from 'axios';
import {
  getNewSubscriberMintInstanceApi,
  getSubscriberMintArweaveApi,
  getSubscriberMintDoneApi,
  getSubscriberMintIscnApi,
  getSubscriberMintNftClassApi,
  getSubscriberMintNftCoverApi,
  getSubscriberMintNftMintApi,
  getSubscriptionPortalApi,
  getUserIsSubscribedMinterApi,
} from '../../constant/api';

import signSubscriptionAction from '../../utils/cosmos/subscription';

let cosmRpcLib = null;
let cosmLib = null;
async function getCosmRpcLib() {
  if (!cosmRpcLib) {
    // eslint-disable-next-line import/no-extraneous-dependencies
    cosmRpcLib = await import(/* webpackChunkName: "cosmjs" */ '@cosmjs/tendermint-rpc');
  }
  return cosmRpcLib;
}
async function getCosmLib() {
  if (!cosmLib) {
    cosmLib = await import(/* webpackChunkName: "cosmjs" */ '@cosmjs/stargate');
  }
  return cosmLib;
}
let queryClient;
async function initQueryClient() {
  const [cosmRpc, cosm] = await Promise.all([
    getCosmRpcLib(),
    getCosmLib(),
  ]);
  const tendermintClient = await cosmRpc.Tendermint34Client.connect(config.rpcURL);
  queryClient = cosm.QueryClient.withExtensions(tendermintClient, cosm.setupBankExtension);
  return queryClient;
}
export async function getQueryClient() {
  if (!queryClient)
    await initQueryClient();
  return queryClient;
}
function LIKEToNanolike(value) {
  return (new BigNumber(value)).multipliedBy(1e9).toFixed();
}
export function LIKEToAmount(value) {
  return { denom: COSMOS_DENOM, amount: LIKEToNanolike(value) };
}
export function amountToLIKE(likecoin) {
  if (!likecoin)
    return -1;
  if (likecoin.denom === COSMOS_DENOM) {
    return (new BigNumber(likecoin.amount)).dividedBy(1e9).toFixed();
  }
  // eslint-disable-next-line no-console
  console.error(`${likecoin.denom} is not supported denom`);
  return -1;
}
export function configToKeplrCoin(denom) {
  const c = config.coinLookup.find(coin => coin.viewDenom === denom);
  if (!c)
    throw new Error('CANNOT_FIND_COIN_WIH_DENOM');
  return {
    coinDenom: c.viewDenom,
    coinMinimalDenom: c.chainDenom,
    coinDecimals: c.chainToViewConversionFactor
      .toString()
      .split('.')[1].length,
    coinGeckoId: c.coinGeckoId,
  };
}
export async function getAccountBalance(address) {
  const client = await getQueryClient();
  return amountToLIKE(await client.bank.balance(address, COSMOS_DENOM));
}
export function isCosmosTransactionHash(input) {
  return /^[0-9a-f]{64}$/i.test(input);
}

export async function newMintInstance(wallet) {
  const { address, signer } = wallet;
  let payload;
  try {
    payload = await signSubscriptionAction(
      signer,
      address,
      'new_mint',
    );
  } catch (_) {
    // no op
    return null;
  }
  const { data } = await axios.post(
    getNewSubscriberMintInstanceApi(address),
    payload,
  );
  const { statusId, statusSecret } = data;
  try {
    if (window.sessionStorage) {
      window.sessionStorage.setItem(
        'mintStatus',
        JSON.stringify({
          statusId,
          statusSecret,
        }),
      );
    }
  } catch (_) {
    // no op
    return null;
  }
  return data;
}
export async function updateMintInstance({
  status,
  payload,
  options: { headers = {}, ...options } = {},
}) {
  const { address: wallet } = this.context.rootState.wallet;
  const { currentMintStatusId: statusId, mintStatusSecret } = this;
  if (!statusId || !mintStatusSecret) throw new Error('NO_ACTIVE_MINT_INSTANCE');
  let url;
  switch (status) {
  case 'arweave': {
    url = getSubscriberMintArweaveApi(wallet, statusId);
    break;
  }
  case 'iscn': {
    url = getSubscriberMintIscnApi(wallet, statusId);
    break;
  }
  case 'nftCover': {
    url = getSubscriberMintNftCoverApi(wallet, statusId);
    break;
  }
  case 'nftClass': {
    url = getSubscriberMintNftClassApi(wallet, statusId);
    break;
  }
  case 'nftMint': {
    url = getSubscriberMintNftMintApi(wallet, statusId);
    break;
  }
  case 'done': {
    url = getSubscriberMintDoneApi(wallet, statusId);
    break;
  }
  default:
    throw new Error('INVALID_STATUS');
  }
  const { data } = await axios.post(
    url,
    payload,
    {
      ...options,
      headers: {
        authorization: mintStatusSecret,
        ...headers,
      },
    },
  );
  this.context.commit('setMintStatus', status);
  if (status === 'done') {
    this.context.commit('setCurrentMintStatusId', '');
    this.context.commit('setMintStatusSecret', '');
    this.context.commit('setMintStatus', '');
  }
  return data;
}