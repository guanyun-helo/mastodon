import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import NftBadge from '../../images/likecoin/nft-badge';
import NftIcon from '../../images/likecoin/nft-icon';
import Clap from '../../images/likecoin/clap';
import Wallet from '../../images/likecoin/wallet';

export default class Icon extends React.PureComponent {

  static propTypes = {
    id: PropTypes.string.isRequired,
    className: PropTypes.string,
    fixedWidth: PropTypes.bool,
    type: PropTypes.string,
  };

  componentDidMount () {

  }

  render () {
    const { id, type, className, fixedWidth, ...other } = this.props;

    if(type === 'self'){
      return (
        <i className={classNames('fa fa-svgs', className, { 'fa-fw': fixedWidth })} {...other} >
          <NftBadge style={{ display: id === 'nftBadge' ?  'block': 'none' }} />
          <NftIcon style={{ display: id === 'nftIcon' ?  'block': 'none' }} />
          <Clap style={{ display: id === 'clap' ?  'block': 'none' }} />
          <Wallet style={{ display: id === 'wallet' ?  'block': 'none' }} />
        </i>
      );
    }else{
      return (
        <i className={classNames('fa', `fa-${id}`, className, { 'fa-fw': fixedWidth })} {...other} />
      );
    }
  }

}
