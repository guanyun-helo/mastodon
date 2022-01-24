import { connect } from 'react-redux';
import UploadButton from '../components/upload_button';
import { uploadCompose, undoUploadCompose, changeComposeISCNFEE } from '../../../actions/compose';

const mapStateToProps = state => ({
  disabled: state.getIn(['compose', 'is_uploading']) || (state.getIn(['compose', 'media_attachments']).size + state.getIn(['compose', 'pending_media_attachments']) > 3 || state.getIn(['compose', 'media_attachments']).some(m => ['video', 'audio'].includes(m.get('type')))),
  unavailable: state.getIn(['compose', 'poll']) !== null,
  resetFileKey: state.getIn(['compose', 'resetFileKey']),
  iscn: state.getIn(['compose', 'iscn']),
  media: state.getIn(['compose', 'media_attachments']),
  iscn_fee: state.getIn(['compose', 'iscn_fee'])
});

const mapDispatchToProps = dispatch => ({

  onSelectFile(files) {
    dispatch(uploadCompose(files));
  },
  deleteExceptFirst: id => {
    dispatch(undoUploadCompose(id));
  },
  updateISCNFee(fee) {
    console.log('fee',fee)
    dispatch(changeComposeISCNFEE(fee))
  },

});

export default connect(mapStateToProps, mapDispatchToProps)(UploadButton);
