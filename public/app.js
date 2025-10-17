// public/app.js

const runBtn = document.getElementById('runDemo');
const logArea = document.getElementById('logArea');
const createTopicBtn = document.getElementById('createTopic');
const submitReportBtn = document.getElementById('submitReport');
const createTokenBtn = document.getElementById('createToken');
// quick sell modal trigger button
const sellOffsetsBtn = document.getElementById('sellOffsetsBtn');
const reportTopicIdInput = document.getElementById('reportTopicId');
const retireTokenIdInput = document.getElementById('retireTokenId');
const retireAmountInput = document.getElementById('retireAmount');
const buyerAccountInput = document.getElementById('buyerAccountId');

runBtn.addEventListener('click', async function () {
  logArea.textContent += "\nRequesting server to start demo...\n";
  try {
    const resp = await fetch('/run-demo', { method: 'POST' });
    const json = await resp.json();
    if (json.started) {
      logArea.textContent += 'Demo started on server. Streaming logs...\n';
    } else {
      logArea.textContent += 'Server failed to start demo.\n';
    }
  } catch (err) {
    logArea.textContent += `Error contacting server: ${err}\n`;
  }
});

// connect to SSE
function connectSSE() {
  const es = new EventSource('/events');
  es.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      const time = new Date().toLocaleTimeString();
      logArea.textContent += `[${time}] ${data.level.toUpperCase()}: ${data.text}`;
    } catch (err) {
      logArea.textContent += `\n${e.data}\n`;
    }
    logArea.scrollTop = logArea.scrollHeight;
  };
  es.onerror = () => {
    logArea.textContent += '\nSSE connection lost. Reconnecting in 3s...\n';
    es.close();
    setTimeout(connectSSE, 3000);
  };
}

connectSSE();

// Poll server status
const statusEl = document.getElementById('serverStatus');
async function pollStatus() {
  try {
    const r = await fetch('/status');
    const j = await r.json();
    statusEl.textContent = j.busy ? 'Busy' : 'Idle';
  const disabled = !!j.busy;
  // disable interactive controls while server is busy
  [runBtn, createTopicBtn, submitReportBtn, createTokenBtn, sellOffsetsBtn].forEach(b => { if (b) b.disabled = disabled; });
  } catch (err) {
    statusEl.textContent = 'Offline';
  }
}
setInterval(pollStatus, 2000);
pollStatus();

createTopicBtn.addEventListener('click', async () => {
  try {
    const r = await fetch('/create-topic', { method: 'POST' });
    const j = await r.json();
    if (j.topicId) {
      logArea.textContent += `\nCreated topic: ${j.topicId}\n`;
    }
  } catch (err) {
    logArea.textContent += `\nError creating topic: ${err}\n`;
  }
});

createTokenBtn.addEventListener('click', async () => {
  try {
    const r = await fetch('/create-token', { method: 'POST' });
    const j = await r.json();
    if (j.tokenId) {
      logArea.textContent += `\nCreated token: ${j.tokenId}\n`;
    }
  } catch (err) {
    logArea.textContent += `\nError creating token: ${err}\n`;
  }
});

submitReportBtn.addEventListener('click', async () => {
  const topicId = reportTopicIdInput.value.trim();
  if (!topicId) {
    logArea.textContent += '\nPlease enter a topicId to submit to.\n';
    return;
  }
  const sample = {
    company: 'Eco-Tech Industries',
    scope1_tCO2e: 500,
    scope2_tCO2e: 250,
    verification_status: 'Verified OK',
    verifier_id: 'CertBodyXYZ',
  };
  try {
    const r = await fetch('/submit-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topicId, report: sample }),
    });
    const j = await r.json();
    if (j.consensusTimestamp) {
      logArea.textContent += `\nReport submitted. Consensus TS: ${j.consensusTimestamp}\n`;
    }
  } catch (err) {
    logArea.textContent += `\nError submitting report: ${err}\n`;
  }
});


// Quick Sell modal handler (id: sellOffsetsBtn)
const sellModal = document.getElementById('sellModal');
const modalTokenId = document.getElementById('modalTokenId');
const modalAmount = document.getElementById('modalAmount');
const modalBuyer = document.getElementById('modalBuyer');
const modalCancel = document.getElementById('modalCancel');
const modalConfirm = document.getElementById('modalConfirm');

if (sellOffsetsBtn && sellModal) {
  sellOffsetsBtn.addEventListener('click', () => {
    // show modal
    modalTokenId.value = document.getElementById('retireTokenId').value || '';
    modalAmount.value = document.getElementById('retireAmount').value || '';
    modalBuyer.value = document.getElementById('buyerAccountId').value || '';
    sellModal.style.display = 'flex';
  });

  modalCancel.addEventListener('click', () => {
    sellModal.style.display = 'none';
  });

  modalConfirm.addEventListener('click', async () => {
    const tokenId = modalTokenId.value.trim();
    const amount = modalAmount.value.trim();
    const buyerAccountId = modalBuyer.value.trim();
    if (!tokenId || !amount || !buyerAccountId) {
      const msgEl = document.getElementById('modalMessage');
      if (msgEl) { msgEl.textContent = 'All fields required'; msgEl.className = 'modalMessage error'; }
      return;
    }
    // Show spinner and disable confirm
    const spinner = document.getElementById('modalSpinner');
    modalConfirm.disabled = true;
    if (spinner) spinner.style.display = 'inline-block';
    // disable inputs in modal
    const modalInputs = [modalTokenId, modalAmount, modalBuyer, modalCancel];
    modalInputs.forEach(i => { if (i) i.disabled = true; });
    const msgEl = document.getElementById('modalMessage');
    if (msgEl) { msgEl.textContent = ''; msgEl.className = 'modalMessage'; }
    try {
      const r = await fetch('/sell-offsets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenId, amount, buyerAccountId }),
      });
      const j = await r.json();
      if (r.ok) {
        // Update UI with returned status and formatted treasury balance
        const balanceEl = document.getElementById('treasuryBalance');
        const statusEl = document.getElementById('lastTxStatus');
        let formattedBal = null;
        if (typeof j.treasuryBalance !== 'undefined') {
          // format with thousands separators and append token symbol
          const num = Number(j.treasuryBalance);
          if (Number.isFinite(num)) {
            formattedBal = num.toLocaleString('en-US');
            if (balanceEl) balanceEl.textContent = `${formattedBal} vCO2`;
            if (statusEl && typeof j.status !== 'undefined') statusEl.textContent = String(j.status);
          } else {
            if (balanceEl) balanceEl.textContent = String(j.treasuryBalance);
          }
        } else {
          if (statusEl && typeof j.status !== 'undefined') statusEl.textContent = String(j.status);
        }

        logArea.textContent += `\nSold ${amount} of ${tokenId} to ${buyerAccountId}. Status: ${j.status}\n`;
        if (msgEl) {
          const treasuryText = formattedBal ? ` Treasury: ${formattedBal} ` : '';
          // include token symbol with tooltip
          if (formattedBal) {
            msgEl.innerHTML = `Sold ${amount} — status ${j.status}.<span class=\"inlineTreasury\">${treasuryText}<span class=\"tokenSymbol\">vCO2<span class=\"tokenTooltip\">Verified Carbon Offset Token</span></span></span>`;
          } else {
            msgEl.textContent = `Sold ${amount} — status ${j.status}.`;
          }
          msgEl.className = 'modalMessage success';
        }
        // clear and re-enable inputs
        modalTokenId.value = '';
        modalAmount.value = '';
        modalBuyer.value = '';
        sellModal.style.display = 'none';
      } else {
        if (msgEl) { msgEl.textContent = `Error: ${j.error || 'unknown'}`; msgEl.className = 'modalMessage error'; }
        logArea.textContent += `\nSell failed: ${j.error || 'unknown'}\n`;
      }
    } catch (err) {
      if (msgEl) { msgEl.textContent = `Network error: ${err}`; msgEl.className = 'modalMessage error'; }
    } finally {
      // hide spinner and re-enable
      if (spinner) spinner.style.display = 'none';
      modalConfirm.disabled = false;
      // re-enable inputs
      const modalInputs2 = [modalTokenId, modalAmount, modalBuyer, modalCancel];
      modalInputs2.forEach(i => { if (i) i.disabled = false; });
    }
  });
}

// Tooltip toggling for info icon (vCO2)
document.addEventListener('click', (e) => {
  const info = e.target.closest('.infoIcon');
  const openTooltips = document.querySelectorAll('.infoTooltip');
  // close others
  openTooltips.forEach(t => { if (!t.contains(e.target) && !t.previousElementSibling?.contains(e.target)) t.style.display = 'none'; });
  if (info) {
    const tooltip = info.querySelector('.infoTooltip') || info.parentElement.querySelector('.infoTooltip');
    if (tooltip) {
      tooltip.style.display = (tooltip.style.display === 'block') ? 'none' : 'block';
      e.stopPropagation();
    }
  }
});

// close tooltips on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.infoTooltip').forEach(t => t.style.display = 'none');
  }
});

// About modal handlers
const aboutBtn = document.getElementById('aboutBtn');
const aboutModal = document.getElementById('aboutModal');
const aboutClose = document.getElementById('aboutClose');
if (aboutBtn && aboutModal) {
  aboutBtn.addEventListener('click', () => { aboutModal.style.display = 'flex'; aboutModal.setAttribute('aria-hidden','false'); });
}
if (aboutClose) {
  aboutClose.addEventListener('click', () => { aboutModal.style.display = 'none'; aboutModal.setAttribute('aria-hidden','true'); });
}
// close about modal on outside click
document.addEventListener('click', (e) => {
  if (aboutModal && aboutModal.style.display === 'flex' && !e.target.closest('#aboutModal .panel') && !e.target.closest('#aboutBtn')) {
    aboutModal.style.display = 'none'; aboutModal.setAttribute('aria-hidden','true');
  }
});
