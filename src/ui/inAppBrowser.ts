import { el } from './dom';

const IN_APP_PATTERNS = [
  /Twitter/i,
  /\bX-Client/i,
  /Instagram/i,
  /FBAN|FBAV|FB_IAB/i,
  /LinkedInApp/i,
  /TikTok/i,
];

export function isInAppBrowser(
  userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '',
): boolean {
  return IN_APP_PATTERNS.some((re) => re.test(userAgent));
}

export function createInAppBrowserBanner(
  url = typeof window !== 'undefined' ? window.location.href : '',
): HTMLElement {
  const copyBtn = el('button', {
    type: 'button',
    class: 'inapp-copy-btn',
    text: 'Copy link',
  }) as HTMLButtonElement;

  const dismissBtn = el('button', {
    type: 'button',
    class: 'inapp-dismiss-btn',
    'aria-label': 'Dismiss browser hint',
    text: '✕',
  }) as HTMLButtonElement;

  const banner = el('div', { id: 'inapp-banner', class: 'inapp-banner', role: 'status' }, [
    el('span', { text: 'For best results, open in your browser.' }),
    copyBtn,
    dismissBtn,
  ]);

  copyBtn.addEventListener('click', () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(url).then(
        () => {
          copyBtn.textContent = 'Copied!';
        },
        () => {
          copyBtn.textContent = 'Copy failed';
        },
      );
    }
  });

  dismissBtn.addEventListener('click', () => {
    banner.setAttribute('hidden', '');
  });

  return banner;
}
