import PropTypes from 'prop-types';
import React from 'react';
import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import ImmutablePropTypes from 'react-immutable-proptypes';
import ImmutablePureComponent from 'react-immutable-pure-component';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { createSelector } from 'reselect';
import Icon from 'mastodon/components/icon';
import LoadingIndicator from 'mastodon/components/loading_indicator';
import ScrollableList from 'mastodon/components/scrollable_list';
import Column from 'mastodon/components/column';
import ColumnHeader from 'mastodon/components/column_header';
import { Button, Card, Elevation } from '@blueprintjs/core';
import { getLikeAuth, getLikerId } from 'mastodon/actions/accounts';
import api from '../../api';
import { mainConfig } from './util/wallet';
import { LikeCoinWalletConnector } from '@likersocial/wallet-connector';
import {
  assertIsDeliverTxSuccess,
  SigningStargateClient,
} from '@cosmjs/stargate';

export default function Keplr() {
  const [connector, setConnector] = useState({});
  const [method, setMethod] = useState({});
  const [walletAddress, setWalletAddress] = useState('');
  const [offlineSigner, setOfflineSigner] = useState({});

  const handleConnection = (connection) => {
    if (!connection) return;
    const {
      method,
      accounts: [account],
      offlineSigner,
    } = connection;

    setMethod(method);
    setWalletAddress(account.address);
    setOfflineSigner(offlineSigner);
    connector.once('account_change', handleAccountChange);
  };
  const handleAccountChange = async (method) => {
    const connection = await connector.init(method);
    handleConnection(connection);
  };
  const connect = async () => {
    const connection = await connector.openConnectWalletModal();
    handleConnection(connection);
  };

  useEffect(() => {
    let connector = new LikeCoinWalletConnector({
      chainId: 'likecoin-mainnet-2',
      chainName: 'LikeCoin',
      rpcURL: 'https://mainnet-node.like.co/rpc/',
      restURL: 'https://mainnet-node.like.co',
      coinType: 118,
      coinDenom: 'LIKE',
      coinMinimalDenom: 'nanolike',
      coinDecimals: 9,
      coinGeckoId: 'likecoin',
      bech32PrefixAccAddr: 'like',
      bech32PrefixAccPub: 'likepub',
      bech32PrefixValAddr: 'likevaloper',
      bech32PrefixValPub: 'likevaloperpub',
      bech32PrefixConsAddr: 'likevalcons',
      bech32PrefixConsPub: 'likevalconspub',
      availableMethods: [],
      keplrSignOptions: {
        disableBalanceCheck: true,
        preferNoSetFee: true,
        preferNoSetMemo: true,
      },
      keplrInstallURLOverride: 'https://www.keplr.app/download',
      keplrInstallCTAPreset: 'fancy-banner',
      cosmostationDirectSignEnabled: true,

      language: 'zh',
    });
    setConnector(connector);
    const session = connector.restoreSession();
    handleConnection(session);
  }, []);
  return (
    <div class="nav-btn">
      <a
        onClick={connect}
        target="_blank"
        aria-current="page"
        class="btn small w-inline-block w--current"
      >
        <div class="icon-medium w-embed">
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 29 29"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M15.735 4.36255H12.8011C11.2763 4.36255 10.0791 4.36254 9.12215 4.45228C8.14629 4.5438 7.34361 4.73377 6.6345 5.16234C5.89353 5.61018 5.26952 6.22525 4.81424 6.95799C4.37763 7.6607 4.18418 8.45652 4.09112 9.42179C3.99999 10.3671 4 11.5491 4 13.0516V15.9484C4 17.4509 3.99999 18.6329 4.09112 19.5782C4.18418 20.5435 4.37763 21.3393 4.81424 22.042C5.26952 22.7748 5.89353 23.3898 6.6345 23.8377C7.34361 24.2662 8.14629 24.4562 9.12215 24.5477C10.0791 24.6375 11.2763 24.6375 12.8011 24.6374H15.735C17.2598 24.6375 18.457 24.6375 19.414 24.5477C20.3898 24.4562 21.1925 24.2662 21.9016 23.8377C22.6426 23.3898 23.2666 22.7748 23.7219 22.042C24.1585 21.3393 24.352 20.5435 24.445 19.5782C24.5361 18.6329 24.5361 17.4509 24.5361 15.9483V13.0517C24.5361 11.5492 24.5361 10.3671 24.445 9.42179C24.352 8.45652 24.1585 7.6607 23.7219 6.95799C23.2666 6.22525 22.6426 5.61018 21.9016 5.16234C21.1925 4.73377 20.3898 4.5438 19.414 4.45228C18.457 4.36254 17.2598 4.36255 15.735 4.36255ZM9.2622 5.94573C10.141 5.86332 11.2682 5.86255 12.8404 5.86255H15.6958C17.268 5.86255 18.3951 5.86332 19.2739 5.94573C20.142 6.02714 20.6905 6.18301 21.1257 6.44609C21.6655 6.7723 22.1182 7.21924 22.4478 7.74962C22.7125 8.1756 22.8697 8.71235 22.9519 9.56573C23.0353 10.4307 23.0361 11.5407 23.0361 13.0919V15.9081C23.0361 17.4593 23.0353 18.5693 22.9519 19.4343C22.8697 20.2877 22.7125 20.8244 22.4478 21.2504C22.1182 21.7808 21.6655 22.2277 21.1257 22.5539C20.6905 22.817 20.142 22.9729 19.2739 23.0543C18.3951 23.1367 17.268 23.1374 15.6958 23.1374H12.8404C11.2682 23.1374 10.141 23.1367 9.2622 23.0543C8.39408 22.9729 7.84566 22.817 7.41039 22.5539C6.87066 22.2277 6.41788 21.7808 6.08834 21.2504C5.82367 20.8244 5.66647 20.2877 5.5842 19.4343C5.50081 18.5693 5.5 17.4593 5.5 15.9081V13.0919C5.5 11.5407 5.50081 10.4307 5.5842 9.56573C5.66647 8.71235 5.82367 8.1756 6.08834 7.74962C6.41788 7.21924 6.87066 6.7723 7.41039 6.44609C7.84566 6.18301 8.39408 6.02714 9.2622 5.94573Z"
              fill="currentColor"
            />
            <path
              d="M11.9105 19.5848V15.0373L16.3605 19.5848H18.8358V19.4668L13.7178 14.2895L18.441 9.37633V9.31732H15.9498L11.9105 13.6588V9.31732H9.90576V19.5848H11.9105Z"
              fill="currentColor"
            />
          </svg>
        </div>
        <div>Keplr(Coming soon)</div>
      </a>
    </div>
  );
}
