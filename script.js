const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const SLOTS_PER_DAY = 48;

const bonusDays = new Set(['Sat', 'Sun']);
const selected = {};
DAYS.forEach(d => selected[d] = new Set());

/* ---------- Build header ---------- */
const headerRow = document.getElementById('header-row');
const timeHead = document.createElement('th');
timeHead.textContent = 'Time';
headerRow.appendChild(timeHead);

DAYS.forEach(day => {
  const th = document.createElement('th');
  th.textContent = day;
  th.dataset.day = day;
  if (bonusDays.has(day)) th.classList.add('bonus');
  th.addEventListener('click', () => toggleBonus(day, th));
  headerRow.appendChild(th);
});

/* ---------- Build body ---------- */
const body = document.getElementById('body');

function formatTime(slotIdx) {
  const h = Math.floor(slotIdx / 2);
  const m = slotIdx % 2 === 0 ? '00' : '30';
  return String(h).padStart(2, '0') + ':' + m;
}

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
    if (bonusDays.has(day)) td.classList.add('bonus-col');
    tr.appendChild(td);
  });

  body.appendChild(tr);
}

/* ---------- Drag selection ---------- */
let isDragging = false;
let dragMode = null; // 'add' or 'remove'

function applyToCell(td) {
  const day = td.dataset.day;
  const slot = parseInt(td.dataset.slot, 10);
  if (dragMode === 'add') {
    selected[day].add(slot);
    td.classList.add('selected');
  } else {
    selected[day].delete(slot);
    td.classList.remove('selected');
  }
}

body.addEventListener('mousedown', e => {
  const td = e.target.closest('td.slot');
  if (!td) return;
  e.preventDefault();
  isDragging = true;
  const day = td.dataset.day;
  const slot = parseInt(td.dataset.slot, 10);
  dragMode = selected[day].has(slot) ? 'remove' : 'add';
  applyToCell(td);
  updateTotals();
});

body.addEventListener('mouseover', e => {
  if (!isDragging) return;
  const td = e.target.closest('td.slot');
  if (!td) return;
  applyToCell(td);
  updateTotals();
});

document.addEventListener('mouseup', () => {
  isDragging = false;
  dragMode = null;
});

// Touch support
body.addEventListener('touchstart', e => {
  const td = e.target.closest('td.slot');
  if (!td) return;
  e.preventDefault();
  const day = td.dataset.day;
  const slot = parseInt(td.dataset.slot, 10);
  dragMode = selected[day].has(slot) ? 'remove' : 'add';
  isDragging = true;
  applyToCell(td);
  updateTotals();
}, { passive: false });

body.addEventListener('touchmove', e => {
  if (!isDragging) return;
  const touch = e.touches[0];
  const el = document.elementFromPoint(touch.clientX, touch.clientY);
  const td = el && el.closest && el.closest('td.slot');
  if (!td) return;
  e.preventDefault();
  applyToCell(td);
  updateTotals();
}, { passive: false });

document.addEventListener('touchend', () => {
  isDragging = false;
  dragMode = null;
});

/* ---------- Bonus toggle ---------- */
function toggleBonus(day, th) {
  if (bonusDays.has(day)) {
    bonusDays.delete(day);
    th.classList.remove('bonus');
  } else {
    bonusDays.add(day);
    th.classList.add('bonus');
  }
  document.querySelectorAll(`td.slot[data-day="${day}"]`).forEach(td => {
    td.classList.toggle('bonus-col', bonusDays.has(day));
  });
  updateTotals();
}

/* ---------- Totals ---------- */
function updateTotals() {
  let weekday = 0, bonus = 0;
  DAYS.forEach(day => {
    const hrs = selected[day].size * 0.5;
    if (bonusDays.has(day)) bonus += hrs;
    else weekday += hrs;
  });
  document.getElementById('weekday-total').textContent = weekday.toFixed(1);
  document.getElementById('bonus-total').textContent = bonus.toFixed(1);
  document.getElementById('grand-total').textContent = (weekday + bonus).toFixed(1);
}

/* ---------- Format selected ranges per day ---------- */
function getRanges(day) {
  const slots = [...selected[day]].sort((a, b) => a - b);
  if (slots.length === 0) return [];
  const ranges = [];
  let start = slots[0], prev = slots[0];
  for (let i = 1; i < slots.length; i++) {
    if (slots[i] === prev + 1) {
      prev = slots[i];
    } else {
      ranges.push([start, prev]);
      start = slots[i];
      prev = slots[i];
    }
  }
  ranges.push([start, prev]);
  return ranges.map(([s, e]) => `${formatTime(s)}–${formatTime(e + 1)}`);
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
    const hrs = selected[day].size * 0.5;
    if (bonusDays.has(day)) bonus += hrs;
    else weekday += hrs;
  });

  const lines = [];
  lines.push('═══════════════════════════════════');
  lines.push('  WORK HOURS — WEEKLY SUMMARY');
  lines.push('  ' + new Date().toLocaleDateString(undefined, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  }));
  lines.push('═══════════════════════════════════');
  lines.push('');

  if (detailedToggle.checked) {
    lines.push('PER-DAY BREAKDOWN');
    lines.push('-----------------------------------');
    let anyLogged = false;
    DAYS.forEach(day => {
      const hrs = selected[day].size * 0.5;
      if (hrs === 0) return;
      anyLogged = true;
      const flag = bonusDays.has(day) ? ' ★ bonus' : '';
      lines.push(`${day}${flag}: ${hrs.toFixed(1)} hrs`);
      getRanges(day).forEach(r => lines.push(`   • ${r}`));
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
  lines.push('═══════════════════════════════════');

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

updateTotals();
