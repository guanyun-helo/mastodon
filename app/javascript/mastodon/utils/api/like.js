/* eslint-disable promise/catch-or-return */
import axios from 'axios';
import { format } from 'date-fns';
import localforage from 'localforage';


export async function getChainNFTIdList (classId) {
  let url = `https://mainnet-node.like.co/likechain/likenft/v1/owner?class_id=${classId}`;
  let result = null;
  let cache = await localforage.getItem(url);
  const getData = () => {
    return axios
      .get(url)
      .then((res) => {
        localforage.setItem(url, res.data);
        return res.data;
      })
      .catch((err) => {
        console.log(err);
      });
  };
  if(cache === null){
    result = await getData();
  }else{
    getData();
    result = cache;
  }
  return result;
}


export async function getCoinPrice() {
  let url =
    'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,cosmos,ion,crypto-com-chain,osmosis,likecoin&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&include_last_updated_at=true';
  let result = null;
  let cache = await localforage.getItem(url);
  const getData = () => {
    return axios
      .get(url)
      .then((res) => {
        localforage.setItem(url, res.data);
        return res.data;
      })
      .catch((err) => {
        console.log(err);
      });
  };
  if(cache === null){
    result = await getData();
  }else{
    getData();
    result = cache;
  }
  return result;
}

export async function getTrending() {

  let now = new Date();
  let sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  let sevenDaysAgoUnix = format(sevenDaysAgo, 't');
  let nowUnix = format(now, 't');
  let url = `https://mainnet-node.like.co/likechain/likenft/v1/ranking?ignore_list=like17m4vwrnhjmd20uu7tst7nv0kap6ee7js69jfrs&ignore_list=like1yney2cqn5qdrlc50yr5l53898ufdhxafqz9gxp&after=${sevenDaysAgoUnix}&before=${nowUnix}&created_after=${sevenDaysAgoUnix}&created_before=${nowUnix}&stakeholder_name=&creator=&collector=&type=&limit=100`;
  let result = null;
  let cache = await localforage.getItem(url);

  const getData = () => {
    return axios
      .get(url)
      .then((res) => {
        localforage.setItem(url, res.data);
        return res.data;
      })
      .catch((err) => {
        console.log(err);
      });
  };

  if(cache === null){
    result = await getData();
  }else{
    getData();
    result = cache;
  }
  return result;
}

export async function getLatestByOwner(address) {
  let now = new Date();
  let sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  let sevenDaysAgoUnix = format(sevenDaysAgo, 't');
  let nowUnix = format(now, 't');
  let url = `https://mainnet-node.like.co/likechain/likenft/v1/ranking?ignore_list=like17m4vwrnhjmd20uu7tst7nv0kap6ee7js69jfrs&ignore_list=like1yney2cqn5qdrlc50yr5l53898ufdhxafqz9gxp&after=${sevenDaysAgoUnix}&before=${nowUnix}&created_after=${sevenDaysAgoUnix}&created_before=${nowUnix}&stakeholder_name=&creator${address}=&collector=&type=&limit=100`;
  let result = null;
  let cache = await localforage.getItem(url);
  const getData = () => {
    return axios
      .get(url)
      .then((res) => {
        localforage.setItem(url, res.data);
        return res.data;
      })
      .catch((err) => {
        console.log(err);
      });
  };
  if(cache === null){
    result = await getData();
  }else{
    getData();
    result = cache;
  }
  return result;
}

export async function getTopByOwner(address) {
  let url = `https://mainnet-node.like.co/likechain/likenft/v1/ranking?ignore_list=like17m4vwrnhjmd20uu7tst7nv0kap6ee7js69jfrs&ignore_list=like1yney2cqn5qdrlc50yr5l53898ufdhxafqz9gxp&after=1656633600&before=1681430400&created_after=1656633600&created_before=1681430400&stakeholder_name=&creator${address}=&collector=&type=&limit=100`;
  let result = null;
  let cache = await localforage.getItem(url);
  const getData = () => {
    return axios
      .get(url)
      .then((res) => {
        localforage.setItem(url, res.data);
        return res.data;
      })
      .catch((err) => {
        console.log(err);
      });
  };
  if(cache === null){
    result = await getData();
  }else{
    getData();
    result = cache;
  }
  return result;
}

export async function getNFTmeta(nftid) {
  let url = `https://api.like.co/likernft/metadata?iscn_id&class_id=${nftid}`;
  let result = null;
  let cache = await localforage.getItem(url);
  const getData = () => {
    return axios
      .get(url)
      .then((res) => {
        localforage.setItem(url, res.data);
        return res.data;
      })
      .catch((err) => {
        console.log(err);
      });
  };
  if(cache === null){
    result = await getData();
  }else{
    getData();
    result = cache;
  }
  return result;
}
export async function getTop() {
  let url = 'https://mainnet-node.like.co/likechain/likenft/v1/ranking?ignore_list=like17m4vwrnhjmd20uu7tst7nv0kap6ee7js69jfrs&ignore_list=like1yney2cqn5qdrlc50yr5l53898ufdhxafqz9gxp&after=1656633600&before=1681430400&created_after=1656633600&created_before=1681430400&stakeholder_name=&creator=&collector=&type=&limit=100';
  let result = null;
  let cache = await localforage.getItem(url);
  const getData = () => {
    return axios
      .get(url)
      .then((res) => {
        localforage.setItem(url, res.data);
        return res.data;
      })
      .catch((err) => {
        console.log(err);
      });
  };
  if(cache === null){
    result = await getData();
  }else{
    getData();
    result = cache;
  }
  return result;
}

export async function getLatest(nextKey) {
  let url = `https://mainnet-node.like.co/likechain/likenft/v1/class?reverse=true&key=${
    nextKey || ''
  }&limit=5`;
  let result = null;
  let cache = await localforage.getItem(url);
  const getData = () => {
    return axios
      .get(url)
      .then((res) => {
        localforage.setItem(url, res.data);
        return res.data;
      })
      .catch((err) => {
        console.log(err);
      });
  };
  if(cache === null){
    result = await getData();
  }else{
    getData();
    result = cache;
  }
  return result;
}
export async function getNftImage(nftClass) {
  let url = `https://api.like.co/likernft/metadata/image/class_${nftClass}?size=450`;
  let result = null;
  let cache = await localforage.getItem(url);
  const getData = () => {
    return axios
      .get(url)
      .then((res) => {
        localforage.setItem(url, res.data);
        return res.data;
      })
      .catch((err) => {
        console.log(err);
      });
  };
  if(cache === null){
    result = await getData();
  }else{
    getData();
    result = cache;
  }
  return result;
}

export async function getLikerInfoByAddress(address) {
  let url = `https://api.like.co/users/addr/${address}/min`;

  let result = null;
  let cache = await localforage.getItem(url);
  const getData = () => {
    return axios
      .get(url)
      .then((res) => {
        localforage.setItem(url, res.data);
        return res.data;
      })
      .catch((err) => {
        console.log(err);
      });
  };
  if(cache === null){
    result = await getData();
  }else{
    getData();
    result = cache;
  }
  return result;
}

export async function getSaleStatsByAddress(address) {
  let url = `https://api.like.co/likernft/user/${address}/stats`;
  let result = null;
  let cache = await localforage.getItem(url);
  const getData = () => {
    return axios
      .get(url)
      .then((res) => {
        localforage.setItem(url, res.data);
        return res.data;
      })
      .catch((err) => {
        console.log(err);
      });
  };
  if(cache === null){
    result = await getData();
  }else{
    getData();
    result = cache;
  }
  return result;
}

export async function getOwnerByISCN(ISCN) {
  let url = `https://mainnet-node.like.co/iscn/records/id?iscn_id=${ISCN}`;
  let result = null;
  let cache = await localforage.getItem(url);
  const getData = () => {
    return axios
      .get(url)
      .then((res) => {
        localforage.setItem(url, res.data);
        return res.data;
      })
      .catch((err) => {
        console.log(err);
      });
  };
  if(cache === null){
    result = await getData();
  }else{
    getData();
    result = cache;
  }
  return result;
}
export async function getNFTmetaByISCN(nftid) {
  let url = `https://api.like.co/likernft/metadata?iscn_id=${nftid}`;
  let result = null;
  let cache = await localforage.getItem(url);
  const getData = () => {
    return axios
      .get(url)
      .then((res) => {
        localforage.setItem(url, res.data);
        return res.data;
      })
      .catch((err) => {
        console.log(err);
      });
  };
  if(cache === null){
    result = await getData();
  }else{
    getData();
    result = cache;
  }
  return result;
}
// https://mainnet-node.like.co/likechain/likenft/v1/class?iscn_owner=like13f4glvg80zvfrrs7utft5p68pct4mcq7t5atf6&reverse=true
export async function getISCNListByOwner(address, next) {
  let url = `https://mainnet-node.like.co/likechain/likenft/v1/class?iscn_owner=${address}&limit=100&reverse=true&key=${
    next ? next : ''
  }`;
  let result = null;
  let cache = await localforage.getItem(url);
  const getData = () => {
    return axios
      .get(url)
      .then((res) => {
        localforage.setItem(url, res.data);
        return res.data;
      })
      .catch((err) => {
        console.log(err);
      });
  };
  if(cache === null){
    result = await getData();
  }else{
    getData();
    result = cache;
  }
  return result;
}

export async function getNFTListByOwner(address, next) {
  let url = `https://mainnet-node.like.co/cosmos/nft/v1beta1/nfts?owner=${address}&pagination.key=${
    next ? next : ''
  }&pagination.limit=300`;
  let result = null;
  let cache = await localforage.getItem(url);
  const getData = () => {
    return axios
      .get(url)
      .then((res) => {
        localforage.setItem(url, res.data);
        return res.data;
      })
      .catch((err) => {
        console.log(err);
      });
  };
  if(cache === null){
    result = await getData();
  }else{
    getData();
    result = cache;
  }
  return result;
}

export async function getCollectRankByCollecterAddress(address, next) {
  let originUnix = format(new Date(2000, 0, 1), 't');
  // https://mainnet-node.like.co/likechain/likenft/v1/nft?owner=like1h6p7gdh5c0qkz0gwyus2rumg74tg5yrmrweu8s&expand_classes=1&pagination.limit=100
  let url = `https://mainnet-node.like.co/likechain/likenft/v1/nft?owner=${address}&expand_classes=1&pagination.limit=100`;
  let result = null;
  let cache = await localforage.getItem(url);
  const getData = () => {
    return axios
      .get(url)
      .then((res) => {
        localforage.setItem(url, res.data);
        return res.data;
      })
      .catch((err) => {
        console.log(err);
      });
  };
  if(cache === null){
    result = await getData();
  }else{
    getData();
    result = cache;
  }
  return result;
}

export async function getNFTbyID(class_id) {
  let url = `https://api.like.co/likernft/mint?iscn_id=&class_id=${class_id}`;
  let result = null;
  let cache = await localforage.getItem(url);
  const getData = () => {
    return axios
      .get(url)
      .then((res) => {
        localforage.setItem(url, res.data);
        return res.data;
      })
      .catch((err) => {
        console.log(err);
      });
  };
  if(cache === null){
    result = await getData();
  }else{
    getData();
    result = cache;
  }
  return result;
}

export async function getNFTbyISCNID(ISCN) {
  let url = `https://api.like.co/likernft/mint?iscn_id=${ISCN}`;
  let result = null;
  let cache = await localforage.getItem(url);
  const getData = () => {
    return axios
      .get(url)
      .then((res) => {
        localforage.setItem(url, res.data);
        return res.data;
      })
      .catch((err) => {
        console.log(err);
      });
  };
  if(cache === null){
    result = await getData();
  }else{
    getData();
    result = cache;
  }
  return result;
}

// https://mainnet-node.like.co/cosmos/nft/v1beta1/nfts?owner=like13f4glvg80zvfrrs7utft5p68pct4mcq7t5atf6
export async function getNFTListByOwnerAddress(classId) {
  // https://mainnet-node.like.co/likechain/likenft/v1/owner?class_id=likenft1ku4ra0e7dgknhd0wckrkxspuultynl4mgkxa3j08xeshfr2l0ujqmmvy83
  let url = `https://mainnet-node.like.co/likechain/likenft/v1/owner?class_id=${classId}`;
  let result = null;
  let cache = await localforage.getItem(url);
  const getData = () => {
    return axios
      .get(url)
      .then((res) => {
        localforage.setItem(url, res.data);
        return res.data;
      })
      .catch((err) => {
        console.log(err);
      });
  };
  if(cache === null){
    result = await getData();
  }else{
    getData();
    result = cache;
  }
  return result;
}

export async function getISCNById(id){
  let url = `https://mainnet-node.like.co/iscn/records/id?iscn_id=${id}`;
  let result = null;
  let cache = await localforage.getItem(url);
  const getData = () => {
    return axios
      .get(url)
      .then((res) => {
        localforage.setItem(url, res.data);
        return res.data;
      })
      .catch((err) => {
        console.log(err);
      });
  };
  if(cache === null){
    result = await getData();
  }else{
    getData();
    result = cache;
  }
  return result;
}
