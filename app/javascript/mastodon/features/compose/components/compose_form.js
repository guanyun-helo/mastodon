/* eslint-disable no-debugger */
import React from 'react';
import CharacterCounter from './character_counter';
import Button from '../../../components/button';
import ImmutablePropTypes from 'react-immutable-proptypes';
import PropTypes from 'prop-types';
import ReplyIndicatorContainer from '../containers/reply_indicator_container';
import AutosuggestTextarea from '../../../components/autosuggest_textarea';
import AutosuggestInput from '../../../components/autosuggest_input';
import PollButtonContainer from '../containers/poll_button_container';
import UploadButtonContainer from '../containers/upload_button_container';
import { defineMessages, injectIntl } from 'react-intl';
import SpoilerButtonContainer from '../containers/spoiler_button_container';
import PrivacyDropdownContainer from '../containers/privacy_dropdown_container';
import EmojiPickerDropdown from '../containers/emoji_picker_dropdown_container';
import PollFormContainer from '../containers/poll_form_container';
import UploadFormContainer from '../containers/upload_form_container';
import WarningContainer from '../containers/warning_container';
import LanguageDropdown from '../containers/language_dropdown_container';
import ImmutablePureComponent from 'react-immutable-pure-component';
import axios from 'axios';
import { length } from 'stringz';
import { countableText } from '../util/counter';
import Icon from 'mastodon/components/icon';
import {
  Card,
  Tag,
  Callout,
  Spinner,
  Elevation,
  Checkbox,
} from '@blueprintjs/core';
import Api from '../../../api';
import localforage from 'localforage';

const allowedAroundShortCode =
  '><\u0085\u0020\u00a0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029\u0009\u000a\u000b\u000c\u000d';

const messages = defineMessages({
  placeholder: {
    id: 'compose_form.placeholder',
    defaultMessage: 'What is on your mind?',
  },
  spoiler_placeholder: {
    id: 'compose_form.spoiler_placeholder',
    defaultMessage: 'Write your warning here',
  },
  publish: { id: 'compose_form.publish', defaultMessage: 'Publish' },
  publishLoud: {
    id: 'compose_form.publish_loud',
    defaultMessage: '{publish}!',
  },
  saveChanges: {
    id: 'compose_form.save_changes',
    defaultMessage: 'Save changes',
  },
});

export default
@injectIntl
class ComposeForm extends ImmutablePureComponent {

  static contextTypes = {
    router: PropTypes.object,
  };

  static propTypes = {
    intl: PropTypes.object.isRequired,
    text: PropTypes.string.isRequired,
    suggestions: ImmutablePropTypes.list,
    spoiler: PropTypes.bool,
    privacy: PropTypes.string,
    spoilerText: PropTypes.string,
    focusDate: PropTypes.instanceOf(Date),
    caretPosition: PropTypes.number,
    preselectDate: PropTypes.instanceOf(Date),
    isSubmitting: PropTypes.bool,
    isChangingUpload: PropTypes.bool,
    isEditing: PropTypes.bool,
    isUploading: PropTypes.bool,
    onChange: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    onClearSuggestions: PropTypes.func.isRequired,
    onFetchSuggestions: PropTypes.func.isRequired,
    onSuggestionSelected: PropTypes.func.isRequired,
    onChangeSpoilerText: PropTypes.func.isRequired,
    onPaste: PropTypes.func.isRequired,
    onPickEmoji: PropTypes.func.isRequired,
    autoFocus: PropTypes.bool,
    anyMedia: PropTypes.bool,
    isInReply: PropTypes.bool,
    singleColumn: PropTypes.bool,
    lang: PropTypes.string,
    destroyNft: PropTypes.func,
  };

  static defaultProps = {
    autoFocus: false,
  };

  state = {
    collapsed: true,
    animating: false,
    tags: [],
    isChecked: false,
  };

  onCheckBoxChange = (e) => {
    this.setState(
      {
        isChecked: !this.state.isChecked,
      },
      () => {
        localforage.setItem('isSetNft', this.state.isChecked);
      },
    );
  };

  getTags() {
    // eslint-disable-next-line promise/catch-or-return
    Api()
      .get('https://tags.vercel.app/api/taggroup')
      .then((response) => {
        if (response.status === 200) {
          this.setState({
            tags: response.data.data,
          });
        }
      });
  }

  toTag(tag) {
    // this.context.router.history.push(`/tags/${tag.name}`, { tag: tag.name, color: 'green' });
    this.handleChange({
      target: {
        value: this.props.text + `#${tag.name} `,
      },
    });
  }

  handleChange = (e) => {
    this.props.onChange(e.target.value);
  };

  handleKeyDown = (e) => {
    if (e.keyCode === 13 && (e.ctrlKey || e.metaKey)) {
      this.handleSubmit();
    }
  };

  getFulltextForCharacterCounting = () => {
    return [
      this.props.spoiler ? this.props.spoilerText : '',
      countableText(this.props.text),
    ].join('');
  };

  canSubmit = () => {
    const { isSubmitting, isChangingUpload, isUploading, anyMedia } =
      this.props;
    const fulltext = this.getFulltextForCharacterCounting();
    const isOnlyWhitespace =
      fulltext.length !== 0 && fulltext.trim().length === 0;

    return !(
      isSubmitting ||
      isUploading ||
      isChangingUpload ||
      length(fulltext) > 1024 ||
      (isOnlyWhitespace && !anyMedia)
    );
  };

  handleSubmit = (e) => {
    if (this.props.text !== this.autosuggestTextarea.textarea.value) {
      // Something changed the text inside the textarea (e.g. browser extensions like Grammarly)
      // Update the state to match the current text
      this.props.onChange(this.autosuggestTextarea.textarea.value);
    }

    if (!this.canSubmit()) {
      return;
    }
    this.props.onSubmit(
      this.context.router ? this.context.router.history : null,
      this.state.isChecked,
    );
    if (e) {
      e.preventDefault();
    }
  };

  onSuggestionsClearRequested = () => {
    this.props.onClearSuggestions();
  };

  onSuggestionsFetchRequested = (token) => {
    this.props.onFetchSuggestions(token);
  };

  onSuggestionSelected = (tokenStart, token, value) => {
    this.props.onSuggestionSelected(tokenStart, token, value, ['text']);
  };

  onSpoilerSuggestionSelected = (tokenStart, token, value) => {
    this.props.onSuggestionSelected(tokenStart, token, value, ['spoiler_text']);
  };

  handleChangeSpoilerText = (e) => {
    this.props.onChangeSpoilerText(e.target.value);
  };

  handleFocus = () => {
    if (this.composeForm && !this.props.singleColumn) {
      const { left, right } = this.composeForm.getBoundingClientRect();
      if (
        left < 0 ||
        right > (window.innerWidth || document.documentElement.clientWidth)
      ) {
        this.composeForm.scrollIntoView();
      }
    }
  };
  blobToImage = (blob) => {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(blob);
      let img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.src = url;
    });
  };
  componentDidMount = async () => {
    this.getTags();
    let result = await localforage.getItem('isSetNft');
    if (result !== null) {
      this.setState({
        isChecked: result,
      });
    }
    const { nft } = this.props;
    if (nft) {
      let img = ` https://api.like.co/likernft/metadata/image/class_${nft.classId}?size=480`;
      let res = await axios.get(img, {
        responseType: 'blob',
      });
      let blob = res.data;
      this.props.onPaste([blob]);
      this.props.onChange(`
      😘 @${nft.userName} 嗨嗨，我送了你這個 NFT，快來看看吧！
      https://liker.land/zh-Hant/nft/class/${nft.classId}
      `);
      this.props.destroyNft();
    }

    this._updateFocusAndSelection({});
    // let tag = this.context.router.history.location.state ? this.context.router.history.location.state.tag : null;
    // if(tag){
    //   this.handleChange({ target:{ value: `#${tag} ` } });
    // }
    // eslint-disable-next-line no-unused-vars
    this.context.router.history.listen((location, action) => {
      let tag = this.context.router.history.location.state
        ? this.context.router.history.location.state.tag
        : null;

      if (tag) {
        // this.handleChange({ target:{ value: `#${tag} ` } });
      }
    });
  };

  componentDidUpdate(prevProps) {
    if (this.props.location !== prevProps.location) {
      this.onRouteChanged();
    }
    this._updateFocusAndSelection(prevProps);
  }

  _updateFocusAndSelection = (prevProps) => {
    // This statement does several things:
    // - If we're beginning a reply, and,
    //     - Replying to zero or one users, places the cursor at the end of the textbox.
    //     - Replying to more than one user, selects any usernames past the first;
    //       this provides a convenient shortcut to drop everyone else from the conversation.
    if (this.props.focusDate && this.props.focusDate !== prevProps.focusDate) {
      let selectionEnd, selectionStart;

      if (
        this.props.preselectDate !== prevProps.preselectDate &&
        this.props.isInReply
      ) {
        selectionEnd = this.props.text.length;
        selectionStart = this.props.text.search(/\s/) + 1;
      } else if (typeof this.props.caretPosition === 'number') {
        selectionStart = this.props.caretPosition;
        selectionEnd = this.props.caretPosition;
      } else {
        selectionEnd = this.props.text.length;
        selectionStart = selectionEnd;
      }

      // Because of the wicg-inert polyfill, the activeElement may not be
      // immediately selectable, we have to wait for observers to run, as
      // described in https://github.com/WICG/inert#performance-and-gotchas
      Promise.resolve()
        .then(() => {
          this.autosuggestTextarea.textarea.setSelectionRange(
            selectionStart,
            selectionEnd,
          );
          this.autosuggestTextarea.textarea.focus();
        })
        .catch(console.error);
    } else if (prevProps.isSubmitting && !this.props.isSubmitting) {
      this.autosuggestTextarea.textarea.focus();
    } else if (this.props.spoiler !== prevProps.spoiler) {
      if (this.props.spoiler) {
        this.spoilerText.input.focus();
      } else if (prevProps.spoiler) {
        this.autosuggestTextarea.textarea.focus();
      }
    }
  };

  setAutosuggestTextarea = (c) => {
    this.autosuggestTextarea = c;
  };

  setSpoilerText = (c) => {
    this.spoilerText = c;
  };

  setRef = (c) => {
    this.composeForm = c;
  };

  handleEmojiPick = (data) => {
    const { text } = this.props;
    const position = this.autosuggestTextarea.textarea.selectionStart;
    const needsSpace =
      data.custom &&
      position > 0 &&
      !allowedAroundShortCode.includes(text[position - 1]);

    this.props.onPickEmoji(position, data, needsSpace);
  };

  render() {
    const { intl, onPaste, autoFocus } = this.props;
    const { tags, isChecked } = this.state;
    const disabled = this.props.isSubmitting;

    let publishText = '';

    if (this.props.isEditing) {
      publishText = intl.formatMessage(messages.saveChanges);
    } else if (
      this.props.privacy === 'private' ||
      this.props.privacy === 'direct'
    ) {
      publishText = (
        <span className='compose-form__publish-private'>
          <Icon id='lock' /> {intl.formatMessage(messages.publish)}
        </span>
      );
    } else {
      publishText =
        this.props.privacy !== 'unlisted'
          ? intl.formatMessage(messages.publishLoud, {
            publish: intl.formatMessage(messages.publish),
          })
          : intl.formatMessage(messages.publish);
    }

    return (
      <div className='toot-form'>
        <form className='compose-form' onSubmit={this.handleSubmit}>
          <WarningContainer />
          <ReplyIndicatorContainer />

          <div
            className={`spoiler-input ${
              this.props.spoiler ? 'spoiler-input--visible' : ''
            }`}
            ref={this.setRef}
            aria-hidden={!this.props.spoiler}
          >
            <AutosuggestInput
              placeholder={intl.formatMessage(messages.spoiler_placeholder)}
              value={this.props.spoilerText}
              onChange={this.handleChangeSpoilerText}
              onKeyDown={this.handleKeyDown}
              disabled={!this.props.spoiler}
              ref={this.setSpoilerText}
              suggestions={this.props.suggestions}
              onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
              onSuggestionsClearRequested={this.onSuggestionsClearRequested}
              onSuggestionSelected={this.onSpoilerSuggestionSelected}
              searchTokens={[':']}
              id='cw-spoiler-input'
              className='spoiler-input__input'
              lang={this.props.lang}
              spellCheck
            />
          </div>

          <AutosuggestTextarea
            ref={this.setAutosuggestTextarea}
            placeholder={intl.formatMessage(messages.placeholder)}
            disabled={disabled}
            value={this.props.text}
            onChange={this.handleChange}
            suggestions={this.props.suggestions}
            onFocus={this.handleFocus}
            onKeyDown={this.handleKeyDown}
            onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
            onSuggestionsClearRequested={this.onSuggestionsClearRequested}
            onSuggestionSelected={this.onSuggestionSelected}
            onPaste={onPaste}
            autoFocus={autoFocus}
            lang={this.props.lang}
          >
            <EmojiPickerDropdown onPickEmoji={this.handleEmojiPick} />

            <div className='compose-form__modifiers'>
              <UploadFormContainer />
              <PollFormContainer />
            </div>
          </AutosuggestTextarea>

          <div className='compose-form__buttons-wrapper'>
            <div className='compose-form__buttons'>
              <UploadButtonContainer />
              <PollButtonContainer />
              <PrivacyDropdownContainer disabled={this.props.isEditing} />
              <SpoilerButtonContainer />
              <LanguageDropdown />
            </div>

            <div className='character-counter__wrapper'>
              <CharacterCounter
                max={1024}
                text={this.getFulltextForCharacterCounting()}
              />
            </div>
          </div>

          <div className='compose-form__publish'>
            <Checkbox
              onChange={this.onCheckBoxChange}
              checked={this.state.isChecked}
              label='Mint to NFT postcard'
            />
            <div className='compose-form__publish-button-wrapper'>
              <Button
                type='submit'
                text={publishText}
                disabled={!this.canSubmit()}
                block
              />
            </div>
          </div>
        </form>
        <div className='interests-zone-form'>
          {tags.length === 0 ? (
            <Spinner size={30} />
          ) : (
            <div
              className='cards-container'
              variant='outlined'
              sx={{ width: 320 }}
            >
              {tags.map((card) => (
                <Card interactive elevation={Elevation.TWO} key={card.name}>
                  {card.name}
                  <div className='card-area'>
                    {card.children.map((tag) => (
                      // eslint-disable-next-line react/jsx-no-bind
                      <Tag
                        onClick={this.toTag.bind(this, tag)}
                        minimal
                        round
                        key={tag.name}
                      >
                        {tag.name}
                      </Tag>
                    ))}
                  </div>
                </Card>
                // <Card onClick={this.toTag.bind(this, tag)} large minimal round key={tag.name} >{tag.name}</Card>
              ))}
              <Callout intent='success' title={'TIPS'}>
                <Icon id='star' /> 點按 Tag 會自動出現在輸入框哦
              </Callout>
            </div>
          )}
        </div>
        {/* <Divider /> */}

        {/* <Callout intent='success' title={'TIPS'}>
          <Icon id='star' /> 點按 Tag 會自動出現在輸入框哦
        </Callout> */}
      </div>
    );
  }

}
