import React from 'react';

import type { List } from 'immutable';

import VerifiedUser from '@/material-icons/400-24px/verified_user.svg?react';
import { Icon } from 'mastodon/components/icon';
import type { Account, AccountRole } from 'mastodon/models/account';

import { autoPlayGif } from '../initial_state';

import { Skeleton } from './skeleton';

//like

interface Props {
  account?: Account;
  others?: List<Account>;
  localDomain?: string;
}

export class DisplayName extends React.PureComponent<Props> {
  handleMouseEnter: React.ReactEventHandler<HTMLSpanElement> = ({
    currentTarget,
  }) => {
    if (autoPlayGif) {
      return;
    }

    const emojis =
      currentTarget.querySelectorAll<HTMLImageElement>('img.custom-emoji');

    emojis.forEach((emoji) => {
      const originalSrc = emoji.getAttribute('data-original');
      if (originalSrc != null) emoji.src = originalSrc;
    });
  };

  handleMouseLeave: React.ReactEventHandler<HTMLSpanElement> = ({
    currentTarget,
  }) => {
    if (autoPlayGif) {
      return;
    }

    const emojis =
      currentTarget.querySelectorAll<HTMLImageElement>('img.custom-emoji');

    emojis.forEach((emoji) => {
      const staticSrc = emoji.getAttribute('data-static');
      if (staticSrc != null) emoji.src = staticSrc;
    });
  };
  getRoleClass = (role: string | undefined) => {
    switch (role) {
      case 'Owner': return 'display-name--owner';
      case '少校艦長': return 'display-name--commander';
      case '學員艦長': return 'display-name--cadet';
      case '中尉艦長': return 'display-name--lieutenant';
      default: return '';
      }
  };

  
  render() {
    const { others, localDomain } = this.props;

    let displayName: React.ReactNode,
      suffix: React.ReactNode,
      account: Account | undefined;

    if (others && others.size > 0) {
      account = others.first();
    } else if (this.props.account) {
      account = this.props.account;
    }
    const roles:List<AccountRole> | undefined = account?.get('roles', []);
    const roleName = roles?.get(0)?.get('name');
    if (others && others.size > 1) {
      displayName = others
        .take(2)
        .map((a) => (
          <bdi key={a.get('id')}>
            <strong
              className='display-name__html'
              dangerouslySetInnerHTML={{ __html: a.get('display_name_html') }}
            />
            {roleName && <Icon className={this.getRoleClass(roleName)}id='VerifiedUser' icon={VerifiedUser}  />}
          </bdi>
        ))
        .reduce((prev, cur) => [prev, ', ', cur]);

      if (others.size - 2 > 0) {
        suffix = `+${others.size - 2}`;
      }
    } else if (account) {
      let acct = account.get('acct');

      if (!acct.includes('@') && localDomain) {
        acct = `${acct}@${localDomain}`;
      }

      displayName = (
        <bdi>
          <strong
            className='display-name__html'
            dangerouslySetInnerHTML={{
              __html: account.get('display_name_html'),
            }}
          />
            {roleName && <Icon className={this.getRoleClass(roleName)} id='VerifiedUser' icon={VerifiedUser}  />}
        </bdi>
      );
      suffix = <span className='display-name__account'>@{acct}</span>;
    } else {
      displayName = (
        <bdi>
          <strong className='display-name__html'>
            <Skeleton width='10ch' />
          </strong>
        </bdi>
      );
      suffix = (
        <span className='display-name__account'>
          <Skeleton width='7ch' />
        </span>
      );
    }

    return (
      <span
        className='display-name'
        onMouseEnter={this.handleMouseEnter}
        onMouseLeave={this.handleMouseLeave}
      >
        {displayName} {suffix}
      </span>
    );
  }
}
