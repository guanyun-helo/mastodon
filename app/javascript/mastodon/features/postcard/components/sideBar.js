import React from 'react';

import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import InputGroup from 'react-bootstrap/InputGroup';

function SideBar(props) {
  return (
    <div id='customization'>
      <label className='section'>明信片標題</label>

      <InputGroup
        value={props.postCardName}
        onChange={props.onPostCardNameChange}
        className='nft-postcard-name'
      >
        <InputGroup.Text id='basic-addon1'>明信片標題</InputGroup.Text>
        <Form.Control
          placeholder='不填寫的話會自動取得內容前十個字哦！'
          aria-label='PostCardName'
          aria-describedby='basic-addon1'
        />
      </InputGroup>
      <label className='section'>自定</label>
      <div id='switches'>
        <span className='sub-section'>嘟嘟卡</span>

        <Form.Switch
          label='圓角'
          id='corner-switch'
          onChange={props.onSwitchRounded}
          defaultChecked
        />

        <Form.Switch
          label='邊框'
          id='border-switch'
          onChange={props.onSwitchBorder}
        />

        <Form.Switch
          label='純白背景'
          id='background-switch'
          onChange={props.onSwitchBoxBackground}
          checked={props.solid ? props.boxBackground : true}
          disabled={!props.solid}
        />

        <Form.Switch
          label='陰影'
          id='shadow-switch'
          onChange={props.onSwitchShadow}
          defaultChecked
        />

        <Form.Switch
          label='附圖剪裁'
          id='crop-switch'
          onChange={props.onSwitchImageCrop}
          disabled={!props.imageCropDisabled}
        />
      </div>

      <span className='sub-section'>背景色</span>

      {props.children}

      <span className='sub-section'>大小</span>

      <Form.Check
        inline
        label='較窄'
        type={'radio'}
        value='square'
        onChange={props.onSwitchImageSize}
        checked={props.imageSize === 'square'}
        id={'inline-radio-square'}
      />
      <Form.Check
        inline
        label='較寬'
        value='wide'
        onChange={props.onSwitchImageSize}
        checked={props.imageSize === 'wide'}
        type={'radio'}
        id={'inline-radio-wide'}
      />

      <button onClick={props.onGenerate}>
        {props.genLoading ? (
          <Spinner
            className='gen-spinner'
            animation='border'
            role='status'
            variant='light'
            size='sm'
          >
            <span style={{ color: '#fff' }} className='visually-hidden'>鑄造中....</span>
          </Spinner>
        ) : (
          '鑄造成 NFT 明信片'
        )}
      </button>
      <button onClick={props.onSendToot}>
        直接发嘟嘟
      </button>
    </div>
  );
}

export default SideBar;
