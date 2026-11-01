import './styles.css';
import { bootstrap } from './bootstrap';
import { renderFallback } from './ui/screens/fallback';
const launch =
  new URLSearchParams(location.search).get('prototype') === 'coaster'
    ? import('./prototype/prototype').then(({ mountCoasterPrototype }) => mountCoasterPrototype())
    : bootstrap();
void launch.catch(() => {
  const ui = document.getElementById('ui');
  if (ui) renderFallback(ui, true);
});
