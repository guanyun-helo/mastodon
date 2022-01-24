import React from 'react';
import IconButton from '../../../components/icon_button';
import PropTypes from 'prop-types';
import { defineMessages, injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import ImmutablePureComponent from 'react-immutable-pure-component';
import ImmutablePropTypes from 'react-immutable-proptypes';
import api from '../../../api'

const messages = defineMessages({
  upload: { id: 'upload_button.label', defaultMessage: 'Add images, a video or an audio file' },
});

const makeMapStateToProps = () => {
  const mapStateToProps = state => ({
    acceptContentTypes: state.getIn(['media_attachments', 'accept_content_types']),
  });

  return mapStateToProps;
};

const iconStyle = {
  height: null,
  lineHeight: '27px',
};

export default @connect(makeMapStateToProps)
@injectIntl
class UploadButton extends ImmutablePureComponent {

  static propTypes = {
    disabled: PropTypes.bool,
    unavailable: PropTypes.bool,
    onSelectFile: PropTypes.func.isRequired,
    updateISCNFee: PropTypes.func,
    style: PropTypes.object,
    resetFileKey: PropTypes.number,
    iscn: PropTypes.bool,
    iscn_fee: PropTypes.object,
    media: PropTypes.object,
    acceptContentTypes: ImmutablePropTypes.listOf(PropTypes.string).isRequired,
    intl: PropTypes.object.isRequired,

  };

  state = {
    disabledUpload: false
  }

  // componentWillReceiveProps(nextProps) {
  //   if (nextProps.iscn === false) {
  //     this.setState({
  //       disabledUpload: nextProps.iscn
  //     }, () => {
  //       this.forceUpdate()
  //     })
  //   }
  // }


  handleChange = (e) => {
    if (e.target.files.length > 0) {
      // with iscn
      this.props.onSelectFile(e.target.files);

      // not with iscn
      if (this.props.media.size >= 0) {
        const formData = new FormData();
        if (e.target.files[0]) formData.append('file', e.target.files[0]);

        api().post('https://api.like.co/arweave/estimate', formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }).then((res)=>{
            console.log('res',res)
            this.props.updateISCNFee(res.data)
          })
      }
      // https://api.like.co/arweave/estimate

    }
  }

  handleClick = () => {
    this.fileElement.click();
  }

  setRef = (c) => {
    this.fileElement = c;
  }

  render() {
    const { intl, resetFileKey, unavailable, disabled, acceptContentTypes, iscn } = this.props;

    if (unavailable) {
      return null;
    }

    const message = intl.formatMessage(messages.upload);

    return (
      <div className={`compose-form__upload-button`}>
        <IconButton icon='paperclip' title={message} disabled={disabled} onClick={this.handleClick} className={'compose-form__upload-button-icon'} size={18} inverted style={iconStyle} />
        <label>
          <span style={{ display: 'none' }}>{message}</span>
          <input
            key={resetFileKey}
            ref={this.setRef}
            type='file'
            multiple
            accept={acceptContentTypes.toArray().join(',')}
            onChange={this.handleChange}
            disabled={disabled}
            style={{ display: 'none' }}
          />
        </label>
      </div>
    );
  }

}
