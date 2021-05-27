import React from 'react';
import { Provider } from 'react-redux';
import PropTypes from 'prop-types';
import configureStore from '../store/configureStore';
import { BrowserRouter, Route } from 'react-router-dom';
import { ScrollContext } from 'react-router-scroll-4';
import UI from '../features/ui';
import { fetchCustomEmojis } from '../actions/custom_emojis';
import { hydrateStore } from '../actions/store';
import { connectUserStream } from '../actions/streaming';
import { IntlProvider, addLocaleData } from 'react-intl';
import { getLocale } from '../locales';
import { previewState as previewMediaState } from 'mastodon/features/ui/components/media_modal';
import { previewState as previewVideoState } from 'mastodon/features/ui/components/video_modal';
import initialState from '../initial_state';
import ErrorBoundary from '../components/error_boundary';
import storage from 'localforage'
import { COMPOSE_SPOILER_TEXT_CHANGE } from '../actions/compose';
const { localeData, messages } = getLocale();
addLocaleData(localeData);

export const store = configureStore();
const hydrateAction = hydrateStore(initialState);

store.dispatch(hydrateAction);
store.dispatch(fetchCustomEmojis());

export default class Mastodon extends React.PureComponent {

  static propTypes = {
    locale: PropTypes.string.isRequired,
  };

  componentDidMount() {
    storage.getItem('times', (err, value) => {
      if (value >= 8) {
        storage.clear().then(() => {
          console.log('Database is now empty.');
        }).catch(function (err) {
          // This code runs if there were any errors
          console.log(err);
        });
        return
      }

      if (value === null) {
        storage.setItem('times', 0)
      } else if (typeof value === 'number') {
        storage.setItem('times', value + 1)
      }
    })
    this.disconnect = store.dispatch(connectUserStream());
  }

  componentWillUnmount() {
    if (this.disconnect) {
      this.disconnect();
      this.disconnect = null;
    }
  }

  shouldUpdateScroll(_, { location }) {
    return location.state !== previewMediaState && location.state !== previewVideoState;
  }

  render() {
    const { locale } = this.props;

    return (
      <IntlProvider locale={locale} messages={messages}>
        <Provider store={store}>
          <ErrorBoundary>
            <BrowserRouter basename='/web'>
              <ScrollContext shouldUpdateScroll={this.shouldUpdateScroll}>
                <Route path='/' component={UI} />
              </ScrollContext>
            </BrowserRouter>
          </ErrorBoundary>
        </Provider>
      </IntlProvider>
    );
  }

}
