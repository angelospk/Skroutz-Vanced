<svelte:options css="injected" />

<script lang="ts">
  import { onMount } from 'svelte';
  import { DEFAULT_SETTINGS, loadSettings, PERIOD_LABEL, settingsItem, type Settings } from '../lib/settings';
  import type { Period } from '../lib/types';

  let s = $state<Settings>({ ...DEFAULT_SETTINGS });
  let ready = $state(false);
  let saved = $state(false);

  onMount(async () => {
    s = await loadSettings();
    ready = true;
  });

  async function save() {
    await settingsItem.setValue($state.snapshot(s));
    saved = true;
    setTimeout(() => (saved = false), 1200);
  }

  async function reset() {
    s = { ...DEFAULT_SETTINGS };
    await save();
  }

  const periods = Object.keys(PERIOD_LABEL) as Period[];
</script>

{#if ready}
  <form class="sv-settings" onchange={save} onsubmit={(e) => e.preventDefault()}>
    <h1>Skroutz Vanced</h1>

    <fieldset>
      <legend>Μπάρες τιμής</legend>
      <label>Περίοδος ιστορικού
        <select bind:value={s.period}>
          {#each periods as p}<option value={p}>{PERIOD_LABEL[p]}</option>{/each}
        </select>
      </label>
      <label class="chk"><input type="checkbox" bind:checked={s.showHistoryBar} /> Μπάρα ιστορικού (τωρινή τιμή σε σχέση με ελάχιστη/τυπική/μέση)</label>
      <label class="chk"><input type="checkbox" bind:checked={s.showMarketBar} /> Μπάρα αγοράς στα καταστήματα (σε σχέση με τη φθηνότερη τιμή)</label>
      <label>Κόκκινο όταν η τιμή είναι πάνω από τη φθηνότερη κατά <b>{s.marketRedPct}%</b>
        <input type="range" min="5" max="50" step="5" bind:value={s.marketRedPct} />
      </label>
      <label>Διάγραμμα
        <select bind:value={s.chart}>
          <option value="click">Με κλικ</option>
          <option value="never">Ποτέ</option>
        </select>
      </label>
    </fieldset>

    <fieldset>
      <legend>Σελίδες</legend>
      <label class="chk"><input type="checkbox" bind:checked={s.hideSponsored} /> Κρύψε τα sponsored προϊόντα</label>
      <label>Σάρωση έως <b>{s.scanMaxPages}</b> σελίδες
        <input type="range" min="1" max="50" step="1" bind:value={s.scanMaxPages} />
      </label>
      <label>Αιτήματα ανά δευτερόλεπτο: <b>{s.requestsPerSecond}</b>
        <input type="range" min="0.5" max="2" step="0.5" bind:value={s.requestsPerSecond} />
        <small>Πάνω από ~1/δευτ. το Skroutz μπορεί να σε μπλοκάρει προσωρινά.</small>
      </label>
    </fieldset>

    <fieldset>
      <legend>Καλάθι</legend>
      <label class="chk"><input type="checkbox" bind:checked={s.includeOffsite} /> Μέτρα και καταστήματα εκτός καλαθιού Skroutz</label>
      <label>Εναλλακτικές: ελάχιστη βαθμολογία <b>{s.altMinReviewScore}</b>
        <input type="range" min="0" max="5" step="0.5" bind:value={s.altMinReviewScore} />
      </label>
      <label>Εναλλακτικές: τουλάχιστον <b>{s.altMinReviews}</b> κριτικές
        <input type="range" min="0" max="100" step="5" bind:value={s.altMinReviews} />
      </label>
    </fieldset>

    <div class="foot">
      <button type="button" onclick={reset}>Επαναφορά</button>
      {#if saved}<span class="ok">Αποθηκεύτηκε</span>{/if}
    </div>
  </form>
{/if}

<style>
  .sv-settings {
    width: 340px;
    padding: 12px;
    font: 13px/1.4 system-ui, sans-serif;
    color: #222;
  }
  h1 {
    font-size: 16px;
    margin: 0 0 8px;
    color: #f68b24;
  }
  fieldset {
    border: 1px solid #eee;
    border-radius: 8px;
    margin: 0 0 10px;
    padding: 6px 10px 8px;
    display: grid;
    gap: 6px;
  }
  legend {
    font-weight: 700;
    padding: 0 4px;
  }
  label {
    display: grid;
    gap: 2px;
  }
  label.chk {
    display: flex;
    gap: 6px;
    align-items: flex-start;
  }
  input[type='range'] {
    accent-color: #f68b24;
  }
  .foot {
    display: flex;
    gap: 10px;
    align-items: center;
  }
  .ok {
    color: #1e8e3e;
  }
  small {
    color: #888;
  }
</style>
