import React from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { FormattedMessage } from 'react-intl';
import classnames from 'classnames';
import api from '../../../api'
import lottie from 'lottie-web'
import success from '../../../../images/success.json'

export default class LikePay extends React.PureComponent {

    static propTypes = {
        likerId: PropTypes.string,
        isShow: PropTypes.bool,
        handleLikePay: PropTypes.func,
        statusId: PropTypes.string,
        isSupportSuccess: PropTypes.bool
    };


    state = {
        value: 188,
        memo: '',
        transState: {},
        memo: 'Transaction from Liker Social'

    };

    componentWillReceiveProps(nextProps) {
        if (nextProps.isSupportSuccess) {
            console.log('tr=>>>>>>>>>>>')
            lottie.loadAnimation({
                container: document.querySelector('.support-status-animation'), // the dom element that will contain the animation
                renderer: 'canvas',
                loop: false,
                autoplay: true,
                animationData: success // the path to the animation json
            });
        }
    }

    componentDidMount() {
    }

    componentWillUnmount() {
    }
    onChange = (e) => {
        this.setState({
            value: e.target.value
        })
    }
    pay = () => {
        https://like.co/in/widget/pay?to=quibbler-live&amount=166&via=matterspool&fee=0&state=861fa6c8-8028-4595-8e45-2100d0d5125d&redirect_uri=https%3A%2F%2Fserver.matters.news%2Fpay%2Flikecoin&blocking=true
        window.open(`https://like.co/in/widget/pay?to=${this.props.likerId || 'editorlikersocial'}&amount=${this.state.value}&via=editorlikersocial&fee=0.1&remarks=${this.state.memo}&state=${JSON.stringify({ statusId: this.props.statusId })}&redirect_uri=https://liker.social/web/timelines/home`, "_blank");
    }



    render() {
        const { isShow, likerId, statusId, isSupportSuccess } = this.props
        console.log('isShow', isShow)
        return (
            <div className={isShow ? 'support-container animate__animated animate__fadeInUp animate__faster' : 'support-container-disappear animate__animated animate__fadeInDown animate__faster'}>
                <div className="close" onClick={this.props.handleLikePay}>X</div>
                {isSupportSuccess ? (<div className="support-status">
                    <div className="support-status-animation"></div>
                    <div className="support-status-text">鄉民，你的支持是對作者最大的鼓勵，拍謝 🙌！</div>
                </div>) : (
                    <div>
                        <div className="support-likerid">Support {likerId || 'editorLikerSocial'}</div>
                        <div className="pay-ammount">
                            <input
                                type='number'
                                value={this.state.value}
                                onChange={this.onChange}
                            /> <div> &nbsp;LIKE </div>
                        </div>
                        <div className="support-button" onClick={this.pay}>
                            Confirm Support
                                        </div>
                    </div>
                )
                }
            </div>
        );
    }

}
