import type { Briefing } from '@/core/types';
import { el } from '@/ui/dom';
import { createBriefingPanel } from '@/ui/screens/briefing';
import { buildCtaUrl, captureAttribution } from '@/services/attribution';
import { shareBriefing } from '@/services/share';
import { recapChapter, rideStage, RIDE_DURATION } from './recapTimeline';
import './recap.css';

interface Controls {
  play(): void;
  pause(): void;
  replay(): void;
  toggleSound(): boolean | undefined;
}

export function createRecapFlow(
  root: HTMLElement,
  briefing: Briefing,
  controls: Controls,
  notice?: string,
) {
  let started = false,
    ended = false,
    playing = false;
  const draft = !briefing.approval.approved;
  const ctaUrl = buildCtaUrl(briefing.cta, captureAttribution(location.search));
  const header = el('header', { class: 'ride-top' }, [
    el('div', {}, [
      el('p', {
        class: 'ride-eyebrow',
        text: draft ? 'Draft recap' : 'Candlestick Coaster',
      }),
      el('h1', { text: 'The market is a ride.' }),
    ]),
  ]);
  const stage = el('div', { class: 'ride-stage', text: 'Ready to climb' });
  const ride = el('button', { type: 'button', text: 'Start ride' }) as HTMLButtonElement;
  const replay = el('button', {
    type: 'button',
    text: 'Replay',
    'aria-label': 'Replay the coaster sequence',
  }) as HTMLButtonElement;
  const sound = el('button', {
    type: 'button',
    text: 'Sound off',
    'aria-pressed': 'false',
  }) as HTMLButtonElement;
  const read = el('button', {
    type: 'button',
    text: 'Read briefing',
    'aria-label': 'Read briefing & sources',
  });
  header.append(read);
  const captionTitle = el('strong'),
    captionText = el('span');
  const caption = el(
    'div',
    { class: 'ride-caption', 'aria-live': 'polite', 'aria-atomic': 'true' },
    [captionTitle, captionText],
  );
  const progress = el('div', { class: 'ride-progress', 'aria-hidden': 'true' });
  const intro = el('section', { class: 'recap-card', 'aria-labelledby': 'recap-intro-title' }, [
    el('p', { class: 'recap-kicker', text: 'Your seat for the recap' }),
    el('h2', { id: 'recap-intro-title', text: briefing.title }),
  ]);
  const introBody = el(
    'div',
    { class: 'recap-card-body', tabindex: '0', 'aria-label': 'Recap introduction details' },
    [
      el('p', {
        class: 'recap-coverage',
        text: `Market close: ${new Intl.DateTimeFormat('en-US', { timeZone: briefing.displayTimezone, month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(briefing.coverageEnd))}`,
      }),
      el('p', { class: 'recap-lede', text: briefing.chapters[0]!.caption }),
      el('p', {
        text: 'A 28-second ride. Read along and pause anytime.',
      }),
      el('p', {
        class: 'recap-integrity',
        text: 'Illustrative track. Saved daily candles provide market context.',
      }),
    ],
  );
  if (draft)
    introBody.append(
      el('p', {
        class: 'recap-draft',
        text: 'Draft: research and interpretation are not approved.',
      }),
    );
  if (notice)
    introBody.prepend(
      el('p', {
        role: 'status',
        text: 'That recap is unavailable. Showing the default dated recap instead.',
      }),
    );
  intro.append(introBody);
  const endHeading = el('h2', {
    id: 'recap-end-title',
    tabindex: '-1',
    text: 'Takeaways',
  });
  const end = el(
    'section',
    { class: 'recap-card', 'aria-labelledby': 'recap-end-title', hidden: '' },
    [el('p', { class: 'recap-kicker', text: 'Recap complete' }), endHeading],
  );
  const endBody = el(
    'div',
    { class: 'recap-card-body', tabindex: '0', 'aria-label': 'Recap takeaway details' },
    [
      el(
        'ul',
        { class: 'recap-takeaways' },
        briefing.takeaways.map((takeaway) =>
          el('li', {}, [
            el('strong', { text: takeaway.label }),
            el('span', { text: takeaway.text.split('TODO(owner):')[0]!.trim() }),
          ]),
        ),
      ),
      el('p', {
        class: 'recap-integrity',
        text: 'Hypothetical scenarios describe possibilities, not observed future outcomes. The final recovery on this track is illustrative.',
      }),
    ],
  );
  if (draft)
    endBody.append(
      el('p', {
        class: 'recap-draft',
        text: 'Draft / editorial approval and public research links pending. Read the briefing for review notes.',
      }),
    );
  const share = el('button', { type: 'button', text: 'Share recap' }) as HTMLButtonElement;
  const shareStatus = el('p', { class: 'recap-share-status', role: 'status' });
  const manual = el('input', {
    type: 'text',
    readonly: '',
    hidden: '',
    'aria-label': 'Recap share link',
  }) as HTMLInputElement;
  const cta = el('a', {
    href: ctaUrl,
    class: 'recap-cta',
    rel: 'noopener',
    text: briefing.cta.label,
  });
  endBody.append(shareStatus, manual);
  end.append(endBody, el('div', { class: 'recap-card-actions' }, [share, cta]));
  const panel = createBriefingPanel(briefing, () => {}, { ctaUrl });
  panel.root.classList.add('ride-briefing');
  const briefingCta = panel.root.querySelector<HTMLAnchorElement>(':scope > a');
  if (briefingCta) {
    briefingCta.textContent = 'Join waitlist';
    briefingCta.classList.add('recap-cta');
  }
  const back = el('button', { type: 'button', class: 'btn-secondary', text: 'Back to game' });
  back.onclick = () => panel.close();
  panel.root.append(
    el('div', { class: 'ride-briefing-actions' }, [...(briefingCta ? [briefingCta] : []), back]),
  );
  const openBriefing = () => {
    read.focus({ preventScroll: true });
    controls.pause();
    panel.open(ended ? 'results' : 'intro');
  };
  read.onclick = openBriefing;
  const footer = el('div', { class: 'ride-bottom' }, [
    el('div', {}, [
      caption,
      el('p', {
        class: 'ride-disclaimer',
        text: `${draft ? 'Draft recap / ' : ''}Illustrative track / Not a historical price path`,
      }),
    ]),
    el('div', { class: 'ride-controls', 'aria-label': 'Ride controls' }, [ride, replay, sound]),
  ]);
  root.append(header, stage, intro, end, footer, progress, panel.root);
  document.title = `${briefing.title} | Candlestick Coaster`;
  function begin(restart = false) {
    started = true;
    ended = false;
    intro.hidden = true;
    end.hidden = true;
    manual.hidden = true;
    shareStatus.textContent = '';
    if (restart) controls.replay();
    else controls.play();
    ride.focus({ preventScroll: true });
  }
  ride.onclick = () => {
    if (playing) controls.pause();
    else begin(ended);
  };
  replay.onclick = () => begin(true);
  sound.onclick = () => {
    const muted = controls.toggleSound();
    sound.textContent = muted ? 'Sound off' : 'Sound on';
    sound.setAttribute('aria-pressed', String(!muted));
  };
  share.onclick = async () => {
    share.disabled = true;
    try {
      const result = await shareBriefing(briefing, () => {});
      if (result.cancelled) return;
      shareStatus.textContent =
        result.method === 'copy'
          ? 'Recap link copied.'
          : result.method === 'native'
            ? 'Share sheet opened.'
            : 'Copy this recap link:';
      if (result.method === 'manual') {
        manual.value = result.url;
        manual.hidden = false;
        manual.focus();
        manual.select();
        manual.scrollIntoView({ block: 'nearest' });
      }
    } finally {
      share.disabled = false;
    }
  };
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') controls.pause();
  });
  let lastChapter = '';
  return {
    render(time: number, running: boolean) {
      playing = running;
      const complete = time >= RIDE_DURATION;
      if (running) {
        started = true;
        intro.hidden = true;
      }
      stage.textContent = rideStage(time);
      ride.textContent = running
        ? 'Pause ride'
        : complete
          ? 'Ride again'
          : started
            ? 'Resume ride'
            : 'Start ride';
      root.dataset.phase = complete ? 'results' : started ? 'ride' : 'intro';
      caption.hidden = !started || complete;
      progress.style.width = `${Math.min(100, (time / RIDE_DURATION) * 100)}%`;
      const { chapter, index } = recapChapter(briefing, time);
      if (lastChapter !== chapter.id) {
        lastChapter = chapter.id;
        captionTitle.textContent = `${chapter.forwardLooking ? 'Hypothetical / not observed' : chapter.label} / ${index + 1} of ${briefing.chapters.length}`;
        captionText.textContent = chapter.caption;
      }
      if (complete && !ended) {
        ended = true;
        end.hidden = false;
        intro.hidden = true;
        endHeading.focus({ preventScroll: true });
      }
    },
    unavailable() {
      ride.disabled = true;
      replay.disabled = true;
      sound.disabled = true;
      stage.textContent = 'Text recap available';
      introBody.prepend(
        el('p', {
          role: 'status',
          text: 'The ride renderer is unavailable. Read the complete briefing and sources below.',
        }),
      );
      introBody.append(cta.cloneNode(true));
    },
  };
}
