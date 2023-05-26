import stringify from 'fast-json-stable-stringify';
import network from '../../constant/network';

async function signSubscriptionMessage(inputWallet, signer, action) {
  if (!inputWallet)
    return null;
  const ts = Date.now();
  const payload = JSON.stringify({
    action,
    likeWallet: inputWallet,
    ts,
  });
  const { signed: signedMessage, signature: { signature, pub_key: publicKey } } = await signer(payload);
  const data = {
    signature,
    publicKey: publicKey.value,
    message: stringify(signedMessage),
    from: inputWallet,
  };
  return data;
}
async function payloadSigner(signPayload, signer, address) {
  const message = {
    chain_id: network.id,
    memo: signPayload,
    msgs: [],
    fee: { gas: '1', amount: [{ denom: network.coinLookup[0].chainDenom, amount: '0' }] },
    sequence: '0',
    account_number: '0',
  };
  const payload = await signer.signAmino(address, message);
  return { message, ...payload };
}
export default function signSubscriptionAction(signer, address, action) {
  return signSubscriptionMessage(address, (s) => payloadSigner(s, signer, address), action);
}
