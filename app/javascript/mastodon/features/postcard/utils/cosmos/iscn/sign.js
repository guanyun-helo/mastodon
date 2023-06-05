import network from '../../../constant/network';
import { WALLET_TYPE_REPLACER } from '../../../constant';
import { getPublisherISCNPayload } from './index';

let client = null;
let iscnLib = null;
export async function getISCNLib() {
  if (!iscnLib) {
    iscnLib = await import(/* webpackChunkName: "iscn_js" */ '@likecoin/iscn-js');
  }
  return iscnLib;
}
export async function getSigningClient() {
  if (!client) {
    const iscn = await getISCNLib();
    const c = new iscn.ISCNSigningClient();
    await c.connect(network.rpcURL);
    client = c;
  }
  return client;
}
export function formatISCNTxPayload(payload) {
  const { tagsString = '', license, ipfsHash, arweaveId, fileSHA256, authorNames, authorUrls, authorWallets, likerIds, likerIdsAddresses, authorDescriptions, numbersProtocolAssetId, contentFingerprints = [], stakeholders = [], recordNotes, publisher, ...data } = payload;
  let rewardProportion = 1;
  if (publisher) {
    const { stakeholders: publisherStakeholders = [], contentFingerprints: publisherContentFingerprints = [] } = getPublisherISCNPayload(publisher);
    stakeholders.push(...publisherStakeholders);
    contentFingerprints.push(...publisherContentFingerprints);
    if (publisherStakeholders && publisherStakeholders.length) {
      rewardProportion = publisherStakeholders.reduce((acc, cur) => {
        if (cur.rewardProportion)
          return acc + cur.rewardProportion;
        return acc;
      }, 0);
    }
  }
  if (fileSHA256)
    contentFingerprints.push(`hash://sha256/${fileSHA256}`);
  if (ipfsHash)
    contentFingerprints.push(`ipfs://${ipfsHash}`);
  if (arweaveId)
    contentFingerprints.push(`ar://${arweaveId}`);
  if (numbersProtocolAssetId)
    contentFingerprints.push(`num://${numbersProtocolAssetId}`);
  if (authorNames.length) {
    const authorName = authorNames[0];
    const description = authorDescriptions[0];
    const url = authorUrls[0];
    const identifiers = [{
      '@type': 'PropertyValue',
      //   propertyID: WALLET_TYPE_REPLACER[a.type] || a.type,
      value: authorWallets[0].address,
    }];
    const wallet = authorWallets[0];
    const likerIdentifiers = {
      '@type': 'PropertyValue',
      propertyID: 'Liker ID',
      value: `https://like.co/${likerIds[0]}`,
    };
    if (likerIds[0] && likerIdsAddresses[0])
      identifiers.push(likerIdentifiers);
    // const sameAsArray = authorUrls[0];
    const isNonEmpty = url || authorName || identifiers.length;
    if (isNonEmpty) {
      stakeholders.push({
        entity: {
          '@id': wallet || url,
          name: authorName,
          url,
          description,
        //   sameAs: sameAsArray,
          identifier: identifiers,
        },
        rewardProportion: rewardProportion === 1
          ? rewardProportion
          : Math.floor((rewardProportion / authorNames.length) * 10000) /
                            10000,
        contributionType: 'http://schema.org/author',
      });
    }
  }
  return {
    ...data,
    keywords: tagsString.split(','),
    usageInfo: license,
    contentFingerprints,
    stakeholders,
    recordNotes,
  };
}
export async function esimateISCNTxGasAndFee(tx) {
  const signingClient = await getSigningClient();
  const res = await signingClient.esimateISCNTxGasAndFee(tx);
  return res;
}
export async function signISCN(tx, signer, address, { iscnId, memo } = {}) {
  const isUpdate = !!iscnId;
  const signingClient = await getSigningClient();
  await signingClient.connectWithSigner(network.rpcURL, signer);
  const signingPromise = isUpdate ? signingClient.updateISCNRecord(address, iscnId, tx, { memo: memo || 'app.like.co' })
    : signingClient.createISCNRecord(address, tx, { memo: memo || 'app.like.co' });
  const res = await signingPromise;
  return res;
}
