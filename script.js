const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAYS_FULL = {
  Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday',
  Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday'
};
const SLOTS_PER_DAY = 48;

/* ---------- State ---------- */
const state = {
  selected: {},
  bonusDays: new Set(['Sat', 'Sun']),
  activeDay: 'Mon'
};
DAYS.forEach(d => state.selected[d] = new Set());

function isSelected(day, slot) { return state.selected[day].has(slot); }
function isBonus(day) { return state.bonusDays.has(day); }

function formatTime(slotIdx) {
  const h = Math.floor(slotIdx / 2);
  const m = slotIdx % 2 === 0 ? '00' : '30';
  return String(h).padStart(2, '0') + ':' + m;
}

/* ---------- Build desktop table ---------- */
const headerRow = document.getElementById('header-row');
const timeHead = document.createElement('th');
timeHead.textContent = 'Time';
headerRow.appendChild(timeHead);

DAYS.forEach(day => {
  const th = document.createElement('th');
  th.textContent = day;
  th.dataset.day = day;
  if (isBonus(day)) th.classList.add('bonus');
  th.addEventListener('click', () => setBonus(day, !isBonus(day)));
  headerRow.appendChild(th);
});

const tbody = document.getElementById('body');
for (let i = 0; i < SLOTS_PER_DAY; i++) {
  const tr = document.createElement('tr');
  if (i % 2 === 1) tr.classList.add('hour-mark');

  const timeTd = document.createElement('td');
  timeTd.classList.add('time-label');
  if (i % 2 === 0) {
    timeTd.textContent = formatTime(i);
  } else {
    timeTd.classList.add('half');
    timeTd.textContent = ':30';
  }
  tr.appendChild(timeTd);

  DAYS.forEach(day => {
    const td = document.createElement('td');
    td.classList.add('slot');
    td.dataset.day = day;
    td.dataset.slot = i;
    if (isBonus(day)) td.classList.add('bonus-col');
    tr.appendChild(td);
  });
  tbody.appendChild(tr);
}

/* ---------- Build mobile day chips ---------- */
const dayChipsContainer = document.getElementById('day-chips');
DAYS.forEach(day => {
  const chip = document.createElement('button');
  chip.className = 'day-chip';
  chip.dataset.day = day;
  chip.textContent = day;
  if (isBonus(day)) chip.classList.add('bonus');
  if (day === state.activeDay) chip.classList.add('active');
  chip.addEventListener('click', () => setActiveDay(day));
  dayChipsContainer.appendChild(chip);
});

/* ---------- Render mobile slots for active day ---------- */
const mobileSlotsContainer = document.getElementById('mobile-slots');

function renderMobileSlots() {
  mobileSlotsContainer.innerHTML = '';
  const day = state.activeDay;
  for (let i = 0; i < SLOTS_PER_DAY; i++) {
    const slot = document.createElement('div');
    slot.className = 'mobile-slot';
    slot.dataset.slot = i;
    if (isSelected(day, i)) slot.classList.add('selected');
    if (isBonus(day)) slot.classList.add('bonus-col');
    slot.innerHTML = `<span>${formatTime(i)}</span>`;
    mobileSlotsContainer.appendChild(slot);
  }
  // Refresh scrollbar after the slots re-render (scrollTop resets to 0)
  if (typeof updateScrollbar === 'function') {
    requestAnimationFrame(updateScrollbar);
  }
}

/* ---------- Custom scrollbar for mobile slots ---------- */
const trackEl = document.getElementById('scrollbar-track');
const progressEl = document.getElementById('scrollbar-progress');
const thumbEl = document.getElementById('scrollbar-thumb');
const THUMB_SIZE = 14;

function updateScrollbar() {
  const slots = mobileSlotsContainer;
  const scrollMax = slots.scrollHeight - slots.clientHeight;
  if (scrollMax <= 0) {
    thumbEl.style.top = '0px';
    progressEl.style.height = '0px';
    return;
  }
  const ratio = Math.max(0, Math.min(1, slots.scrollTop / scrollMax));
  const trackH = trackEl.clientHeight;
  const travel = Math.max(0, trackH - THUMB_SIZE);
  const thumbTop = ratio * travel;
  thumbEl.style.top = thumbTop + 'px';
  progressEl.style.height = (thumbTop + THUMB_SIZE / 2) + 'px';
}

mobileSlotsContainer.addEventListener('scroll', updateScrollbar, { passive: true });
window.addEventListener('resize', updateScrollbar);

/* Drag the thumb to scroll the list */
let scrollDrag = null;

thumbEl.addEventListener('pointerdown', e => {
  e.preventDefault();
  e.stopPropagation();
  try { thumbEl.setPointerCapture(e.pointerId); } catch (err) {}
  thumbEl.classList.add('dragging');
  scrollDrag = {
    startY: e.clientY,
    startScroll: mobileSlotsContainer.scrollTop,
    trackH: trackEl.clientHeight,
    scrollMax: mobileSlotsContainer.scrollHeight - mobileSlotsContainer.clientHeight
  };
});

thumbEl.addEventListener('pointermove', e => {
  if (!scrollDrag) return;
  const dy = e.clientY - scrollDrag.startY;
  const travel = Math.max(1, scrollDrag.trackH - THUMB_SIZE);
  const dScroll = (dy / travel) * scrollDrag.scrollMax;
  const next = Math.max(0, Math.min(scrollDrag.scrollMax, scrollDrag.startScroll + dScroll));
  mobileSlotsContainer.scrollTop = next;
});

function endScrollDrag(e) {
  if (!scrollDrag) return;
  try { thumbEl.releasePointerCapture(e.pointerId); } catch (err) {}
  thumbEl.classList.remove('dragging');
  scrollDrag = null;
}
thumbEl.addEventListener('pointerup', endScrollDrag);
thumbEl.addEventListener('pointercancel', endScrollDrag);

/* ---------- Mutators: sync both views ---------- */
function setSelected(day, slot, value) {
  if (value) state.selected[day].add(slot);
  else state.selected[day].delete(slot);

  const tdDesktop = document.querySelector(
    `td.slot[data-day="${day}"][data-slot="${slot}"]`
  );
  if (tdDesktop) tdDesktop.classList.toggle('selected', value);

  if (day === state.activeDay) {
    const mSlot = mobileSlotsContainer.querySelector(`.mobile-slot[data-slot="${slot}"]`);
    if (mSlot) mSlot.classList.toggle('selected', value);
  }
  updateTotals();
}

function setBonus(day, value) {
  if (value) state.bonusDays.add(day);
  else state.bonusDays.delete(day);

  // Desktop header
  const th = document.querySelector(`thead th[data-day="${day}"]`);
  if (th) th.classList.toggle('bonus', value);
  // Desktop column tint
  document.querySelectorAll(`td.slot[data-day="${day}"]`).forEach(td => {
    td.classList.toggle('bonus-col', value);
  });
  // Mobile chip
  const chip = dayChipsContainer.querySelector(`.day-chip[data-day="${day}"]`);
  if (chip) chip.classList.toggle('bonus', value);
  // Mobile active-day bar + slots
  if (day === state.activeDay) {
    document.getElementById('bonus-toggle-mobile').classList.toggle('active', value);
    mobileSlotsContainer.querySelectorAll('.mobile-slot').forEach(s => {
      s.classList.toggle('bonus-col', value);
    });
  }
  updateTotals();
}

function setActiveDay(day) {
  state.activeDay = day;
  dayChipsContainer.querySelectorAll('.day-chip').forEach(c => {
    c.classList.toggle('active', c.dataset.day === day);
  });
  document.getElementById('active-day-name').textContent = DAYS_FULL[day];
  document.getElementById('bonus-toggle-mobile').classList.toggle('active', isBonus(day));
  renderMobileSlots();
  updateTotals();
}

/* ---------- Bonus toggle button (mobile) ---------- */
document.getElementById('bonus-toggle-mobile').addEventListener('click', () => {
  setBonus(state.activeDay, !isBonus(state.activeDay));
});

/* ---------- Drag selection (desktop table) ---------- */
let isDragging = false;
let dragMode = null;

function dragApply(td) {
  if (!td) return;
  const day = td.dataset.day;
  const slot = parseInt(td.dataset.slot, 10);
  setSelected(day, slot, dragMode === 'add');
}

tbody.addEventListener('mousedown', e => {
  const td = e.target.closest('td.slot');
  if (!td) return;
  e.preventDefault();
  isDragging = true;
  const day = td.dataset.day;
  const slot = parseInt(td.dataset.slot, 10);
  dragMode = isSelected(day, slot) ? 'remove' : 'add';
  dragApply(td);
});

tbody.addEventListener('mouseover', e => {
  if (!isDragging) return;
  dragApply(e.target.closest('td.slot'));
});

document.addEventListener('mouseup', () => {
  isDragging = false;
  dragMode = null;
});

/* ---------- Touch selection (desktop AND mobile share via elementFromPoint) ---------- */
function attachTouchSelection(container, slotSelector, getDaySlot) {
  container.addEventListener('touchstart', e => {
    const target = e.target.closest(slotSelector);
    if (!target) return;
    e.preventDefault();
    const { day, slot } = getDaySlot(target);
    dragMode = isSelected(day, slot) ? 'remove' : 'add';
    isDragging = true;
    setSelected(day, slot, dragMode === 'add');
  }, { passive: false });

  container.addEventListener('touchmove', e => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const target = el && el.closest && el.closest(slotSelector);
    if (!target) return;
    e.preventDefault();
    const { day, slot } = getDaySlot(target);
    setSelected(day, slot, dragMode === 'add');
  }, { passive: false });
}

attachTouchSelection(tbody, 'td.slot', td => ({
  day: td.dataset.day,
  slot: parseInt(td.dataset.slot, 10)
}));

attachTouchSelection(mobileSlotsContainer, '.mobile-slot', s => ({
  day: state.activeDay,
  slot: parseInt(s.dataset.slot, 10)
}));

document.addEventListener('touchend', () => {
  isDragging = false;
  dragMode = null;
});

/* ---------- Mobile tap-to-toggle (covers single taps that don't trigger touchmove) ---------- */
// touchstart already toggles, so we don't need an extra click handler.
// But add a fallback click handler for non-touch mobile (rare) / accessibility.
mobileSlotsContainer.addEventListener('click', e => {
  const target = e.target.closest('.mobile-slot');
  if (!target) return;
  // If a touch already handled it, the state is already updated. Detect by
  // checking whether this click was synthesized from touch (best-effort skip).
  if (e.detail === 0) return; // synthesized from touch — skip
  const slot = parseInt(target.dataset.slot, 10);
  setSelected(state.activeDay, slot, !isSelected(state.activeDay, slot));
});

/* ---------- Totals ---------- */
function updateTotals() {
  let weekday = 0, bonus = 0;
  DAYS.forEach(day => {
    const hrs = state.selected[day].size * 0.5;
    if (isBonus(day)) bonus += hrs;
    else weekday += hrs;
  });
  document.getElementById('weekday-total').textContent = weekday.toFixed(1);
  document.getElementById('bonus-total').textContent = bonus.toFixed(1);
  document.getElementById('grand-total').textContent = (weekday + bonus).toFixed(1);

  const activeHrs = state.selected[state.activeDay].size * 0.5;
  document.getElementById('active-day-hours').textContent = activeHrs.toFixed(1);
}

/* ---------- Format selected ranges per day ---------- */
function getRanges(day) {
  const slots = [...state.selected[day]].sort((a, b) => a - b);
  if (slots.length === 0) return [];
  const ranges = [];
  let start = slots[0], prev = slots[0];
  for (let i = 1; i < slots.length; i++) {
    if (slots[i] === prev + 1) prev = slots[i];
    else { ranges.push([start, prev]); start = slots[i]; prev = slots[i]; }
  }
  ranges.push([start, prev]);
  return ranges.map(([s, e]) => `${formatTime(s)}\u2013${formatTime(e + 1)}`);
}

/* ---------- Save / Output ---------- */
const saveBtn = document.getElementById('save-btn');
const output = document.getElementById('output');
const outputText = document.getElementById('output-text');
const copyStatus = document.getElementById('copy-status');
const detailedToggle = document.getElementById('detailed-toggle');

saveBtn.addEventListener('click', async () => {
  let weekday = 0, bonus = 0;
  DAYS.forEach(day => {
    const hrs = state.selected[day].size * 0.5;
    if (isBonus(day)) bonus += hrs;
    else weekday += hrs;
  });

  const lines = [];
  lines.push('===================================');
  lines.push('  WORK HOURS \u2014 WEEKLY SUMMARY');
  lines.push('  ' + new Date().toLocaleDateString(undefined, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  }));
  lines.push('===================================');
  lines.push('');

  if (detailedToggle.checked) {
    lines.push('PER-DAY BREAKDOWN');
    lines.push('-----------------------------------');
    let anyLogged = false;
    DAYS.forEach(day => {
      const hrs = state.selected[day].size * 0.5;
      if (hrs === 0) return;
      anyLogged = true;
      const flag = isBonus(day) ? ' \u2605 bonus' : '';
      lines.push(`${day}${flag}: ${hrs.toFixed(1)} hrs`);
      getRanges(day).forEach(r => lines.push(`   \u2022 ${r}`));
    });
    if (!anyLogged) lines.push('No hours logged.');
    lines.push('');
  }

  lines.push('TOTALS');
  lines.push('-----------------------------------');
  lines.push(`Weekday hours : ${weekday.toFixed(1)}`);
  lines.push(`Bonus hours   : ${bonus.toFixed(1)}`);
  lines.push(`Grand total   : ${(weekday + bonus).toFixed(1)}`);
  lines.push('');
  lines.push('===================================');

  const text = lines.join('\n');
  outputText.value = text;
  output.classList.add('visible');

  try {
    await navigator.clipboard.writeText(text);
    copyStatus.textContent = 'Copied to clipboard';
    copyStatus.classList.add('shown');
    setTimeout(() => copyStatus.classList.remove('shown'), 2200);
  } catch (err) {
    outputText.select();
    copyStatus.textContent = 'Select & copy manually';
    copyStatus.classList.add('shown');
  }

  output.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

/* ---------- Init ---------- */
renderMobileSlots();
setActiveDay('Mon');
updateTotals();