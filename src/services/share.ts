import type { Briefing } from '@/core/types';
export type ShareMethod = 'native' | 'copy' | 'manual';
export interface ShareEnvironment {
  href: string;
  share?: (data: ShareData) => Promise<void>;
  copy?: (text: string) => Promise<void>;
}
export function buildShareUrl(href: string, id: string, method: ShareMethod): string {
  const current = new URL(href);
  const url = new URL(current.pathname, current.origin);
  url.search = new URLSearchParams({ b: id, utm_source: 'share', utm_medium: method }).toString();
  if (current.searchParams.get('prototype') === 'coaster')
    url.searchParams.set('prototype', 'coaster');
  return url.href;
}
function browserEnvironment(): ShareEnvironment {
  const environment: ShareEnvironment = { href: window.location.href };
  try {
    environment.share = navigator.share?.bind(navigator);
  } catch {
    /* denied */
  }
  try {
    environment.copy = navigator.clipboard?.writeText.bind(navigator.clipboard);
  } catch {
    /* denied */
  }
  return environment;
}
export async function shareBriefing(
  briefing: Briefing,
  onAction: (method: ShareMethod) => void,
  environment: ShareEnvironment = browserEnvironment(),
): Promise<{ method: ShareMethod; url: string; cancelled?: boolean }> {
  const url = (method: ShareMethod) => buildShareUrl(environment.href, briefing.briefingId, method);
  const emit = (method: ShareMethod) => {
    try {
      onAction(method);
    } catch {
      /* optional analytics */
    }
  };
  if (environment.share) {
    emit('native');
    try {
      await environment.share({
        title: briefing.title,
        text: briefing.shareText,
        url: url('native'),
      });
      return { method: 'native', url: url('native') };
    } catch (error) {
      if (error && typeof error === 'object' && 'name' in error && error.name === 'AbortError')
        return { method: 'native', url: url('native'), cancelled: true };
    }
  }
  if (environment.copy) {
    try {
      await environment.copy(url('copy'));
      emit('copy');
      return { method: 'copy', url: url('copy') };
    } catch {
      /* manual fallback */
    }
  }
  emit('manual');
  return { method: 'manual', url: url('manual') };
}
