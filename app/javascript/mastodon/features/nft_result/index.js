import React, { useState, useEffect } from 'react';
import lottie from 'lottie-web';
import animte from './animate.json';
import {
  AnchorButton,
  Button,
  Code,
  Dialog,
  DialogBody,
  DialogFooter,
  DialogProps,
  H5,
  Switch,
} from '@blueprintjs/core';

import { getISCNById, getLikerInfoByAddress } from '../../utils/api/like';
import AutosuggestTextarea from '../../components/autosuggest_textarea';

function NftResult(props) {
  const [show, setShow] = useState(false);

  const handleClose = () => {
    props.onMintResultNFTChange(false);
  };
  const handleShow = () => setShow(true);

  const [likerInfo, setLikerInfo] = useState({});
  const [iscn, setIscn] = useState({});
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (props.isOpen) {
      setTimeout(() => {
        lottie.loadAnimation({
          container: document.querySelector('.nft-result-animation'), // the dom element that will contain the animation
          renderer: 'canvas',
          loop: false,
          autoplay: true,
          animationData: animte, // the path to the animation json
          animateDuration: 2000,
        });
        setTimeout(()=>{
          setAnimate(true);
        }, 2100);
      });
    }
    if (props.nftResult !== undefined) {
      (async () => {
        let res = await getISCNById(props.nftResult.iscnId);
        let likerInfo = await getLikerInfoByAddress(props.nftResult.ownerWallet);
        setLikerInfo({ ...likerInfo });
        setIscn({ ...res });
      })();
    }
  }, [props.isOpen, props.nftResult]);

  let record;
  if(iscn !== null && iscn.records !== undefined){
    record = iscn.records[0].data;
  }
  return (
    <Dialog className='nft-result' isOpen={props.isOpen} onClose={handleClose} onHide={handleClose} canOutsideClickClose={true} canEscapeKeyClose='true' shouldReturnFocusOnClose='true'>
      <DialogBody>
        {' '}
        <div class='nft-result-container'>
          <div
            style={{ zIndex: animate ? 0 : 10 }}
            className='nft-result-animation'
          />
          <div class='wrapper'>
            <div class='card'>
              {' '}
              <img
                href='#'
                className='card-img animate_fadeInDown'
                src={`https://static.like.co/thumbnail/?url=https://api.like.co/likernft/metadata/image/class_${props.nftResult?.classId}?size=1280&width=720`}
              />
              <div class='info'>
                <h1>{likerInfo?.displayName ? likerInfo?.displayName : ''}</h1>
                <h2>{record !== null ? record?.contentMetadata.name : ''}</h2>
                <p>
                  {record !== null ? record?.contentMetadata.description : ''}
                </p>
                {/* <button>Read More</button> */}
              </div>
            </div>
          </div>
        </div>
      </DialogBody>
      {/* <DialogFooter>
        <Button variant='secondary' onClick={handleClose}>
          Close
        </Button>
        <Button variant='primary' onClick={handleClose}>
          Save Changes
        </Button>
      </DialogFooter> */}
    </Dialog>
  );
}

export default NftResult;
