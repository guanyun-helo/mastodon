import Rails from '@rails/ujs';

export function start() {
  require('material-react-toastify/dist/ReactToastify.css');
  require('animate.css');
  require.context('../images/', true, /\.(jpg|png|svg)$/);
  try {
    Rails.start();
  } catch (e) {
    // If called twice
  }
}
