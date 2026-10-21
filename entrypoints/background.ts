// One rate gate for every skroutz.gr tab: content scripts ask for a permit
// before each request and report 429 pauses here.
import { browser } from 'wxt/browser';
import { createGate } from '../lib/api';
import { loadSettings, settingsItem } from '../lib/settings';
import { intervalFor, type RateMessage } from '../lib/rate';

export default defineBackground(() => {
  const gate = createGate(1000);

  const applyRate = async () => gate.setInterval(intervalFor((await loadSettings()).requestsPerSecond));
  void applyRate();
  settingsItem.watch(() => void applyRate());

  // The service worker can be stopped; keep an active pause across restarts.
  // No permit is granted before the stored pause is loaded.
  let pauseUntil = 0;
  const ready = browser.storage.session
    .get('pauseUntil')
    .then((r) => {
      const stored = r.pauseUntil;
      if (typeof stored === 'number' && stored > Date.now()) {
        pauseUntil = stored;
        gate.pause(stored - Date.now());
      }
    })
    .catch(() => undefined);

  browser.runtime.onMessage.addListener((msg: RateMessage, _sender, sendResponse) => {
    if (msg?.type === 'sv:permit') {
      void ready.then(() => gate.wait()).then(() => sendResponse(true));
      return true; // answer asynchronously
    }
    if (msg?.type === 'sv:pause' && typeof msg.ms === 'number' && msg.ms > 0) {
      gate.pause(msg.ms);
      // Keep the latest deadline: a shorter pause never shortens a longer one.
      pauseUntil = Math.max(pauseUntil, Date.now() + msg.ms);
      void browser.storage.session.set({ pauseUntil });
    }
    return false;
  });
});
