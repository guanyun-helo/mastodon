import { IPFS_VIEW_GATEWAY_URL } from '../constant';

export function getIPFSURLFromHash(ipfsHash) {
    if (!ipfsHash)
        return '';
    return `${IPFS_VIEW_GATEWAY_URL}/${ipfsHash}`;
}
export default getIPFSURLFromHash;
