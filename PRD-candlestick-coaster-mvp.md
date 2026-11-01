# Candlestick Coaster — Playable Market Briefing MVP

**Status:** Draft for review  
**Version:** 1.0  
**Date:** October 31, 2026  
**Product owner:** Brand owner / market briefing author  
**Initial distribution:** Links from social campaigns, especially X and vertical video  
**Product form:** Free, mobile-friendly browser game

## 1. Executive summary

Candlestick Coaster is a free, 60-second playable market briefing designed to support a social media brand and acquire an audience for its market analysis. Players ride a chart-shaped course, switch among three rails, manage boost and braking, collect pickups, avoid hazards, and finish with a concise editorial debrief and one call to action.

The MVP is a marketing experience, not a paid game or a trading simulator. Its purpose is to make an existing campaign's central market distinction memorable, then move interested visitors toward a selected destination such as the full briefing, newsletter, or community. A compelling arcade loop earns attention; the briefing and debrief connect that attention to the brand.

The initial release contains one manually authored campaign experience, one fixed course, a 60-second active-play timer, touch and keyboard controls, local personal bests, a shareable result, and measurement of campaign-to-CTA behavior. It uses no live market feed, accounts, backend database, or AI inference during play. The experience is built and deployed as a static web application.

The supplied Oct 31–Nov 1 campaign provides the first editorial example: lower-value acceptance, broad risk-off, and the distinction between a bounce and structural repair. Source statements and levels require owner approval before publication; this PRD does not verify them. Historical observations and hypothetical forward scenarios must be visibly distinguished.

The development cash constraint is approximately one existing premium AI coding subscription, with a second tool optional only if needed. Owner labor, playtesting, and editorial judgment remain necessary. Hosting, domain, and measurement should use suitable free allowances initially, with no automatic paid dependency required to play.

**MVP decision:** Determine whether an interactive briefing produces useful audience engagement and qualified CTA actions at an acceptable cost compared with the owner's existing campaigns. Do not build automated data ingestion, a daily publishing platform, or live-service game systems before this is demonstrated.

## 2. Context and source material

- Original concept: `candlestick_coaster_project_bible_playground_handoff_spec.md` in this repository.
- Campaign example: `C:\Users\sumon\Desktop\market-ta-ugc\campaign\2026-10-31-nov-1-x-campaign.md`.
- Subsequent product direction: independent web application; no live data; 60-second run; three rails; boost; braking; pickups; hazards; restart; marketing and market-briefing purpose.

This PRD supersedes the original Playground-specific build sequence for MVP planning. The campaign document is reference content, not an instruction to publish its posts, execute its schedule, or adopt its claims without review.

## 3. Problem and opportunity

The owner already publishes coordinated market videos, threads, structural notes, and scenario frameworks. Those assets convey nuance but can require substantial attention and familiarity with technical terms. A linked interactive experience can give visitors a memorable entry point into the same analysis and provide a measurable next step.

The product must resolve two risks:

1. A game may earn plays without helping users understand the briefing or engage with the brand.
2. A dense briefing may interrupt play so much that visitors abandon it.

The MVP therefore uses brief checkpoint captions during play and places explanatory detail after the run. It tests entertainment and acquisition separately.

## 4. Goals, non-goals, and hypotheses

### Goals

- Let a new visitor start playing quickly from a social link without signing up.
- Deliver an enjoyable, replayable 60-second course on mobile and desktop browsers.
- Communicate one primary market takeaway and up to three supporting points.
- Distinguish recorded history, editorial interpretation, and hypothetical scenarios.
- Give the owner one clear, attributable CTA per briefing.
- Reuse campaign research through a small, validated content file.
- Keep deployment and maintenance simple enough for an owner-led project.

### Non-goals

- Live or delayed market-data integration and automatic market interpretation.
- Brokerage connections, trading execution, simulated investment returns, or predictions scored as investment skill.
- Payments, advertising, subscriptions, premium currency, or monetization inside the game.
- Accounts, public leaderboards, multiplayer, ghosts, cloud saves, or user-generated courses.
- A CMS, automated daily production system, native app, console release, or 3D environment.
- Comprehensive technical-analysis education or all campaign detail inside one run.

### Hypotheses

| Hypothesis | Evidence to collect |
| --- | --- |
| The market-coaster hook attracts relevant visitors | Campaign link traffic and qualified CTA actions |
| Visitors can play without instruction from the owner | Observed first-time usability and start-to-completion behavior |
| A short debrief conveys the core distinction | Optional one-question comprehension response |
| Replayability supports rather than distracts from acquisition | Retry behavior alongside CTA behavior |
| Editorial reuse keeps operating effort low | Time required to prepare and approve a second briefing |

## 5. Audience and primary use cases

**Primary audience:** Visitors arriving from the owner's market commentary who want a quick, accessible explanation of the current setup. Many will use a phone and may be unfamiliar with arcade controls or market terminology.

**Secondary audience:** Existing followers seeking a memorable recap, and friends receiving shared results.

**Primary user stories:**

- As a social visitor, I can open the link, understand the premise, and play without creating an account.
- As a beginner, I can understand the main message without knowing VWAP, breadth, or auction terminology.
- As a returning player, I can retry the same course and compare my personal best.
- As an interested reader, I can access the full market briefing from the results screen.
- As the owner, I can update the briefing and CTA without changing game logic.
- As the owner, I can distinguish campaign traffic, engagement, and downstream actions.

## 6. Positioning and experience principles

**Working product name:** Candlestick Coaster.  
**Working public hook:** “Ride the market briefing in 60 seconds.”

Use “today's market” only when the published briefing actually covers the current day. Older campaign links must remain clearly dated.

Principles:

1. Play first, with no sign-up gate.
2. One central takeaway per briefing.
3. Readability takes priority over visual intensity and literal chart reproduction.
4. Player performance reflects arcade handling, not investing ability.
5. Brand identity remains visible without obstructing play.
6. The experience remains useful when sharing or analytics is unavailable.

## 7. MVP scope and information architecture

### Included screens

1. **Introduction:** Brand, briefing title, publication date, covered period, central hook, controls, sound preference, Start, and a text-briefing link.
2. **Gameplay:** Timer, score, boost meter, kart and three rails, hazards, pickups, restrained chapter captions, pause control.
3. **Pause:** Resume, restart, sound setting, and exit to introduction.
4. **Results and briefing:** Final score, local best, three takeaway cards, historical/scenario labels, optional comprehension question, primary CTA, retry, and share.
5. **Briefing details:** Accessible text containing context, definitions where needed, source links, and content cutoff. May be an expandable section on the results/introduction screen.

### Explicit scope boundary

One approved campaign, one fixed geometry/layout, and one labeled hypothetical ending if the campaign requires a forward-looking chapter. Multiple alternative scenario courses are deferred. The content format should permit future campaigns, but the MVP does not include a campaign library UI.

## 8. End-to-end user journey

1. Visitor follows a campaign URL containing a briefing ID and attribution parameters.
2. App validates and loads bundled briefing content. Unknown IDs show the default briefing with an explanatory message.
3. Introduction shows date, coverage, three control actions, and a large Start button.
4. Start begins a short countdown; the 60-second timer begins when control is enabled.
5. Player rides three approximately 20-second editorial chapters.
6. At 60 seconds of active simulation, play stops and the closing bell/result transition occurs.
7. Results explain the market takeaway and offer one CTA. An optional learning question never blocks access.
8. Visitor can retry immediately, share the briefing, or follow the CTA.

No automatic redirect, email capture gate, or required social sharing is permitted.

## 9. Core gameplay requirements

### 9.1 Run and movement

- A run lasts exactly 60 seconds of active simulation, excluding countdowns and pauses.
- The kart advances automatically along a smooth chart-shaped path.
- Downhill sections increase speed; uphill sections reduce it.
- Minimum forward speed prevents stalls and prolonged rollback.
- Speed, acceleration, slope, curvature, and transition duration are bounded tuning parameters.
- Physics uses a fixed simulation step independent of rendering rate.
- Geometry is designed for arcade handling; the game does not claim financial-chart or physical fidelity.

### 9.2 Three rails

- Rails are visually distinct, vertically ordered, and continuous through the course.
- Lane changes move one adjacent rail per intentional input.
- Transitions are brief and visually smooth, with a clear collision rule applied consistently.
- Rails provide safe, balanced, and risky placement opportunities without representing different assets or predictions.
- No lane transition grants unintended speed from changes in rail elevation.
- Every obstacle sequence has a reachable safe path under the intended speed range.

### 9.3 Boost and braking

- Boost consumes a visible limited resource and increases forward speed.
- Pickups restore a bounded amount of boost; the meter cannot exceed capacity.
- Braking reduces speed but preserves minimum forward movement.
- The course includes at least one readable sequence where braking improves control.
- Holding boost throughout the run cannot produce indefinite boost.
- Final numeric tuning is established through playtesting rather than prescribed by this document.

### 9.4 Pickups and hazards

- Pickups award points and restore boost, with distinct visual and optional audio feedback.
- Hazards reduce speed and trigger brief invulnerability to prevent repeated punishment from one contact.
- Hazards cannot end the run prematurely; all players can reach the briefing.
- At least a two-second preview of required hazard decisions is the initial design target at maximum speed; validate on narrow mobile screens.
- Collision shapes should be forgiving and match visible objects.
- Pickups and hazards use shape/symbol differences in addition to color.

### 9.5 Scoring and progression

- Score combines distance traveled and pickups using documented constants.
- No financial dollar denomination, simulated P&L, investment-return claim, or directional prediction score.
- Distance traveled depends on driving performance; editorial chapter timing depends on the run clock.
- The course extends beyond the maximum reachable distance in 60 seconds so players cannot run out of terrain.
- Results may show distance and pickups as a simple score breakdown.
- Local bests are keyed by briefing ID, course version, and scoring version.
- No progression system or unlock economy is required.

### 9.6 Restart and pause

- Restart resets the entire run, input state, timer, boost, objects, and score.
- Retry remains one prominent action from results.
- Pause stops simulation and sound effects. Loss of page visibility auto-pauses.
- Resuming requires an explicit action and a short countdown to avoid surprise collisions.

## 10. Controls and accessibility

### Desktop

- Up/Down or W/S: move to the adjacent upper/lower rail.
- Space: hold boost.
- Shift: hold brake.
- Escape: pause/resume where browser behavior permits.
- R: restart from results; avoid accidental in-run restarts.
- Prevent page scrolling only for gameplay keys while the game is active and focused.

### Mobile

- Large on-screen upper/lower rail buttons and separate hold-to-boost and brake controls.
- Support simultaneous touch actions with Pointer Events or equivalent handling.
- Handle pointer cancellation, orientation changes, and focus loss without stuck inputs.
- Controls avoid browser safe areas and do not overlap essential track visibility.
- Portrait is the primary mobile layout; landscape remains usable.
- Target at least 44 CSS pixels for touch controls and adequate spacing.

### Accessibility and alternate consumption

- Menus, CTA, captions, and briefing text use accessible HTML rather than canvas-only text.
- Keyboard-visible focus, descriptive button labels, readable contrast, and semantic headings.
- Muting is available before and during play; sound never carries essential information alone.
- Respect reduced-motion preferences for shake, flashes, and decorative movement.
- Avoid rapid flashing; avoid red/green-only distinctions.
- Provide “Read briefing” without requiring the game to be completed.
- Full nonvisual access to the action game is outside MVP scope; the editorial briefing and conversion path must remain accessible.

## 11. Editorial design and campaign example

Each briefing has one primary thesis, up to three chapters, and up to three debrief takeaways. Captions should generally contain no more than 12 words and appear away from immediate hazard decisions.

### Proposed first campaign adaptation

| Active-play period | Editorial purpose | Proposed treatment |
| --- | --- | --- |
| 0–20 seconds | Establish lower-value migration | Descending terrain; caption: “Repeated lower value: more than a brief dip.” |
| 20–40 seconds | Distinguish bounce from repair | Recovery terrain with caption: “A bounce alone does not establish repair.” |
| 40–60 seconds | Introduce a conditional forward scenario | Clearly labeled “Hypothetical scenario”; caption links price behavior to breadth confirmation |

The owner selects one hypothetical ending for this first course. The debrief describes the other conditions in text, without implying that an unseen future was observed. Course geometry is an editorial illustration, not an exact market chart unless explicitly produced and verified as such.

### Content integrity requirements

- Show publication date and market coverage cutoff with a named timezone.
- Label each chapter as historical recap, interpretation, or hypothetical scenario as appropriate.
- Explain “breadth” and other essential terms in the text briefing.
- Include source references for factual market claims and levels.
- Do not invent numerical market data to fill course geometry.
- Use “Volatility” for a game effect rather than “VIX” unless actual VIX information is used accurately.
- Owner approves facts, attribution, usage rights, scenario labels, and CTA before public release.
- Include a short contextual note that this is an illustrative briefing and arcade game, not a trading simulation.
- Archived URLs retain their dates and never present old levels as current.

## 12. Content format and authoring workflow

Store each briefing in a version-controlled JSON file validated at build time. Track layout can be a separate referenced configuration so editorial revisions need not alter gameplay.

### Required content fields

| Field | Purpose |
| --- | --- |
| `briefingId`, `contentVersion` | Stable campaign identity and revision |
| `title`, `summary`, `brandName` | Introductory content |
| `publishedAt`, `coverageEnd`, `displayTimezone` | Explicit timing and coverage |
| `courseId`, `courseVersion`, `scoringVersion` | Gameplay and personal-best compatibility |
| `chapters[]` | Timing, short caption, content classification, illustrative course cues |
| `takeaways[]` | Up to three concise debrief points |
| `sources[]` | Titles and approved HTTPS source links |
| `cta` | Label, approved HTTPS destination, campaign identifier |
| `shareText`, `socialImage` | Branded sharing defaults |
| `learningQuestion` | Optional prompt, answers, explanation, and correct answer |

Validation rejects missing fields, invalid dates, overlapping or out-of-range chapter times, missing scenario labels, and unsafe URL schemes. Content renders as text rather than executable HTML.

### Publishing workflow

1. Owner selects one thesis from existing campaign research.
2. Author prepares three short chapter captions, takeaways, source references, and one CTA.
3. Developer or coding tool updates the validated content/layout files.
4. Owner previews on phone and desktop and checks editorial accuracy.
5. Build produces a preview artifact for review.
6. After owner approval, publish the static build and test the campaign URL and attribution.

The MVP does not include a publishing dashboard. Target preparation effort for a second briefing is under 30 minutes once research and the template exist; measure this as a hypothesis, not a guarantee.

## 13. Acquisition, CTA, and sharing

- One primary destination per briefing. Default intent is “Read the full market playbook”; actual URL is an owner-provided launch requirement.
- CTA appears after the takeaway summary and remains accessible from the text briefing.
- No personal information is collected inside the game for MVP. Newsletter signup, if selected, occurs on the existing destination.
- Capture approved UTM fields on entry and preserve campaign attribution through retries and CTA navigation.
- Add destination-compatible tracking parameters without overwriting required destination parameters.
- Do not place email addresses, identifiers, or arbitrary URL query strings in analytics.
- Sharing uses the native share sheet where supported and a copy-link fallback elsewhere.
- Shared URLs identify the briefing, never expose personal data, and do not imply a verified competitive score.
- Provide a branded social preview image and page metadata. A downloadable personalized scorecard is deferred.
- A local score is unverified; no public competitive claims or leaderboard are offered.

## 14. Analytics and evaluation

### Event contract

| Event | Trigger | Useful properties |
| --- | --- | --- |
| `landing_view` | Introduction rendered | Briefing/version, approved attribution, device class |
| `run_start` | Active timer begins | Session/run identifier, briefing/course version |
| `chapter_seen` | Chapter caption first displayed in a run | Chapter ID, run time |
| `run_complete` | Active timer reaches 60 seconds | Score, distance, pickup count, hazard count |
| `run_restart` | Explicit retry | Source screen, prior completion state |
| `briefing_read` | Text briefing explicitly opened | Entry screen |
| `learning_answer` | Optional answer selected | Question ID, correct/incorrect; no free text |
| `cta_click` | Primary outbound action | CTA ID, destination category, approved attribution |
| `share_action` | Share invoked or link copied | Method; do not claim a completed social post |
| `app_error` | Actionable failure | Sanitized error code and app version |

Emit completion once per run. Use a session-scoped random identifier if needed; avoid persistent cross-site identity. Analytics failure or refusal must never prevent gameplay or navigation. Consent behavior must match the selected analytics service and deployment requirements.

### Definitions

- **Start rate:** unique sessions starting a run / valid landing sessions.
- **Completion rate:** unique starting sessions completing at least one run / unique starting sessions.
- **Retry rate:** completing sessions beginning another run / completing sessions.
- **CTA rate:** unique sessions clicking the CTA / valid landing sessions; also report among completing sessions.
- **Qualified acquisition:** a downstream action defined by the owner, such as confirmed newsletter signup. An outbound click alone is not a qualified lead.
- **Acquisition cost:** allocated tools, hosting, production, and promotion costs / attributable qualified acquisitions. Report cash and owner labor separately.

### Provisional pilot thresholds

These are internal decision thresholds, not industry benchmarks or forecasts:

- Observe at least five first-time usability sessions before public launch; resolve recurring control misunderstandings.
- Seek at least 100 unique starting sessions before interpreting the public pilot, recognizing that small samples remain directional.
- Initial targets: 70% session-level completion, 20% retry among completing sessions, and 5% CTA clicks among completing sessions.
- Compare qualified acquisition cost and audience quality with the owner's existing campaign baseline; establish the acceptable cost before promotion.
- Check whether comprehension improves using the optional question and qualitative interviews; question responses alone are subject to selection bias.

If reach is insufficient, treat the acquisition hypothesis as unresolved. Do not attribute differences to the game without considering traffic source and audience. A later test can compare matched social posts linking to the game versus the existing briefing destination.

## 15. Technical approach

### Recommended implementation

- TypeScript with Phaser for the game scene and HTML/CSS for accessible UI.
- Vite or equivalent static build tooling.
- Custom track-constrained arcade movement rather than general-purpose rigid-body coaster physics.
- Bundled content and track configurations; no remote dependency required to complete a run.
- Local storage for preferences and versioned personal bests, with in-memory fallback.
- Static hosting with HTTPS, compression, caching, preview deployment, and rollback support.
- Optional lightweight analytics integration, selected only after reviewing cost and privacy behavior.

These are implementation defaults, not reasons to block an equivalent simpler solution. Confirm package compatibility at implementation time.

### Logical components

1. Content loader and validator.
2. Run state machine: introduction → countdown → running ↔ paused → results.
3. Track and object layout system.
4. Fixed-step movement, input abstraction, and collisions.
5. Editorial chapter scheduler using active run time.
6. HTML HUD, menus, briefing, and conversion UI.
7. Local persistence, sharing, and optional analytics adapters.

### Performance and browser targets

- Primary: current iOS Safari and Android Chrome on representative midrange phones.
- Secondary: current desktop Chrome, Edge, Firefox, and Safari where available for testing.
- Smoke-test the actual X in-app browser on an available iOS or Android device; provide an external-browser suggestion if needed.
- Aim for 60 FPS, with stable play at 30 FPS on the selected reference phone.
- Target initial compressed transfer at or below 3 MB and playable introduction within 3 seconds on a representative fast-4G test. Record conditions and actual results.
- Lazy-load nonessential audio/imagery; avoid external font dependency where practical.
- Unsupported graphics capability yields a readable briefing with the CTA rather than a blank screen.

## 16. Reliability, privacy, and content safety

- Clear errors and text-briefing fallback for missing or invalid campaign content.
- Disabled local storage must not break play or restart.
- Share cancellation, blocked clipboard access, analytics blocking, and audio autoplay restrictions fail gracefully.
- No secrets, API credentials, or private campaign material in the shipped bundle.
- Treat all content and URL parameters as untrusted input; validate IDs and allowlisted attribution fields.
- External links use safe navigation behavior; source links never execute arbitrary schemes.
- Avoid collecting personal or sensitive financial information.
- Use original or appropriately licensed visuals, audio, market excerpts, and branding; retain asset attribution records.
- Market claims and editorial approval are publication requirements, not reasons to introduce trading functions or elaborate compliance flows into gameplay.

## 17. Acceptance criteria

| Area | MVP acceptance |
| --- | --- |
| Entry | A campaign link opens a dated briefing with Start and text access; no account required |
| Run | Timer counts 60 seconds of active simulation; pauses do not consume time |
| Movement | Slopes affect speed; minimum and maximum speeds hold; terrain never runs out |
| Rails | Intentional input moves one adjacent lane; transitions and collisions are consistent |
| Controls | Keyboard and simultaneous mobile touch work; releasing/cancelling inputs clears state |
| Boost/brake | Meter bounds hold; boost depletes; braking provides a demonstrated useful choice |
| Objects | Pickups award the configured benefit once; hazards apply one hit per invulnerability window |
| Fairness | Course review confirms a reachable safe route and adequate preview at intended maximum speed |
| Briefing | Three chapters show without blocking critical decisions; debrief conveys the approved thesis |
| Integrity | Dates/cutoff visible; hypothetical content labeled; arcade score never presented as investment return |
| Results | Closing transition, score breakdown, local best, retry, share, and primary CTA work |
| Restart | A fresh run has no stale objects, timer, input, score, or boost state |
| Persistence | Best score is version-scoped; unavailable storage falls back safely |
| Attribution | Approved campaign parameters reach supported CTA tracking; unrelated query content is excluded |
| Analytics | Defined events are validated without duplicates or personal data; game works when analytics is blocked |
| Accessibility | Text briefing and CTA usable by keyboard; focus visible; mute/reduced-motion options work |
| Mobile | No essential control overlap or page scrolling during active control on reference devices |
| Failure | Visibility loss pauses; unavailable graphics shows briefing; share/audio failures do not interrupt play |
| Publishing | Approved preview, production smoke test, and rollback artifact exist |

## 18. Verification strategy

- Focus automated tests on meaningful state and data risks: content validation, timer/pause behavior, score/persistence versioning, boost bounds, collision invulnerability, and restart reset.
- Use seeded/fixed fixtures for gameplay verification; avoid tests that merely restate configuration values.
- Manually play the full course at low and high speeds and inspect difficult rail transitions on portrait mobile.
- Test pointer cancellation, simultaneous touches, tab switching, orientation change, blocked storage, muted audio, and reduced motion.
- Verify CTA URLs and attribution with a nonproduction test destination before launch.
- Inspect analytics payloads and event counts across start, pause, finish, retry, share cancellation, and direct text access.
- Capture reference screenshots and performance results on available devices; record gaps rather than claiming untested support.
- Owner reviews the complete briefing separately from technical QA.

## 19. Delivery plan and exit gates

No delivery date is committed before the first playable handling test. Work proceeds in small reviewable milestones.

| Milestone | Deliverable | Exit gate |
| --- | --- | --- |
| 1. Playable core | Fixed track, three rails, keyboard, boost/brake, pickups/hazards, timer, restart | Owner can complete and voluntarily retry; core handling approved |
| 2. Mobile experience | Touch controls, responsive layout, pause/focus behavior | Reference-phone run completes without control or layout failures |
| 3. Playable briefing | Campaign config, captions, labels, debrief, CTA | Owner approves editorial accuracy and clarity |
| 4. Acquisition layer | Attribution, sharing metadata, local bests, analytics | End-to-end events and outbound flow verified |
| 5. Pilot release | Performance pass, accessibility/fallbacks, deployment package | Acceptance criteria met; owner approves public release |
| 6. Evaluation | Pilot observations and conversion report | Decide iterate, expand, or stop based on evidence |

## 20. Budget and operating model

- Development approach: owner plus one existing AI coding subscription; no paid contractor assumed.
- A second coding subscription is optional and requires a demonstrated bottleneck, not a baseline dependency.
- No model API or market-data API calls in the product.
- Use original/simple vector art and properly licensed free assets where suitable.
- Target zero incremental recurring infrastructure cost for the pilot using an appropriate static-hosting allowance; availability and limits must be checked before choosing a host.
- A custom domain and paid analytics are optional; use the hosting URL and minimal measurement initially if necessary.
- Track owner hours, subscription allocation, hosting, assets, and paid promotion separately.
- Do not purchase paid services or enable overage billing as an implementation assumption.

The product has no direct revenue target in MVP. Sustainability means demonstrable marketing value with manageable editorial and maintenance effort. Free infrastructure allowances are not a promise of permanent free operation.

## 21. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Fun game, weak brand conversion | Strong thematic debrief, one relevant CTA, measure downstream quality |
| Too much text during play | Short captions, safe presentation windows, detail after play |
| Fast descents imply falling markets are financially beneficial | Separate driving skill from market interpretation and avoid currency scoring |
| Hypothetical path mistaken for forecast or history | Persistent chapter classification and explicit scenario framing |
| Mobile controls obscure hazards | Portrait-first layout and early physical-device testing |
| Repeated play harms learning or conversion | Keep CTA accessible; inspect retries and conversions together |
| Daily publishing becomes a burden | One campaign pilot, reusable template, measured second-brief preparation |
| AI-generated changes introduce regressions | Small milestones, version control, targeted verification and owner playtests |
| Old shared links imply current analysis | Stable dated briefing IDs and visible coverage cutoff |
| Low traffic produces misleading conclusions | Report sample sizes and uncertainty; avoid premature expansion |
| Third-party service cost creep | Static architecture, optional analytics, no runtime AI or live feeds |

## 22. Owner decisions and launch dependencies

The following do not block core gameplay prototyping, but must be resolved before the applicable publication step:

1. Final brand name, logo, colors, and public product title.
2. Primary CTA destination and definition of a qualified acquisition.
3. Approval of first briefing facts, sources, date/cutoff, and hypothetical ending.
4. Hosting destination and whether a custom domain is necessary.
5. Analytics choice, consent behavior, and downstream conversion visibility.
6. Available reference mobile devices and initial usability testers.
7. Existing campaign conversion baseline and acceptable acquisition cost.

## 23. Post-MVP candidates

Consider only after pilot evidence: additional campaign courses, alternate scenario paths, personalized result images, daily challenge archive, input remapping, gamepad support, personal ghosts, and a lightweight authoring interface. Automated historical/live market feeds, accounts, and public competitive systems require a separate product and operating-cost decision.

## 24. Definition of MVP completion

The MVP is complete when a new visitor can follow a campaign link, understand the controls, finish a fair 60-second run on the supported mobile or desktop browser, read an accurate and clearly dated briefing, retry or share, and follow the primary CTA; the owner can publish a second briefing through the documented content workflow; and the pilot can measure the acquisition funnel without a gameplay dependency on paid infrastructure.
