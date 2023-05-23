import React, { Component } from 'react';

// A class component that renders the tweet image preview
class TweetImagePreview extends Component {

  // A constructor to initialize the props and bind the methods
  constructor(props) {
    super(props);
    this.formatDate = this.formatDate.bind(this);
    this.formatNumber = this.formatNumber.bind(this);
  }

  // A method to format the date string
  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });
  }

  // A method to format the number with commas
  formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  // A render method to return the JSX elements
  render() {
    return (
      <div className='tweet-image-preview'>
        <div
          className='tweet-image'
          style={{
            backgroundColor: this.props.bgColor,
            width: this.props.imageSize.width,
            height: this.props.imageSize.height,
            borderRadius: '10px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '20px',
          }}
        >
          <div className='tweet-header'>
            <img
              src={this.props.tweet.includes.users[0].profile_image_url.replace(
                '_normal',
                '',
              )}
              alt='avatar'
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                marginRight: '10px',
              }}
            />
            <div className='tweet-user'>
              <p
                style={{
                  fontSize: this.props.textSize + 4 + 'px',
                  fontWeight: 'bold',
                  margin: '0',
                }}
              >
                {this.props.tweet.includes.users[0].name}
              </p>
              <p
                style={{
                  fontSize: this.props.textSize + 'px',
                  color: '#888888',
                  margin: '0',
                }}
              >
                @{this.props.tweet.includes.users[0].username}
              </p>
            </div>
          </div>
          <div className='tweet-text'>
            <p
              style={{
                fontSize: this.props.textSize + 2 + 'px',
                margin: '0',
                wordBreak: 'break-word',
              }}
            >
              {this.props.tweet.data.text}
            </p>
            <img src="https://dplsgtvuyo356.cloudfront.net/media_attachments/files/110/417/337/230/877/829/original/b949d9da55604f05.png"/>
          </div>
          <div className='tweet-footer'>
            <p
              style={{
                fontSize: this.props.textSize - 2 + 'px',
                color: '#888888',
                margin: '0',
              }}
            >
              {this.formatDate(this.props.tweet.data.created_at)}
            </p>
            <div className='tweet-metrics'>
              <span
                style={{
                  fontSize: this.props.textSize - 2 + 'px',
                  color: '#888888',
                  marginRight: '10px',
                }}
              >
                {this.formatNumber(this.props.tweet.data.public_metrics.reply_count)}{' '}
                Replies
              </span>
              <span
                style={{
                  fontSize: this.props.textSize - 2 + 'px',
                  color: '#888888',
                  marginRight: '10px',
                }}
              >
                {this.formatNumber(
                  this.props.tweet.data.public_metrics.retweet_count,
                )}{' '}
                Retweets
              </span>
              <span
                style={{
                  fontSize: this.props.textSize - 2 + 'px',
                  color: '#888888',
                  marginRight: '10px',
                }}
              >
                {this.formatNumber(
                  this.props.tweet.data.public_metrics.like_count,
                )}{' '}
                Likes
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

}

export default TweetImagePreview;
