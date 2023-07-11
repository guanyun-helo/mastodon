/* eslint-disable react/jsx-key */
import React, { useState } from 'react';

export default function Poll({ poll }) {
  let temPoll = poll;
  if(!poll.options){
    temPoll = Object.fromEntries(poll);
    temPoll.voters_count = temPoll.options.size;
    let options = []
    temPoll.options.map((item)=>{
      item = {
        title: item,
        votes_count: 0,
      }
      options.push(item)
    })
    temPoll.options = options;
  }
  return (
    <div id='poll'>
      {temPoll.options.map((x) => {
        const percentageStr = temPoll.voters_count === 0 ? 0 :  `${(x.votes_count/  temPoll.voters_count)}%`;
        return (
          <div className='poll-option'>
            <div className='poll-bar' style={{ width: percentageStr }} />
            <span>{x.title}</span>
            <span>{temPoll.voters_count === 0 ? 0 :  `${(x.votes_count/  temPoll.voters_count)}%`}</span>
          </div>
        );
      })}
    </div>
  );
}
