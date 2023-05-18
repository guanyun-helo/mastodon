/* eslint-disable promise/catch-or-return */
import axios from 'axios';
import { format } from 'date-fns';

export function getCoinPrice() {
  return axios
    .get(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,cosmos,ion,crypto-com-chain,osmosis,likecoin&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&include_last_updated_at=true',
    )
    .catch((err) => {
      console.log(err);
    });
}

export function getTrending() {
  // https://api.like.co/users/addr/like16th22kku9h7mq8t88kecc038qrkr3md9qme02n/min

  // use address to check LIKERID
  let now = new Date();
  let sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  let sevenDaysAgoUnix = format(sevenDaysAgo, 't');
  let nowUnix = format(now, 't');

  return axios
    .get(
      `https://mainnet-node.like.co/likechain/likenft/v1/ranking?ignore_list=like17m4vwrnhjmd20uu7tst7nv0kap6ee7js69jfrs&ignore_list=like1yney2cqn5qdrlc50yr5l53898ufdhxafqz9gxp&after=${sevenDaysAgoUnix}&before=${nowUnix}&created_after=${sevenDaysAgoUnix}&created_before=${nowUnix}&stakeholder_name=&creator=&collector=&type=&limit=100`,
    )
    .catch((err) => {
      console.log(err);
    });
}

export function getLatestByOwner(address) {
  let now = new Date();
  let sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  let sevenDaysAgoUnix = format(sevenDaysAgo, 't');
  let nowUnix = format(now, 't');

  return axios
    .get(
      `https://mainnet-node.like.co/likechain/likenft/v1/ranking?ignore_list=like17m4vwrnhjmd20uu7tst7nv0kap6ee7js69jfrs&ignore_list=like1yney2cqn5qdrlc50yr5l53898ufdhxafqz9gxp&after=${sevenDaysAgoUnix}&before=${nowUnix}&created_after=${sevenDaysAgoUnix}&created_before=${nowUnix}&stakeholder_name=&creator${address}=&collector=&type=&limit=100`,
    )
    .catch((err) => {
      console.log(err);
    });
}

export function getTopByOwner(address) {
  // https://api.like.co/users/addr/like16th22kku9h7mq8t88kecc038qrkr3md9qme02n/min
  // use address to check LIKERID
  return axios
    .get(
      `https://mainnet-node.like.co/likechain/likenft/v1/ranking?ignore_list=like17m4vwrnhjmd20uu7tst7nv0kap6ee7js69jfrs&ignore_list=like1yney2cqn5qdrlc50yr5l53898ufdhxafqz9gxp&after=1656633600&before=1681430400&created_after=1656633600&created_before=1681430400&stakeholder_name=&creator${address}=&collector=&type=&limit=100`,
    )
    .catch((err) => {
      console.log(err);
    });
}

export function getNFTmeta(nftid) {
  //https://api.like.co/likernft/metadata?iscn_id&class_id=
  return axios
    .get(`https://api.like.co/likernft/metadata?iscn_id&class_id=${nftid}`)
    .catch((err) => {
      console.log(err);
    });
}
export function getTop() {
  // https://api.like.co/users/addr/like16th22kku9h7mq8t88kecc038qrkr3md9qme02n/min

  // use address to check LIKERID
  return axios
    .get(
      'https://mainnet-node.like.co/likechain/likenft/v1/ranking?ignore_list=like17m4vwrnhjmd20uu7tst7nv0kap6ee7js69jfrs&ignore_list=like1yney2cqn5qdrlc50yr5l53898ufdhxafqz9gxp&after=1656633600&before=1681430400&created_after=1656633600&created_before=1681430400&stakeholder_name=&creator=&collector=&type=&limit=100',
    )
    .catch((err) => {
      console.log(err);
    });
}

export function getLatest(nextKey) {
  return axios.get(
    `https://mainnet-node.like.co/likechain/likenft/v1/class?reverse=true&key=${
      nextKey || ''
    }&limit=5`,
  );
}
export function getNftImage(nftClass) {
  return axios.get(
    `https://api.like.co/likernft/metadata/image/class_${nftClass}?size=450`,
  );
}

export function getLikerInfoByAddress(address) {
  return axios
    .get(`https://api.like.co/users/addr/${address}/min`)
    .catch((err) => {
      console.log(err);
    });
}

export function getSaleStatsByAddress(address) {
  // https://api.like.co/likernft/user/like13f4glvg80zvfrrs7utft5p68pct4mcq7t5atf6/stats
  return axios
    .get(`https://api.like.co/likernft/user/${address}/stats`)
    .catch((err) => {
      console.log(err);
    });
}

export function getOwnerByISCN(ISCN) {
  // https://mainnet-node.like.co/iscn/records/id?iscn_id=iscn%3A%2F%2Flikecoin-chain%2FD2Yt1Umw1Bsm9GWnrq7MplDKXv675MpWqzlnyyvVetw
  return axios.get(
    `https://mainnet-node.like.co/iscn/records/id?iscn_id=${ISCN}`,
  );
}


// the next two api combined could get LATEST nft list
export function getNFTmetaByISCN(nftid) {
  //https://api.like.co/likernft/metadata?iscn_id&class_id=
  return axios
    .get(`https://api.like.co/likernft/metadata?iscn_id=${nftid}`)
    .catch((err) => {
      console.log(err);
    });
}

export function getISCNListByOwner(address, next) {
  // https://mainnet-node.like.co/iscn/records?owner=like13f4glvg80zvfrrs7utft5p68pct4mcq7t5atf6&limit=100&key=2251261

  return axios
    .get(
      `https://mainnet-node.like.co/likechain/likenft/v1/class?iscn_owner=like13f4glvg80zvfrrs7utft5p68pct4mcq7t5atf6&reverse=true&key=${
        next ? next : ''
      }`,
    );
}

export function getNFTListByOwner(address, next) {
  // /likechain/likenft/v1/owner
  return axios
    .get(
      `https://mainnet-node.like.co/cosmos/nft/v1beta1/nfts?owner=${address}&pagination.key=${next ? next : ''}&pagination.limit=300`,
    );
}

export function getCollectRankByCollecterAddress(address, next){
  // https://api.like.co/users/addr/like16th22kku9h7mq8t88kecc038qrkr3md9qme02n/min

  let originUnix = format(new Date(2000, 0, 1), 't');
  return axios
    .get(
      `https://mainnet-node.like.co/likechain/likenft/v1/ranking?ignore_list=like17m4vwrnhjmd20uu7tst7nv0kap6ee7js69jfrs&ignore_list=like1yney2cqn5qdrlc50yr5l53898ufdhxafqz9gxp&created_after=${originUnix}&order_by=sold_count&stakeholder_name=&include_owner=false&creator=&collector=${address}&type=&limit=100`,
    )
    .catch((err) => {
      console.log(err);
    });
}

export function getNFTbyID(class_id){
  return axios
    .get(
      `https://api.like.co/likernft/mint?iscn_id=&class_id=${class_id}`,
    )
    .catch((err) => {
      console.log(err);
    });
}
