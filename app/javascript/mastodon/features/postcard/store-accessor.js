// eslint-disable-next-line import/no-extraneous-dependencies
import { getModule } from 'vuex-module-decorators';
import WalletStore from '~/store/wallet';
import SubscriptionStore from '~/store/subscription';
import IscnStore from '~/store/iscn';
import UIStore from '~/store/ui';
let walletStore;
let subscriptionStore;
let iscnStore;
let uiStore;
function initialiseStores(store) {
    walletStore = getModule(WalletStore, store);
    subscriptionStore = getModule(SubscriptionStore, store);
    iscnStore = getModule(IscnStore, store);
    uiStore = getModule(UIStore, store);
}
export { initialiseStores, walletStore, subscriptionStore, iscnStore, uiStore, };
