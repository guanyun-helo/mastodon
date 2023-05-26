import React, { useState, useRef, useEffect }from 'react';
import axios from 'axios';
import { scroller } from 'react-scroll';
import * as htmlToImage from 'html-to-image';
import hash from 'ipfs-only-hash';
import BigNumber from 'bignumber.js';
import FileSaver from 'file-saver';
import { Drawer, Position } from '@blueprintjs/core';
import { signISCNTx } from './utils/cosmos/iscn';
import { DEFAULT_TRANSFER_FEE, sendLIKE } from './utils/cosmos/sign';
import { esimateISCNTxGasAndFee, formatISCNTxPayload } from './utils/cosmos/iscn/sign';
import { getAccountBalance } from './utils/cosmos';

import {
  getLikerIdMinApi,
  getAddressLikerIdMinApi,
  API_POST_ARWEAVE_ESTIMATE,
  API_POST_ARWEAVE_UPLOAD,
  API_POST_NUMBERS_PROTOCOL_ASSETS,
} from './constant/api';

import Tweet from './components/tweet';
import BackgroundPicker from './components/backgroundPicker';
import SideBar from './components/sideBar';
import PhotoUpload from './components/photoUpload';
import { GRADIENTS } from './components/gradientColor';
import { get } from 'lodash';

const serverErrorMsg = 'Twitter server error';

const blackFilter = `linear-gradient(
          rgba(0, 0, 0, 0.7),
          rgba(0, 0, 0, 0.7)
        ), `;
const whiteFilter = `linear-gradient(
          rgba(255, 255, 255, 0.85),
          rgba(255, 255, 255, 0.85)
        ), `;

function luminosity(color) {
  const colorRegex = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
  const r = parseInt(colorRegex[1], 16);
  const g = parseInt(colorRegex[2], 16);
  const b = parseInt(colorRegex[3], 16);

  return Math.round(r*0.299 + g*0.587 + b*0.114);
}

function PostSo(props){
  console.log('props', props);
  const [colorMode, setColorMode] = useState(0);
  // 0 = solid, 1 = gradient, 2 = image

  const [bgGradient, setBgGradient] = useState('linear-gradient(to bottom right, #00FF8F, #60EFFF)');
  const [bgColor, setBgColor] = useState('#E1E8ED');
  const [gradient, setGradient] = useState('g1');

  const [bgImg, setBgImg] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [genLoading, setGenLoading] = useState(false);
  const [resultImg, setResultImg] = useState(null);
  const [imgFilter, setImgFilter] = useState('default');

  const [boxRounded, setBoxRounded] = useState(true);
  const [boxBorder, setBoxBorder] = useState(false);
  const [boxBackground, setBoxBackground] = useState(true);
  const [boxShadow, setBoxShadow] = useState(true);
  const [imageCrop, setImageCrop] = useState(false);
  const [imageSize, setImageSize] = useState('square');
  const [boxText, setBoxText] = useState(null);
  const [modalShow, setModalShow] = React.useState(false);
  const [postCardName, setPostCardName] = useState(null);

  const [uploadArweaveId, setUploadArweaveId] = useState('');
  const [balance, setBalance] = useState(0);
  const [arweaveFee, setArweaveFee] = useState('');
  const [iscnFee, setIscnFee] = useState(0);
  const [arweaveFeeTargetAddress, setArweaveFeeTargetAddress] = useState('');
  const [address, setAddress] = useState('');
  const [payload, setPayload] = useState();
  const [fileBlob, setFileBlob] = useState(new Blob());
  const [fileType, setFileType] = useState('');
  const [exifInfo, setExifInfo] = useState('');
  const [likerInfo, setLikerInfo] = useState({});
  const imageUrlRef = useRef();

  const handleColorChange = (color, event) => setBgColor(color.hex);

  const onFileChange = () => {
    const file = event.target.files[0];
    setSelectedFile(file);

    let reader = new FileReader();
    reader.onload = function(event) {
      setBgImg(event.target.result);
    };

    reader.readAsDataURL(file);
    setModalShow(false);
  };

  const onClickAddImage = () => {
    setModalShow(true);
    setColorMode(2);
  };

  const onClickTrash = () => {
    // setSolidColorMode(true);
    setSelectedFile(null);
    setBgImg(null);
    setImgFilter('default');
  };

  useEffect(() => {
  }, [arweaveFeeTargetAddress]);

  const estimateArweaveFee = async (fileBlob)=> {
    const formData = new FormData();
    if (fileBlob) formData.append('file', fileBlob);
    let result = {};
    try {
      result = await axios.post(
        API_POST_ARWEAVE_ESTIMATE,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );
      setUploadArweaveId(result.data.arweaveId);
      if (result.data.LIKE) setArweaveFee(new BigNumber(result.data.LIKE));
      setArweaveFeeTargetAddress(result.data.address);
      result = { UploadArweaveId: result.data.arweaveId, ArweaveFee:result.data.LIKE, ArweaveFeeTargetAddress:result.data.address, IpfsHash: result.data.ipfsHash };
    } catch (err) {
      // TODO: Handle error
      // eslint-disable-next-line no-console
      console.error(err);
    }
    return result;
  };

  async function getFileIPFSHash(file) {
    const ipfsHash = await hash.of(file.buff());
    return ipfsHash;
  }

  function getPayload(likerInfo, file){
    let tagString = '';
    props.nftStatus.tags.forEach((item)=>{
      tagString = item.name + ',' + tagString;
    });
    console.log('props=>>>>>>>>>>>>', props);
    console.log('file=>>>>>>>>>>>>', file);
    const doc = new DOMParser().parseFromString(props.nftStatus.content, 'text/html');
    let tweetText = doc.documentElement.textContent;
    return {
      type: 'NFT POSTCARD',
      name: postCardName === null ? tweetText.slice(0, 10) : postCardName,
      description: tweetText,
      tagsString: tagString,
      url: props.nftStatus.url,
      exifInfo: exifInfo,
      license: 'CC BY-NC-ND 2.0 版權聲明',
      contentFingerprints: [],
      // ipfsHash: getFileIPFSHash(file),
      arweaveId: uploadArweaveId,
      // numbersProtocolAssetId: '',
      // fileSHA256: '',
      authorNames: likerInfo? [likerInfo.displayName] : undefined,
      authorUrls: [],
      authorWallets: likerInfo ? [likerInfo.likeWallet] : undefined,
      likerIds: likerInfo? [likerInfo.user] : [],
      likerIdsAddresses:[],
      authorDescriptions: likerInfo? likerInfo.description: '',
    };
  }




  const calculateISCNFee = async (payload)=> {
    const [
      balance,
      estimation,
    ] = await Promise.all([
      getAccountBalance(props.address),
      esimateISCNTxGasAndFee(formatISCNTxPayload(payload)),
    ]);
    setBalance(new BigNumber(balance));
    // this.balance = new BigNumber(balance);
    const { iscnFee, gas: iscnGasEstimation } = estimation;
    const iscnGasNanolike = iscnGasEstimation.fee.amount[0].amount;
    const iscnFeeNanolike = iscnFee.amount;
    setIscnFee(new BigNumber(iscnFeeNanolike).plus(iscnGasNanolike).shiftedBy(-9));
    return { ISCNFee: new BigNumber(iscnFeeNanolike).plus(iscnGasNanolike).shiftedBy(-9), Balance: new BigNumber(balance) };
  };
  const sendArweaveFeeTx = async(ArFee)=> {
    // await this.initIfNecessary();
    if (!props.signer) throw new Error('SIGNER_NOT_INITED');
    if (!ArFee.ArweaveFeeTargetAddress) throw new Error('TARGET_ADDRESS_NOT_SET');
    const memo = JSON.stringify({ ipfs: ArFee.IpfsHash });
    try {
      const { transactionHash } = await sendLIKE(props.address, ArFee.ArweaveFeeTargetAddress, ArFee.ArweaveFee, props.signer, memo);
      return transactionHash;
    } catch (err) {
      // this.signDialogError = (err as Error).toString()
      // TODO: Handle error
      // eslint-disable-next-line no-console
      console.error(err);
    } finally {
    }
    return '';
  };
  const submitToArweave = async (ArFee, fileBlob) => {
    const transactionHash = await sendArweaveFeeTx(ArFee);
    const formData = new FormData();
    if (fileBlob) formData.append('file', fileBlob);
    // Register Numbers Protocol assets along with Arweave
    // if (this.isRegisterNumbersProtocolAsset) {
    //   formData.append('num', '1');
    // }
    // this.isUploadingArweave = true;
    let arweaveId = '';
    try {
      let result = await axios.post(
        `${API_POST_ARWEAVE_UPLOAD}?txHash=${transactionHash}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );
      if (result.data?.arweaveId) {
        arweaveId = result.data.arweaveId;
      } else {
      }
    } catch (err) {
      // TODO: Handle error
      // eslint-disable-next-line no-console
    } finally {
    }
    return arweaveId;
  };

  const dataURItoBlob = (dataURI)=> {
    // convert base64 to raw binary data held in a string
    // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
    let byteString = atob(dataURI.split(',')[1]);

    // separate out the mime component
    let mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

    // write the bytes of the string to an ArrayBuffer
    let ab = new ArrayBuffer(byteString.length);

    // create a view into the buffer
    let ia = new Uint8Array(ab);

    // set the bytes of the buffer to the correct values
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    // write the ArrayBuffer to a blob, and you're done
    let blob = new Blob([ab], { type: mimeString });
    return blob;

  };

  async function onGenerate(e) {
    e.preventDefault();
    let temaddress = 'like13f4glvg80zvfrrs7utft5p68pct4mcq7t5atf6';
    let result = await axios.get(getAddressLikerIdMinApi(temaddress));
    setLikerInfo(result.data);
    setGenLoading(true);
    const node = document.querySelector('#preview .sq-container');
    // const node = document.getElementByID('form-input');
    const exportSize = 2;

    const width = node.offsetWidth * exportSize;
    const height = node.offsetHeight * exportSize;

    const config = {
      style: {
        transform: `scale(${exportSize})`,
        transformOrigin: 'top-left',
        width: 512 + 'px',
        height: 512 + 'px',
      },
      width,
      height,
    };

    htmlToImage.toPng(node)
      .then(async (dataUrl)=> {
        setResultImg(dataUrl);
        let blob = await dataURItoBlob(dataUrl);
        setFileType(blob.type);
        await setFileBlob(blob);
        handleFiles(blob);
        setExifInfo({
          format: blob.type,
          size: blob.size,
        });

        let payload = getPayload(result.data, blob);
        setPayload(payload);
        let ArFee = await estimateArweaveFee(blob);
        let ISCNFee = await calculateISCNFee(payload);
        await onSubmit(ArFee, ISCNFee, payload, blob);
      })
      .catch(function (error) {
        console.error('dom-to-image: oops, something went wrong!', error);
      });
  }

  const onSubmit = async (ArFee, ISCNFee, payload, fileBlob) => {
    if (props.balance === 0) {
      this.error = 'INSUFFICIENT_BALANCE';
      this.isOpenWarningSnackbar = true;
      this.uploadStatus = '';
      return;
    }
    let result = await submitToArweave(ArFee, fileBlob);
    console.log('result!!!!!!!!!!', result);
    if (result) await submitToISCN(payload, ISCNFee);
  };

  const submitToISCN = async(payload)=> {
    // this.isOpenSignDialog = true;
    // this.uploadStatus = 'loading'
    // this.onOpenKeplr()
    // await this.initIfNecessary()
    // await this.calculateISCNFee()
    // if (this.balance.lt(this.iscnFee)) {
    //   this.error = 'INSUFFICIENT_BALANCE'
    //   this.uploadStatus = ''
    //   return
    // }
    // if (!this.signer) {
    //   this.error = 'MISSING_SIGNER'
    //   this.uploadStatus = ''
    //   return
    // }
    try {
      const res = await signISCNTx(formatISCNTxPayload(payload), props.signer, props.address);
      console.log('response=>>>>>>iscn', res);
      // this.uploadStatus = 'success'
      // this.$emit('txBroadcasted', res)
      // this.isOpenSignDialog = false;
    } catch (err) {
      // this.signDialogError = err as string;
      // this.uploadStatus = '';
      // TODO: Handle error
      // eslint-disable-next-line no-console
      console.error(err);
    } finally {
      // this.isOpenQuitAlertDialog = false;
    }
  };

  const handleFiles = (evt)=> {
    let file = evt;
    let reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend =  (e)=> {
      let contents = e.target.result;
      console.log(contents);

      let memoryImg = document.createElement('img');
      memoryImg.src = contents;
      let width = memoryImg.width;
      let height = memoryImg.height;
    };
  };

  const useImageURL = (e) => {
    e.preventDefault();

    const src = imageUrlRef.current.value;
    setSelectedFile({ name: 'Image from URL' });
    setBgImg(src);
    setModalShow(false);
  };

  const unsplashPhotoClick = (e, download_location) => {
    e.preventDefault();

    const src = e.target.src;
    setSelectedFile({ name: 'Unsplash image' });
    setBgImg(src);
    setModalShow(false);
    axios.post('/api/unsplash', {
      downloadLocation: download_location,
    })
      .catch(error => console.log(error));
  };

  const onClickGradient = (a, b) => {
    setSelectedFile(null);
    setBgImg(null);
  };

  const handleGradientChange = (e) => {
    const g = e.target.value;

    setGradient(g);
    setBgGradient(`linear-gradient(to bottom right, ${GRADIENTS[g][0]}, ${GRADIENTS[g][1]})`);
  };

  // console.log(props.tweet);
  if (props.nftStatus === null){
    return <p>{serverErrorMsg}</p>;
  }

  let bgSection;
  let bgStyle = { background: bgColor };
  let textStyle = { color: null };

  if (colorMode == 0 && !boxBackground){
    const l = luminosity(bgColor);
    if (l >= 135){
      textStyle.color = '#000';
    } else {
      textStyle.color = '#fff';
    }
  } else if (bgImg && colorMode == 2) {
    const defString = `url(${bgImg}) ${bgColor}`;
    if (imgFilter == 'default'){
      bgStyle.background = defString;
    } else if (imgFilter == 'dark'){
      bgStyle.background = blackFilter + defString;
      textStyle.color = '#fff';
    } else {
      // light
      bgStyle.background = whiteFilter + defString;
      textStyle.color = '#000';
    }
  } else if (colorMode == 1) {
    bgStyle.background = bgGradient;
  }


  let content;

  if (resultImg){
    content =(<div style={{ maxWidth: '530px', margin: '0 auto' }}>

      <img
        id='tweet-img'
        src={resultImg}
        alt={`Tweet that says: ${props.nftStatus.content}`}
      />

      <small id='backup-link'><a href={resultImg} download={`tweet by ${props.nftStatus.account.display_name}`}>download here</a></small>
    </div>);
  } else {
    content = (<>
      <div id='preview' className={`${imageSize}`}>
        <label className='section'>Preview</label>
        <div className={'sq-container-container'}>
          <div className='sq-container' style={bgStyle}>
            {/* <div className='before' /> */}
            <Tweet
              tweet={props.nftStatus}
              user={props.nftStatus.account}
              quoted={props.quoted}
              boxRounded={boxRounded}
              boxBorder={boxBorder}
              boxBackground={boxBackground}
              boxShadow={boxShadow}
              imageCrop={imageCrop}
              boxText={textStyle}
            />
          </div>
        </div>
      </div>

      <SideBar
        onGenerate={onGenerate}
        onSwitchRounded={() => setBoxRounded(!boxRounded)}
        onSwitchBorder={() => setBoxBorder(!boxBorder)}
        onSwitchBoxBackground={() => setBoxBackground(!boxBackground)}
        onSwitchShadow={() => setBoxShadow(!boxShadow)}
        imageCropDisabled={props.nftStatus.media_attachments}
        onSwitchImageCrop={() => setImageCrop(!imageCrop)}
        onSwitchImageSize={(e) => {
          setImageSize(e.target.value);
        }}
        imageSize={imageSize}
        onPostCardNameChange={(e) => setPostCardName(e.target.value)}
        postCardName={postCardName}
        solid={colorMode != 1}
        boxBackground={boxBackground}
        genLoading={genLoading}
      > 
        <BackgroundPicker
          onChange={handleColorChange}
          color={bgColor}
          onClickAddImage={onClickAddImage}
          onClickTrash={onClickTrash}
          fileName={selectedFile ? selectedFile.name : null}
          colorMode={colorMode}
          setColorMode={setColorMode}
          setBoxBackground={setBoxBackground}
          setBoxShadow={setBoxShadow}
          onClickGradient={onClickGradient}
          handleGradientChange={handleGradientChange}
          gradient={gradient}
          imgFilter={imgFilter}
          setImgFilter={setImgFilter}
        />

        <PhotoUpload
          show={modalShow}
          onHide={() => setModalShow(false)}
          onFileChange={onFileChange}
          useImageURL={useImageURL}
          imgRef={imageUrlRef}
          unsplashPhotoClick={unsplashPhotoClick}
        />

      </SideBar>
    </>);
  }

  return (<Drawer
    className='poet-so-drawer'
    autoFocus='true'
    isOpen={props.isOpen}
    position={Position.BOTTOM}
    size='90%'
    usePortal='true'
  ><div id='result'>{content}</div></Drawer>);
}



export default PostSo;
