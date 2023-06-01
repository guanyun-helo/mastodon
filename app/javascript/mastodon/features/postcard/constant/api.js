import querystring from 'querystring';
import { IS_TESTNET } from '.';

export const API_POST_ARWEAVE_ESTIMATE = 'https://api.like.co/arweave/estimate';
export const API_POST_ARWEAVE_UPLOAD = 'https://api.like.co/arweave/upload';
export const API_POST_NUMBERS_PROTOCOL_ASSETS = '/numbers-protocol/assets';
const LIKE_CO_API_ROOT = IS_TESTNET ? 'https://api.rinkeby.like.co' : 'https://api.like.co';
const LIKECOIN_CHAIN_API = IS_TESTNET ? 'https://node.testnet.like.co' : 'https://mainnet-node.like.co';
export const LIKER_NFT_TARGET_ADDRESS = IS_TESTNET ? 'like1yney2cqn5qdrlc50yr5l53898ufdhxafqz9gxp' : 'like17m4vwrnhjmd20uu7tst7nv0kap6ee7js69jfrs';
export const API_LIKER_NFT_MINT = 'https://api.like.co/likernft/mint';
export const API_LIKER_NFT_MINT_IMAGE = 'https://api.like.co/likernft/mint/image';
export const API_LIKER_NFT_PURCHASE = 'https://api.like.co/likernft/purchase';
export const API_LIKER_NFT_HISTORY = 'https://api.like.co/likernft/history';
export const API_LIKER_NFT_METADATA = 'https://api.like.co/likernft/metadata';
export const API_LIKER_NFT_MAPPING = 'https://api.like.co/like/iscn/mapping';
export const getNftClassUriViaIscnId = (iscnId) => `https://api.like.co/likernft/metadata?iscn_id=${encodeURIComponent(iscnId)}`;
export const getNftUriViaNftId = (classId, nftId) => `https://api.like.co/likernft/metadata?class_id=${encodeURIComponent(classId)}&nft_id=${encodeURIComponent(nftId)}`;
export const getNftClassImage = (classId) => `https://api.like.co/likernft/metadata/image/class_${encodeURIComponent(classId)}.png`;
export const getLikerIdMinApi = (likerId) => `https://api.like.co/users/id/${likerId}/min`;
export const getAddressLikerIdMinApi = (wallet) => `https://api.like.co/users/addr/${wallet}/min`;
export const getNftModelApi = (classId) => `https://api.like.co/likernft/metadata/model/class_${encodeURIComponent(classId)}.gltf`;
export const getLIKEPrice = () => 'https://api.coingecko.com/api/v3/simple/price?ids=likecoin&vs_currencies=usd';
export const getNFTMetadata = (iscnId) => {
  const qsPayload = {
    iscn_id: iscnId,
  };
  return `https://api.like.co/likernft/metadata?${querystring.stringify(qsPayload)}`;
};
export const getChainNFTIdList = (classId) => `https://mainnet-node.like.co/likechain/likenft/v1/owner?class_id=${classId}`;
export const getUserInfoMinByAddress = (addr) => `https://api.like.co/users/addr/${addr}/min`;
export const getUserIsSubscribedMinterApi = (wallet) => `https://api.like.co/likernft/subscription/status?wallet=${wallet}`;
export const getNewSubscriptionApi = (wallet) => `https://api.like.co/likernft/subscription/stripe/new?wallet=${wallet}`;
export const getSubscriptionPortalApi = (wallet) => `https://api.like.co/likernft/subscription/stripe/portal?wallet=${wallet}`;
export const getNewSubscriberMintInstanceApi = (wallet) => `https://api.like.co/likernft/subscription/mint/new?wallet=${wallet}`;
export const getSubscriberMintArweaveApi = (wallet, statusId) => `https://api.like.co/likernft/subscription/mint/${encodeURIComponent(statusId)}/arweave?wallet=${wallet}`;
export const getSubscriberMintIscnApi = (wallet, statusId) => `https://api.like.co/likernft/subscription/mint/${encodeURIComponent(statusId)}/iscn?wallet=${wallet}`;
export const getSubscriberMintNftCoverApi = (wallet, statusId) => `https://api.like.co/likernft/subscription/mint/${encodeURIComponent(statusId)}/nft/cover?wallet=${wallet}`;
export const getSubscriberMintNftClassApi = (wallet, statusId) => `https://api.like.co/likernft/subscription/mint/${encodeURIComponent(statusId)}/nft/class?wallet=${wallet}`;
export const getSubscriberMintNftMintApi = (wallet, statusId) => `https://api.like.co/likernft/subscription/mint/${encodeURIComponent(statusId)}/nft/mint?wallet=${wallet}`;
export const getSubscriberMintDoneApi = (wallet, statusId) => `https://api.like.co/likernft/subscription/mint/${encodeURIComponent(statusId)}/done?wallet=${wallet}`;
