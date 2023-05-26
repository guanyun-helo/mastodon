import React from 'react';

import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import InputGroup from 'react-bootstrap/InputGroup';


function SideBar(props) {

  return (
    <div id='customization'>
      <label className='section'>NFT PostCard Name</label>

      <InputGroup value={props.postCardName} onChange={props.onPostCardNameChange} className='nft-postcard-name'>
        <InputGroup.Text id='basic-addon1'>NFT PostCard Name</InputGroup.Text>
        <Form.Control
          placeholder='NFT PostCard Name'
          aria-label='PostCardName'
          aria-describedby='basic-addon1'
        />
      </InputGroup>
      <label className='section'>Customization</label>
      <div id='switches'>
        <span className='sub-section'>Tweet card</span>

        <Form.Switch
          label='Rounded corners'
          id='corner-switch'
          onChange={props.onSwitchRounded}
          defaultChecked
        />

        <Form.Switch
          label='Border'
          id='border-switch'
          onChange={props.onSwitchBorder}
        />

        <Form.Switch
          label='White background'
          id='background-switch'
          onChange={props.onSwitchBoxBackground}
          checked={props.solid ? props.boxBackground : true}
          disabled={!props.solid}
        />

        <Form.Switch
          label='Shadow'
          id='shadow-switch'
          onChange={props.onSwitchShadow}
          defaultChecked
        />

        <Form.Switch
          label='Image crop'
          id='crop-switch'
          onChange={props.onSwitchImageCrop}
          disabled={!props.imageCropDisabled}
        />

      </div>

      <span className='sub-section'>Background</span>

      {props.children}

      <span className='sub-section'>Size</span>

      <Form.Check
        inline
        label='square'
        type={'radio'}
        value='square'
        onChange={props.onSwitchImageSize}
        checked={props.imageSize === 'square'}
        id={'inline-radio-square'}
      />
      <Form.Check
        inline
        label='wide'
        value='wide'
        onChange={props.onSwitchImageSize}
        checked={props.imageSize === 'wide'}
        type={'radio'}
        id={'inline-radio-wide'}
      />

      <button onClick={props.onGenerate}>
        Mint Toot to Nft PostCard
        {props.genLoading && <Spinner className='gen-spinner' animation='border' role='status' variant='light' size='sm'>
          <span className='visually-hidden'>Loading...</span>
        </Spinner>}
      </button>

    </div>
  );
}

export default SideBar;
