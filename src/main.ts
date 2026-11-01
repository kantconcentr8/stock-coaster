import './styles.css';
import { bootstrap } from './bootstrap';
import { renderFallback } from './ui/screens/fallback';
void bootstrap().catch(() => {
  const ui = document.getElementById('ui');
  if (ui) renderFallback(ui, true);
});
