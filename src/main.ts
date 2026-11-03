import './styles.css';
import { renderFallback } from './ui/screens/fallback';
const params = new URLSearchParams(location.search);
const launch =
  params.get('experience') === 'intraday' || location.pathname === '/intraday.html'
    ? import('./intraday/app').then(({ mountIntraday }) => mountIntraday())
    : params.get('experience') === 'game' && params.get('prototype') !== 'coaster'
      ? import('./bootstrap').then(({ bootstrap }) => bootstrap())
      : import('./prototype/prototype').then(({ mountCoasterPrototype }) =>
          mountCoasterPrototype(),
        );
void launch.catch(() => {
  const ui = document.getElementById('ui');
  if (ui) renderFallback(ui, true);
});
