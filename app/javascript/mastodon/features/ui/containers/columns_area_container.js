import { connect } from 'react-redux';
import ColumnsArea from '../components/columns_area';
import { getLikeAuth } from '../../../actions/accounts'
import { getLikerId } from '../../../actions/accounts'

const mapStateToProps = state => ({
  columns: state.getIn(['settings', 'columns']),
  isModalOpen: !!state.get('modal').modalType
});

const mapDispatchToProps = dispatch => ({
  getLikeAuth: (location,callback)=>dispatch(getLikeAuth(location,callback)),
  getLikerId: (location,callback)=>dispatch(getLikerId(location,callback)),
});

export default connect(mapStateToProps,mapDispatchToProps, null, { forwardRef: true })(ColumnsArea);
