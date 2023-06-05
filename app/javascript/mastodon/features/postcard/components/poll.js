/* eslint-disable react/jsx-key */
import React, { useState } from 'react';

export default function Poll({ poll }) {
  return (
    <div id='poll'>
      {poll.options.map((x) => {
        const percentageStr = poll.voters_count === 0 ? 0 :  `${(x.votes_count/  poll.voters_count)}%`;
        return (
          <div className='poll-option'>
            <div className='poll-bar' style={{ width: percentageStr }} />
            <span>{x.title}</span>
            <span>{poll.voters_count === 0 ? 0 :  `${(x.votes_count/  poll.voters_count)}%`}%</span>
          </div>
        );
      })}
    </div>
  );
}
