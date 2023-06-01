import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { parse, stringify } from 'qs';
import { scroller } from 'react-scroll';
import * as htmlToImage from 'html-to-image';
import hash from 'ipfs-only-hash';
import BigNumber from 'bignumber.js';
import FileSaver from 'file-saver';
import { v4 as uuidv4 } from 'uuid';
import { Drawer, Position } from '@blueprintjs/core';
import Icon from 'mastodon/components/icon';
import {
  formatMsgMintNFT,
  formatMsgSend,
} from '@likecoin/iscn-js/dist/messages/likenft';
import { parseAndCalculateStakeholderRewards } from '@likecoin/iscn-js/dist/iscn/parsing';

import { signISCNTx } from './utils/cosmos/iscn';
import { DEFAULT_TRANSFER_FEE, sendLIKE } from './utils/cosmos/sign';
import { getSigningClient } from './utils/cosmos/iscn/sign';
import {
  esimateISCNTxGasAndFee,
  formatISCNTxPayload,
} from './utils/cosmos/iscn/sign';
import { getAccountBalance } from './utils/cosmos';
import { updateMintInstance, newMintInstance } from './utils/cosmos/index';
import { toast } from 'material-react-toastify';
import {
  getLikerIdMinApi,
  getAddressLikerIdMinApi,
  API_POST_ARWEAVE_ESTIMATE,
  API_POST_ARWEAVE_UPLOAD,
  API_POST_NUMBERS_PROTOCOL_ASSETS,
  getNftUriViaNftId,
  getNftClassUriViaIscnId,
  API_LIKER_NFT_MINT,
  getNftClassImage,
} from './constant/api';
import { getISCNById } from '../../utils/api/like';
import {
  LIKER_LAND_URL,
  LIKER_NFT_API_WALLET,
  LIKER_NFT_FEE_WALLET,
} from './constant/index';

import Tweet from './components/tweet';
import BackgroundPicker from './components/backgroundPicker';
import SideBar from './components/sideBar';
import PhotoUpload from './components/photoUpload';
import { GRADIENTS } from './components/gradientColor';
import { get } from 'lodash';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import { ListGroup, InputGroup } from 'react-bootstrap';

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

  return Math.round(r * 0.299 + g * 0.587 + b * 0.114);
}

function PostSo(props) {
  const [colorMode, setColorMode] = useState(0);
  // 0 = solid, 1 = gradient, 2 = image

  const [bgGradient, setBgGradient] = useState(
    'linear-gradient(to bottom right, #00FF8F, #60EFFF)',
  );
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
  const [ISCNId, setISCNId] = useState(null);
  const [nftClassId, setNftClassId] = useState(null);
  const [mintNFTResult, setMintNftRestult] = useState(false);
  const [listNFTResult, setListNftRestult] = useState(false);

  const imageUrlRef = useRef();

  const handleColorChange = (color, event) => setBgColor(color.hex);

  const onFileChange = () => {
    const file = event.target.files[0];
    setSelectedFile(file);

    let reader = new FileReader();
    reader.onload = function (event) {
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

  useEffect(() => {}, [resultImg, ISCNId, uploadArweaveId, nftClassId]);

  const estimateArweaveFee = async (fileBlob) => {
    const formData = new FormData();
    if (fileBlob) formData.append('file', fileBlob);
    let result = {};
    try {
      result = await axios.post(API_POST_ARWEAVE_ESTIMATE, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setUploadArweaveId(result.data.arweaveId);
      if (result.data.LIKE) setArweaveFee(new BigNumber(result.data.LIKE));
      setArweaveFeeTargetAddress(result.data.address);
      result = {
        UploadArweaveId: result.data.arweaveId,
        ArweaveFee: result.data.LIKE,
        ArweaveFeeTargetAddress: result.data.address,
        IpfsHash: result.data.ipfsHash,
      };
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

  function getPayload(likerInfo, file) {
    let tagString = '';
    props.nftStatus.tags.forEach((item) => {
      tagString = item.name + ',' + tagString;
    });
    const doc = new DOMParser().parseFromString(
      props.nftStatus.content,
      'text/html',
    );
    let tweetText = doc.documentElement.textContent;
    return {
      type: 'Image',
      name: postCardName === null ? tweetText.slice(0, 10) : postCardName,
      description: tweetText,
      tagsString: tagString,
      url: props.nftStatus.url,
      exifInfo: exifInfo,
      license: 'CC BY-NC-ND 2.0',
      contentFingerprints: [],
      // ipfsHash: getFileIPFSHash(file),
      arweaveId: uploadArweaveId,
      // numbersProtocolAssetId: '',
      // fileSHA256: '',
      authorNames: likerInfo ? [likerInfo.displayName] : undefined,
      authorUrls: [],
      authorWallets: likerInfo ? [likerInfo.likeWallet] : undefined,
      likerIds: likerInfo ? [likerInfo.user] : [],
      likerIdsAddresses: [],
      authorDescriptions: likerInfo ? likerInfo.description : '',
    };
  }

  const calculateISCNFee = async (payload) => {
    const [balance, estimation] = await Promise.all([
      getAccountBalance(props.address),
      esimateISCNTxGasAndFee(formatISCNTxPayload(payload)),
    ]);
    setBalance(new BigNumber(balance));
    // this.balance = new BigNumber(balance);
    const { iscnFee, gas: iscnGasEstimation } = estimation;
    const iscnGasNanolike = iscnGasEstimation.fee.amount[0].amount;
    const iscnFeeNanolike = iscnFee.amount;
    setIscnFee(
      new BigNumber(iscnFeeNanolike).plus(iscnGasNanolike).shiftedBy(-9),
    );
    return {
      ISCNFee: new BigNumber(iscnFeeNanolike)
        .plus(iscnGasNanolike)
        .shiftedBy(-9),
      Balance: new BigNumber(balance),
    };
  };
  const sendArweaveFeeTx = async (ArFee) => {
    // await this.initIfNecessary();
    if (!props.signer) throw new Error('SIGNER_NOT_INITED');
    if (!ArFee.ArweaveFeeTargetAddress)
      throw new Error('TARGET_ADDRESS_NOT_SET');
    const memo = JSON.stringify({ ipfs: ArFee.IpfsHash });
    try {
      const { transactionHash } = await sendLIKE(
        props.address,
        ArFee.ArweaveFeeTargetAddress,
        ArFee.ArweaveFee,
        props.signer,
        memo,
      );
      return transactionHash;
    } catch (err) {
      toast.info(err.message);
      resetNFTdata();
      onCLoseNftDrawer();
      // this.signDialogError = (err as Error).toString()
      // TODO: Handle error
      // eslint-disable-next-line no-console
      console.log(err);
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
      toast.info('上傳至 AR 失敗，區塊鏈網路是異步網路，我們正在努力哦，請稍後再試！');
      resetNFTdata();
      onCLoseNftDrawer();
      // TODO: Handle error
      // eslint-disable-next-line no-console
    } finally {
    }
    // setUploadArweaveId(arweaveId);
    return arweaveId;
  };

  const dataURItoBlob = (dataURI) => {
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
    const exportSize = 4;

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

    htmlToImage
      .toPng(node, {
        quality: 1,
        pixelRatio: exportSize,
      })
      .then(async (dataUrl) => {
        setResultImg(dataUrl);
        let blob = await dataURItoBlob(dataUrl);
        setFileType(blob.type);
        await setFileBlob(blob);
        handleFiles(blob);
        setExifInfo({
          format: blob.type,
          size: blob.size,
        });

        let ArFee = await estimateArweaveFee(blob);
        // let newMint = await newMintInstance({
        //   address: props.address,
        //   signer: props.signer,
        // });
        let payload = getPayload(result.data, blob);
        setPayload(payload);
        let ISCNFee = await calculateISCNFee(payload);
        await onSubmit(ArFee, ISCNFee, payload, blob);
      })
      .catch( (error)=> {
        toast.info('估算價格失敗，區塊鏈網路是異步網路，我們正在努力哦，請稍後再試！');
        resetNFTdata();
        onCLoseNftDrawer();
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

    payload.arweaveId = result;
    if (result) {
      let { iscnId } = await submitToISCN(payload, ISCNFee);
      setISCNId(iscnId);
      let ISCNData = await getISCNById(iscnId);
      createNftClass(iscnId, ISCNData);
    }
  };

  const createNftClassPayload = async (iscnId, ISCNData) => {
    let record = ISCNData.records[0].data;
    let metadata = {
      image: record.contentFingerprints[0],
      external_url: record.contentMetadata?.url,
      message: '',
    };
    // if (this.isWritingNFT) {
    metadata = {
      ...metadata,
      nft_meta_collection_id: 'likerland_writing_nft',
      nft_meta_collection_name: 'Writing NFT',
      nft_meta_collection_descrption: 'Writing NFT by Liker Land',
    };
    // Object.assign(metadata, {
    //   nft_meta_collection_id: 'likerland_writing_nft',
    //   nft_meta_collection_name: 'Writing NFT',
    //   nft_meta_collection_descrption: 'Writing NFT by Liker Land',
    // });
    // }
    let payload = {
      name: record.contentMetadata.name,
      description: record.contentMetadata.description,
      metadata,
    };
    // if (this.isCustomOgimage) payload.metadata.is_custom_image = 'true';
    // payload = Object.assign(payload, {
    //   symbol: 'WRITING',
    //   uri: getNftClassUriViaIscnId(iscnId),
    // });
    payload = {
      ...payload,
      symbol: 'WRITING',
      uri: getNftClassUriViaIscnId(iscnId),
    };
    return payload;
  };

  const createNftClass = async (iscnId, ISCNData) => {
    let record = ISCNData.records[0].data;
    let classId;
    // if (this.isSubscriptionMint) {
    // let result = await updateMintInstance({
    //   status: 'nftClass',
    //   payload: {
    //     iscnId: iscnId,
    //     name: record.contentMetadata.name,
    //     description: record.contentMetadata.description,
    //     image: record.contentFingerprints[0],
    //     externalURL: record.contentMetadata.url,
    //     message: '',
    //     isCustomImage: true,
    //   },
    //   address: props.address,
    // });

    // } else {
    try {
      // await this.initIfNecessary()
      if (!props.signer) return;
      const signingClient = await getSigningClient();
      await signingClient.setSigner(props.signer);
      let NFT_CLASS_PAYLOAD = await createNftClassPayload(iscnId, ISCNData);
      const res = await signingClient.createNFTClass(
        props.address,
        iscnId,
        NFT_CLASS_PAYLOAD,
      );
      const rawLogs = JSON.parse(res.rawLog);
      const event = rawLogs[0].events.find(
        (e) => e.type === 'likechain.likenft.v1.EventNewClass',
      );
      const attribute = event.attributes.find((a) => a.key === 'class_id');
      classId = (attribute?.value || '').replace(/^"(.*)"$/, '$1');
      setNftClassId(classId);
      await createRoyaltyConfig(classId, ISCNData);
      await mintISCNToNft(classId, ISCNData, iscnId);
    } catch (error) {
      toast.info('生成 CLASSID 失敗，區塊鏈網路是異步網路，我們正在努力哦，請稍後再試！');
      console.error(error);
      if (error.message?.includes('code 11')) {
        throw new Error('CREATE_NFT_CLASS_TX_RUNS_OUT_OF_GAS');
      }
    }
    // logTrackerEvent(this, 'IscnMintNFT', 'CreateNftClassSuccess', classId, 1);
    return classId;
  };

  const createRoyaltyConfig = async (classId, ISCNData) => {
    let record = ISCNData.records[0].data;
    try {
      if (!props.signer) return;
      const rateBasisPoints = 1000; // 10% as in current chain config
      const feeAmount = 25000; // 2.5%
      const userAmount = 1000000 - feeAmount; // 1000000 - fee
      const rewardMap = await parseAndCalculateStakeholderRewards(
        record.stakeholders,
        ISCNData.owner,
        {
          precision: 0,
          totalAmount: userAmount,
        },
      );
      const rewards = Array.from(rewardMap.entries());
      const stakeholders = rewards.map((r) => {
        const [address, { amount }] = r;
        return {
          account: address,
          weight: parseInt(amount, 10),
        };
      });
      stakeholders.push({
        account: 'like1pp52z2a6wkuughsrxzy2cl2wldhcnyzvjcj7lv',
        weight: feeAmount,
      });

      const signingClient = await getSigningClient();
      await signingClient.setSigner(props.signer);
      // this.txStatus = TxStatus.PROCESSING;
      await signingClient.createRoyaltyConfig(props.address, classId, {
        rateBasisPoints,
        stakeholders,
      });
    } catch (err) {
      // Don't throw on royalty create, not critical for now
      // eslint-disable-next-line no-console
      console.error(err);
    }
  };
  //aka mintNFT
  const mintISCNToNft = async (classId, ISCNData, iscnId) => {
    let record = ISCNData.records[0].data;
    let premintAmount = 500;
    let nftsIds = [];
    try {
      if (!props.signer) return;
      const signingClient = await getSigningClient();
      await signingClient.setSigner(props.signer);

      //

      nftsIds = [...Array(premintAmount).keys()].map(
        (_) => `writing-${uuidv4()}`,
      );

      const getMintNftPayload = (classId, id, record) => {
        return {
          id,
          uri: getNftUriViaNftId(classId, id),
          metadata: {
            name: record.contentMetadata.name,
            image: getNftClassImage(classId),
            message: '',
          },
        };
      };
      const nfts = nftsIds.map((id) => getMintNftPayload(classId, id, record));
      const mintMessages = nfts.map((i) =>
        formatMsgMintNFT(props.address, classId, i),
      );
      const nftsToSend = nfts.filter((_, index) => index >= 100);
      const sendMessages = nftsToSend.map((i) =>
        formatMsgSend(props.address, LIKER_NFT_API_WALLET, classId, i.id),
      );

      // const nftsToSend = nfts.filter((_, index) => index >= this.reserveNft);
      // const sendMessages = nftsToSend.map((i) =>
      //   formatMsgSend(this.address, 'like1pp52z2a6wkuughsrxzy2cl2wldhcnyzvjcj7lv', this.classId, i.id)
      // );
      //

      // if (!this.nftsIds.length) this.nftsIds = [...Array(this.premintAmount).keys()]
      // .map((_) => `${this.isWritingNFT ? 'NFT-PostCard-' : ''}${uuidv4()}`);
      // const nfts = this.nftsIds.map(id => this.getMintNftPayload(id))
      // let id = `writing-${uuidv4()}`;
      // const mintMessages = [
      //   props.address,
      //   classId,
      //   {
      //     id,
      //     uri: getNftUriViaNftId(classId, id),
      //     metadata: {
      //       name: record.contentMetadata.name,
      //       image: record.contentFingerprints[0],
      //       message: '',
      //     },
      //   },
      // ];
      // // const nftsToSend = nfts.filter((_, index) => index >= this.reserveNft);
      // const sendMessages = [
      //   formatMsgSend(
      //     props.address,
      //     'like1pp52z2a6wkuughsrxzy2cl2wldhcnyzvjcj7lv',
      //     classId,
      //     id
      //   ),
      // ];
      // logTrackerEvent(this, 'IscnMintNFT', 'MintNFT', this.classId, 1);

      // const shouldMintNFT = !this.mintNFTResult;
      // const shouldSendNFT = this.isWritingNFT && !this.sendNFTResult;

      // if (shouldMintNFT) {
      let mintNFTResult = await signingClient.sendMessages(
        props.address,
        mintMessages,
      );
      if(mintNFTResult !== undefined){
        toast.success('NFT mint 成功，下一步要上架到 Liker.Land，請稍後！');
      }
      setMintNftRestult(true);
      let sendNFTResult = await signingClient.sendMessages(
        props.address,
        sendMessages,
      );

      if(sendNFTResult !== undefined){
        toast.success('NFT 上架成功！');
      }
      await postMintInfo(ISCNData, iscnId, classId);
      setListNftRestult(true);

      await getMintInfo(ISCNData, iscnId, classId);
      // }
      // if (shouldSendNFT) {
      //   this.sendNFTResult = await signingClient.sendMessages(
      //     this.address,
      //     sendMessages,
      //   );
      // }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      if (error.message?.includes('code 11')) {
        throw new Error('MINT_NFT_TX_RUNS_OUT_OF_GAS');
      }
      throw new Error(`CANNOT_MINT_NFT, Error: ${error.message}`);
    }
  };

  const resetNFTdata = ()=>{
    setGenLoading(false);
    setResultImg(null);
    setUploadArweaveId('');
    setBalance(0);
    setArweaveFee('');
    setIscnFee('');
    setArweaveFeeTargetAddress('');
    setAddress('');
    setPayload({});
    setFileBlob(new Blob());
    setFileType('');
    setExifInfo('');
    setLikerInfo({});
    setISCNId(null);
    setNftClassId(null);
    setMintNftRestult(false);
    setListNftRestult(false);
  };

  const onCLoseNftDrawer = ()=>{
    resetNFTdata();
    props.closeNftDrawer();
  };

  const postMintInfo = async (iscnData, iscnId, classId) => {
    const axiosInstance = axios.create({
      paramsSerializer: {
        encode: parse,
        serialize: stringify,
      },
    });
    try {
      let record = iscnData.records[0].data;
      let result = await axiosInstance.post(
        API_LIKER_NFT_MINT,
        { contentUrl: record.contentMetadata?.url },
        {
          params: {
            iscn_id: iscnId,
            class_id: classId,
            platform: 'LikerSocial',
          },
        },
      );
    } catch (error) {
      // If the API returns a status of 409, it indicates that the request may have already successful
      // and a duplicate request was made.
      if (error?.response?.status === 409) {
        return;
      }
      // eslint-disable-next-line no-console
      console.error(error);
      throw new Error('CANNOT_POST_MINT_INFO');
    }
  };

  const getMintInfo = async(iscnData, iscnId, classId)=> {
    const axiosInstance = axios.create({
      paramsSerializer: {
        encode: parse,
        serialize: stringify,
      },
    });
    try {
      let result = await axiosInstance.get(API_LIKER_NFT_MINT, {
        params: {
          iscn_id: iscnId,
        },
      });
      if(result.data?.classId){
        props.changeNftResult(result.data);
        props.onMintResultNFTChange(true);
        resetNFTdata();
        props.closeNftDrawer();
      }
    } catch (err) {
      if (!axios.isAxiosError(err) || (err).response?.status !== 404) {
        // eslint-disable-next-line no-console
        console.error(err);
      }
    }
  };

  const submitToISCN = async (payload) => {
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
    let res;
    try {
      res = await signISCNTx(
        formatISCNTxPayload(payload),
        props.signer,
        props.address,
      );
      // this.uploadStatus = 'success'
      // this.$emit('txBroadcasted', res)
      // this.isOpenSignDialog = false;
    } catch (err) {
      // this.signDialogError = err as string;
      // this.uploadStatus = '';
      // TODO: Handle error
      // eslint-disable-next-line no-console
      toast.info('生成 ISCN 失敗，區塊鏈網路是異步網路，我們正在努力哦，請稍後再試！');
      resetNFTdata();
      onCLoseNftDrawer();
      console.error(err);
    } finally {
      // this.isOpenQuitAlertDialog = false;
    }
    return res;
  };

  const handleFiles = (evt) => {
    let file = evt;
    let reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = (e) => {
      let contents = e.target.result;

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
    axios
      .post('/api/unsplash', {
        downloadLocation: download_location,
      })
      .catch((error) => console.log(error));
  };

  const onClickGradient = (a, b) => {
    setSelectedFile(null);
    setBgImg(null);
  };

  const handleGradientChange = (e) => {
    const g = e.target.value;

    setGradient(g);
    setBgGradient(
      `linear-gradient(to bottom right, ${GRADIENTS[g][0]}, ${GRADIENTS[g][1]})`,
    );
  };

  if (props.nftStatus === null) {
    return <p>{serverErrorMsg}</p>;
  }

  let bgSection;
  let bgStyle = { background: bgColor };
  let textStyle = { color: null };

  if (colorMode == 0 && !boxBackground) {
    const l = luminosity(bgColor);
    if (l >= 135) {
      textStyle.color = '#000';
    } else {
      textStyle.color = '#fff';
    }
  } else if (bgImg && colorMode == 2) {
    const defString = `url(${bgImg}) ${bgColor}`;
    if (imgFilter == 'default') {
      bgStyle.background = defString;
    } else if (imgFilter == 'dark') {
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
  let tick =  <Icon id={'check'} style={{ color: 'green' }} />;
  let refresh =  <Icon id={'refresh'} style={{ color: 'blue' }} />;
  // if (resultImg) {
  content = (
    <div style={{ maxWidth: '100%', margin: '0 auto', minWidth: '60%', backgroundColor: '#fff', padding: '30px' }}>
      <div
        className='preview-area'
        style={{ display: resultImg ? 'flex' : 'none', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'  }}
      >
        <img
          id='tweet-img'
          style={{ maxWidth: '800px' }}
          src={resultImg}
          alt={`Tweet that says: ${props.nftStatus.content}`}
        />

        <small id='backup-link'>
          <a
            href={resultImg}
            download={`tweet by ${props.nftStatus.account.display_name}`}
          >
            download here
          </a>
        </small>
        <div>
          <label className='section'>NFT 鑄造需要簽署 6～7 次，花費約 10 LIKE，🙏請在彈窗後簽署</label>
          <ListGroup>
            <ListGroup.Item><label className='section'>RawNft</label>: {resultImg !== null ? tick: refresh}</ListGroup.Item>
            <ListGroup.Item><label className='section'>arweaveId</label>: {uploadArweaveId !== null ? tick: refresh}</ListGroup.Item>
            <ListGroup.Item><label className='section'>ISCNId</label>: {ISCNId !== null ? tick: refresh}</ListGroup.Item>
            <ListGroup.Item><label className='section'>nft classId</label>: {nftClassId !== null ? tick: refresh}</ListGroup.Item>
            <ListGroup.Item><label className='section'>Mint NFT</label>: {mintNFTResult !== false ? tick: refresh}</ListGroup.Item>
            <ListGroup.Item><label className='section'>List NFT</label>: {listNFTResult !== false ? tick: refresh}</ListGroup.Item>
          </ListGroup>
        </div>
      </div>
      <div
        className='editor-area'
        style={{ display: resultImg ? 'none' : 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}
      >
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
      </div>
    </div>
  );
  // } else {
  //   content = (
  //     <>
  //     </>
  //   );
  // }

  return (
    <Drawer
      className='poet-so-drawer'
      autoFocus='true'
      isOpen={props.isOpen}
      position={Position.BOTTOM}
      size='95%'
      icon='edit'
      usePortal='true'
      onClose={onCLoseNftDrawer}
      title='NFT Editor'
    >
      <div id='result'>{content}</div>
    </Drawer>
  );
}

export default PostSo;
