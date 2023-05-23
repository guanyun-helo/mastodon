import React, { Component } from 'react';
import axios from 'axios';
import TweetImagePreview from './component/preview';
import { Dialog, DialogBody, DialogFooter , Button } from '@blueprintjs/core';
// A class component that takes a tweet URL as input and renders the tweet image component
class PoetSoComponent extends Component {

  // A constructor to initialize the state and bind the methods
  constructor(props) {
    super(props);
    this.state = {
      url: '',
      tweet: null,
      loading: false,
      error: null,
      bgColor: this.getRandomColor(),
      cardColor: '#FFFFFF',
      textSize: 16,
      imageSize: { width: 600, height: 300 },
    };
    this.handleChange = this.handleChange.bind(this);
    this.fetchTweet = this.fetchTweet.bind(this);
    this.getTweetId = this.getTweetId.bind(this);
    this.formatDate = this.formatDate.bind(this);
    this.formatNumber = this.formatNumber.bind(this);
    this.getRandomColor = this.getRandomColor.bind(this);
    this.handleBgColorChange = this.handleBgColorChange.bind(this);
    this.handleCardColorChange = this.handleCardColorChange.bind(this);
    this.handleTextSizeChange = this.handleTextSizeChange.bind(this);
    this.handleImageWidthChange = this.handleImageWidthChange.bind(this);
    this.handleImageHeightChange = this.handleImageHeightChange.bind(this);
    this.handleDownload = this.handleDownload.bind(this);
  }

  // A method to handle the input change and set the url state
  handleChange(e) {
    this.setState({ url: e.target.value });
  }

  // A method to fetch the tweet data using axios
  fetchTweet(url) {
    this.setState({
      tweet: {
        'data': {
          'id': '1468677317888348160',
          'text': 'I’m an alien',
          'created_at': '2021-12-08T05:57:29.000Z',
          'public_metrics': {
            'retweet_count': 10701,
            'reply_count': 12575,
            'like_count': 190463,
            'quote_count': 1009,
          },
          'author_id': '44196397',
        },
        'includes': {
          'users': [
            {
              'id': '44196397',
              'name': 'Editor',
              'username': 'Editor',
              'profile_image_url': 'https://dplsgtvuyo356.cloudfront.net/accounts/avatars/106/282/397/367/132/067/original/c742403531f5e530.jpeg',
            },
          ],
        },
      }
      ,
    });
  }

  // A method to parse the tweet URL and get the tweet ID
  getTweetId(url) {
    const regex = /status\/(\d+)/;
    const match = url.match(regex);
    if (match) {
      return match[1];
    } else {
      return null;
    }
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

  // A method to generate a random color
  getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  // A method to handle the background color change and set the bgColor state
  handleBgColorChange(e) {
    this.setState({ bgColor: e.target.value });
  }

  // A method to handle the card color change and set the cardColor state
  handleCardColorChange(e) {
    this.setState({ cardColor: e.target.value });
  }

  // A method to handle the text size change and set the textSize state
  handleTextSizeChange(e) {
    this.setState({ textSize: e.target.value });
  }

  // A method to handle the image width change and set the imageSize state
  handleImageWidthChange(e) {
    this.setState({
      imageSize: { ...this.state.imageSize, width: e.target.value },
    });
  }

  // A method to handle the image height change and set the imageSize state
  handleImageHeightChange(e) {
    this.setState({
      imageSize: { ...this.state.imageSize, height: e.target.value },
    });
  }

  // A method to handle the download button click
  handleDownload() {
    // Create a canvas element and get its context
    const canvas = document.createElement('canvas');
    canvas.width = this.state.imageSize.width;
    canvas.height = this.state.imageSize.height;
    const ctx = canvas.getContext('2d');

    // Draw the image element on the canvas
    ctx.drawImage(this.imageRef, 0, 0);

    // Create a link element and set its href to the canvas data URL
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = 'tweet.png';

    // Append the link to the document and click it
    document.body.appendChild(link);
    link.click();

    // Remove the link from the document
    document.body.removeChild(link);
  }

  // A lifecycle method to fetch the tweet data when the url state changes
  componentDidUpdate(prevProps, prevState) {
    if (this.state.url !== prevState.url) {
      if (this.state.url) {
        this.fetchTweet(this.state.url);
      } else {
        this.setState({ tweet: null });
      }
    }
  }

  // A render method to return the JSX elements
  render() {


    return (
      <Dialog isOpen="true" title='Informational dialog' icon='info-sign'>
        <DialogBody>
          <div className='poet-so-component'>
            <h1>Poet.so Component</h1>
            <p>Enter a tweet URL and see it as an image</p>
            <input
              type='text'
              placeholder='Paste a tweet URL here'
              value={this.state.url}
              onChange={this.handleChange}
            />
            {this.state.loading && <p>Loading...</p>}
            {this.state.error && <p>{this.state.error}</p>}
            {this.state.tweet && (
              <div className='tweet-image'>
                <div className='tweet-image-controls'>
                  <div className='tweet-image-colors'>
                    <label htmlFor='bg-color'>Background Color:</label>
                    <input
                      type='color'
                      id='bg-color'
                      value={this.state.bgColor}
                      onChange={this.handleBgColorChange}
                    />
                    <label htmlFor='card-color'>Card Color:</label>
                    <input
                      type='color'
                      id='card-color'
                      value={this.state.cardColor}
                      onChange={this.handleCardColorChange}
                    />
                  </div>
                  <div className='tweet-image-size'>
                    <label htmlFor='text-size'>Text Size:</label>
                    <input
                      type='range'
                      id='text-size'
                      min={10}
                      max={20}
                      value={this.state.textSize}
                      onChange={this.handleTextSizeChange}
                    />
                    <label htmlFor='image-width'>Image Width:</label>
                    <input
                      type='number'
                      id='image-width'
                      min={300}
                      max={800}
                      value={this.state.imageSize.width}
                      onChange={this.handleImageWidthChange}
                    />
                    <label htmlFor='image-height'>Image Height:</label>
                    <input
                      type='number'
                      id='image-height'
                      min={150}
                      max={400}
                      value={this.state.imageSize.height}
                      onChange={this.handleImageHeightChange}
                    />
                  </div>
                  <button onClick={this.handleDownload}>Download</button>
                </div>
                <div className='tweet-image-preview'>
                  <TweetImagePreview {...this.state} />
                </div>
              </div>
            )}
          </div>
        </DialogBody>
        <DialogFooter actions={<Button intent='primary' text='Close' />}  />
      </Dialog>
    );

  }

}

export default PoetSoComponent;
