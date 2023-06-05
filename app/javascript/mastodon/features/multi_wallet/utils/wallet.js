import { Buffer } from 'buffer';

export function serializePublicKey(value) {
  return Buffer.from(value).toString('hex');
}
export function deserializePublicKey(value) {
  return new Uint8Array(Buffer.from(value, 'hex'));
}
export function convertWalletConnectAccountResponse(account) {
  const { bech32Address, algo, pubKey: pubKeyInHex } = account;
  if (!bech32Address || !algo || !pubKeyInHex) {
    throw new Error('WALLETCONNECT_ACCOUNT_RESPONSE_INVALID');
  }
  const pubkey = deserializePublicKey(pubKeyInHex);
  return {
    address: bech32Address,
    pubkey,
    algo,
  };
}
