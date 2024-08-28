export const mainConfig = {
    id: 'likecoin-mainnet-2',
    name: 'LikeCoin',
    logo: 'logo.svg',
    website: 'https://like.co',
    apiURL: 'https://mainnet-node.like.co',
    rpcURL: 'https://mainnet-node.like.co/rpc/',
    stakingWalletURL: 'https://stake.like.co',
    stakingDenom: 'LIKE',
    coinLookup: [{
      viewDenom: 'LIKE',
      chainDenom: 'nanolike',
      chainToViewConversionFactor: '0.000000001',
      icon: 'currencies/like.png',
      coinGeckoId: 'likecoin',
    }],
    addressPrefix: 'like',
    icon: 'https://like.co/logo.png',
  };
  
  export const testnetConfig = {
    id: 'likecoin-public-testnet-5',
    name: 'LikeCoin public test chain',
    apiURL: 'https://node.testnet.like.co',
    rpcURL: 'https://node.testnet.like.co/rpc/',
    stakingWalletURL: 'https://likecoin-public-testnet-5.netlify.app/',
    stakingDenom: 'EKIL',
    coinLookup: [{
      viewDenom: 'EKIL',
      chainDenom: 'nanoekil',
      chainToViewConversionFactor: '0.000000001',
      icon: 'currencies/like.png',
      coinGeckoId: 'likecoin',
    }],
  };