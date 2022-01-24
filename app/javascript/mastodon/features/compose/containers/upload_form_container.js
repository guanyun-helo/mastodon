import { connect } from 'react-redux';
import UploadForm from '../components/upload_form';

const mapStateToProps = state => ({
  mediaIds: state.getIn(['compose', 'media_attachments']).map(item => item.get('id')),
  iscn_fee: state.getIn(['compose', 'iscn_fee'])
});

export default connect(mapStateToProps)(UploadForm);
