import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { changeComposeISCN, changeComposeISCNFEE} from 'mastodon/actions/compose';
import { injectIntl, defineMessages, FormattedMessage } from 'react-intl';
import { toast } from 'material-react-toastify';
import { act } from 'react-test-renderer';

const messages = defineMessages({
    marked: {
        id: 'compose_form.iscn.marked',
        defaultMessage: '{count, plural, one {Media is marked as iscn} other {Media is marked as iscn}}',
    },
    unmarked: {
        id: 'compose_form.iscn.unmarked',
        defaultMessage: '{count, plural, one {Media is not marked as iscn} other {Media is not marked as iscn}}',
    },
    iscn: {
        id: 'like.iscn',
        defaultMessage: 'Only one file is allowed to be uploaded, please delete the other'
    }
});

const mapStateToProps = state => ({
    active: state.getIn(['compose', 'iscn']),
    disabled: state.getIn(['compose', 'spoiler']),
    mediaCount: state.getIn(['compose', 'media_attachments']).size,
});

const mapDispatchToProps = dispatch => ({

    onClick(active, mediaCount, intl) {
        if (active === false && mediaCount > 1) {
            toast.warning(intl.formatMessage(messages.iscn), {
                position: "top-center",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            })
            return
        }
        dispatch(changeComposeISCN());
    },

});

class ISCNButton extends React.PureComponent {

    static propTypes = {
        active: PropTypes.bool,
        disabled: PropTypes.bool,
        mediaCount: PropTypes.number,
        onClick: PropTypes.func.isRequired,
        intl: PropTypes.object.isRequired,
        iscn_fee: PropTypes.object
    };

    render() {
        const { active, disabled, mediaCount, onClick, intl, iscn_fee} = this.props;


        return (
            <div className='compose-form__iscn-button'>
                <label className={classNames('icon-button', { active })} title={intl.formatMessage(active ? messages.marked : messages.unmarked, { count: mediaCount })}>
                    <input
                        name='mark-iscn'
                        type='checkbox'
                        checked={active}
                        onChange={() => {
                            onClick(active, mediaCount, intl)
                        }}
                        disabled={disabled}
                    />

                    <span className={classNames('checkbox', { active })} />

                    <FormattedMessage
                        id='compose_form.iscn.hide'
                        defaultMessage='{count, plural, one {Upload to ISCN} other {Upload to ISCN}}'
                        values={{ count: mediaCount }}
                    />

                    <div className={`ISCN-zone ${iscn_fee !== null ? '' : 'ISCN-zone-disable'}`}>
                        <div className="fee item"> <div className="title">fee:&nbsp; </div> <div className="value"> {iscn_fee ? Number(iscn_fee.LIKE) +  5: 0 } LIKE</div></div>
                        <div className="hash item"><div className="title">hash:&nbsp; </div> <div className="value"> {iscn_fee ? iscn_fee.ipfsHash : '...' }</div></div>
                    </div>
                </label>
            </div>
        );
    }

}

export default connect(mapStateToProps, mapDispatchToProps)(injectIntl(ISCNButton));
