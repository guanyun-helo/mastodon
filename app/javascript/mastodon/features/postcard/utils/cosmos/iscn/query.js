import network from '../../../constant/network';

let client = null;
let iscnLib = null;
export async function getISCNLib() {
  if (!iscnLib) {
    iscnLib = await import(/* webpackChunkName: "iscn_js" */ '@likecoin/iscn-js');
  }
  return iscnLib;
}
export default async function getQueryClient() {
  if (!client) {
    const iscn = await getISCNLib();
    const c = new iscn.ISCNQueryClient();
    await c.connect(network.rpcURL);
    client = c;
  }
  return client;
}
