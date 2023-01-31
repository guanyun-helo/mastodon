import PropTypes from 'prop-types';
import React from 'react';
import { Helmet } from 'react-helmet';
import { IntlProvider, addLocaleData } from 'react-intl';
import { Provider as ReduxProvider } from 'react-redux';
import { BrowserRouter, Route } from 'react-router-dom';
import { ScrollContext } from 'react-router-scroll-4';
import storage from 'localforage'
import configureStore from 'mastodon/store/configureStore';
import UI from 'mastodon/features/ui';
import { fetchCustomEmojis } from 'mastodon/actions/custom_emojis';
import { hydrateStore } from 'mastodon/actions/store';
import { connectUserStream } from 'mastodon/actions/streaming';
import ErrorBoundary from 'mastodon/components/error_boundary';
import initialState, { title as siteTitle } from 'mastodon/initial_state';
import { getLocale } from 'mastodon/locales';

const { localeData, messages } = getLocale();
addLocaleData(localeData);

const title = process.env.NODE_ENV === 'production' ? siteTitle : `${siteTitle} (Dev)`;

export const store = configureStore();
const hydrateAction = hydrateStore(initialState);

store.dispatch(hydrateAction);
if (initialState.meta.me) {
  store.dispatch(fetchCustomEmojis());
}

const createIdentityContext = state => ({
  signedIn: !!state.meta.me,
  accountId: state.meta.me,
  disabledAccountId: state.meta.disabled_account_id,
  accessToken: state.meta.access_token,
  permissions: state.role ? state.role.permissions : 0,
});

export default class Mastodon extends React.PureComponent {

  static propTypes = {
    locale: PropTypes.string.isRequired,
  };

  static childContextTypes = {
    identity: PropTypes.shape({
      signedIn: PropTypes.bool.isRequired,
      accountId: PropTypes.string,
      disabledAccountId: PropTypes.string,
      accessToken: PropTypes.string,
    }).isRequired,
  };

  identity = createIdentityContext(initialState);

  getChildContext() {
    return {
      identity: this.identity,
    };
  }

  componentDidMount() {
    storage.getItem('times', (err, value) => {
      if (value >= 6) {
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
    if (this.identity.signedIn) {
      this.disconnect = store.dispatch(connectUserStream());
    }
  }

  componentWillUnmount() {
    if (this.disconnect) {
      this.disconnect();
      this.disconnect = null;
    }
  }

  shouldUpdateScroll (prevRouterProps, { location }) {
    return !(location.state?.mastodonModalKey && location.state?.mastodonModalKey !== prevRouterProps?.location?.state?.mastodonModalKey);
  }

  render() {
    const { locale } = this.props;

    return (
      <IntlProvider locale={locale} messages={messages}>
        <ReduxProvider store={store}>
          <ErrorBoundary>
            <BrowserRouter>
              <ScrollContext shouldUpdateScroll={this.shouldUpdateScroll}>
                <Route path='/' component={UI} />
              </ScrollContext>
            </BrowserRouter>

            <Helmet defaultTitle={title} titleTemplate={`%s - ${title}`} />
          </ErrorBoundary>
        </ReduxProvider>
      </IntlProvider>
    );
  }

}
