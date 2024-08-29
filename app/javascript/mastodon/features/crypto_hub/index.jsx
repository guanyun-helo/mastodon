//A PAGE WITH instagram style  of top 30 crypto currencies prices

import React, { useEffect, useState } from 'react';

import axios from 'axios';
import './index.scss';

const CryptoHub = () => {
  const [cryptoData, setCryptoData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCryptoData = async () => {
      try {
        const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
          params: {
            vs_currency: 'usd',
            order: 'market_cap_desc',
            per_page: 30,
            page: 1,
            sparkline: false
          }
        });
        setCryptoData(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch crypto data');
        setLoading(false);
      }
    };

    fetchCryptoData();

  }, []);

  return (
    <div className='crypto-hub'>
      <header className='crypto-hub__header'>
        <h1 className='crypto-hub__title'>Crypto Hub</h1>
      </header>
      {loading && <div className='crypto-hub__loader'>Loading...</div>}
      {error && <div className='crypto-hub__error'>Error: {error}</div>}
      <div className='crypto-hub__table'>
        <div className='crypto-hub__table-header'>
          <div className='crypto-hub__table-cell'>#</div>
          <div className='crypto-hub__table-cell'>Coin</div>
          <div className='crypto-hub__table-cell'>Price</div>
          <div className='crypto-hub__table-cell'>24h</div>
          <div className='crypto-hub__table-cell'>Market Cap</div>
        </div>
        {cryptoData.map((crypto, index) => (
          <div key={crypto.id} className='crypto-hub__table-row'>
            <div className='crypto-hub__table-cell'>{index + 1}</div>
            <div className='crypto-hub__table-cell crypto-hub__coin-info'>
              <img src={crypto.image} alt={crypto.name} className='crypto-hub__coin-image' />
              <span className='crypto-hub__coin-name'>{crypto.name}</span>
              <span className='crypto-hub__coin-symbol'>{crypto.symbol.toUpperCase()}</span>
            </div>
            <div className='crypto-hub__table-cell'>${crypto.current_price.toLocaleString()}</div>
            <div className={`crypto-hub__table-cell crypto-hub__price-change ${crypto.price_change_percentage_24h > 0 ? 'positive' : 'negative'}`}>
              {crypto.price_change_percentage_24h.toFixed(2)}%
            </div>
            <div className='crypto-hub__table-cell'>${crypto.market_cap.toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CryptoHub;