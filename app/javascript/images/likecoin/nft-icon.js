import React, { useEffect } from 'react';


export default function NftIcon(props) {
  return (
    <svg style={props.style} xmlns='http://www.w3.org/2000/svg' viewBox='0 0 448 512'>
      <path
        d='M0 128V384L224 512 448 384V128L224 0 0 128zm80 32h8H99.9l3.4 11.4L128 253.7V176 160h32v16V336v16H144h-8H124.1l-3.4-11.4L96 258.3V336v16H64V336 176 160H80zm128 0h48 16v32H256 224v48h32 16v32H256 224v64 16H192V336 256 176 160h16zm96 0h32 32 16v32H368 352V336v16H320V336 192H304 288V160h16z'
      />
    </svg>
  );
}
