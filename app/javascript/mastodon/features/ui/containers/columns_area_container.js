import { connect } from 'react-redux';
import ColumnsArea from '../components/columns_area';
import { getLikeAuth,getTimeLine} from '../../../actions/accounts'
import { getLikerId } from '../../../actions/accounts'

const mapStateToProps = state => ({
  columns: state.getIn(['settings', 'columns']),
  isModalOpen: !!state.get('modal').modalType
});

const mapDispatchToProps = dispatch => ({
  getLikeAuth: (location,callback)=>dispatch(getLikeAuth(location,callback)),
  getLikerId: (location,callback)=>dispatch(getLikerId(location,callback)),
  getTimeLine: (code,location,callback) => dispatch(getTimeLine(code,location,callback))
});

export default connect(mapStateToProps,mapDispatchToProps, null, { forwardRef: true })(ColumnsArea);
