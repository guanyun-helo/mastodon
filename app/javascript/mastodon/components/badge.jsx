import PropTypes from 'prop-types';

import { FormattedMessage } from 'react-intl';

import GroupsIcon from '@/material-icons/400-24px/group.svg?react';
import PersonIcon from '@/material-icons/400-24px/person.svg?react';
import SmartToyIcon from '@/material-icons/400-24px/smart_toy.svg?react';


export const Badge = ({ icon = <PersonIcon />, label, domain, roleId }) => {
  const getRoleClass = (label) => {
    const labelContent = typeof label === 'string' ? label : label?.props?.children;
    switch (labelContent) {
    case 'Owner': return 'account-role--owner';
    case '少校艦長': return 'account-role--commander';
    case '學員艦長': return 'account-role--cadet';
    case '中尉艦長': return 'account-role--lieutenant';
    default: return '';
    }
  };

  return (
    <div className={`account-role ${getRoleClass(label)}`} data-account-role-id={roleId}>
      {icon}
      <span className='account-role__label'>{label}</span>
      {domain && <span className='account-role__domain'>{domain}</span>}
    </div>
  );
};

Badge.propTypes = {
  icon: PropTypes.node,
  label: PropTypes.node,
  domain: PropTypes.node,
  roleId: PropTypes.string
};

export const GroupBadge = () => (
  <Badge icon={<GroupsIcon />} label={<FormattedMessage id='account.badges.group' defaultMessage='Group' />} />
);

export const AutomatedBadge = () => (
  <Badge icon={<SmartToyIcon />} label={<FormattedMessage id='account.badges.bot' defaultMessage='Automated' />} />
);
