let token = localStorage.getItem('accessor_token');
let logInterval = null;
let keyToRevokeId = null;
let keyToRevokeBtn = null;

function authHeaders() {
    return { 'Authorization': `Bearer ${token}` };
}

function statusBadge(code) {
    if (code === 429) return `<span class="status-badge status-limit">${code}</span>`;
    if (code >= 400) return `<span class="status-badge status-err">${code}</span>`;
    return `<span class="status-badge status-ok">${code}</span>`;
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    const icon = type === 'error' ? 'alert-circle' : 'check-circle';
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i data-lucide="${icon}"></i> <span>${message}</span>`;
    container.appendChild(toast);
    if (typeof lucide !== 'undefined') lucide.createIcons();
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function showModalMsg(prefix, msg, isError) {
    const box = document.getElementById(`${prefix}-msg`);
    if (!box) return;
    box.style.display = 'block';
    box.className = `form-msg ${isError ? 'error' : 'success'}`;
    box.textContent = msg;
}

function hideModalMsg(prefix) {
    const box = document.getElementById(`${prefix}-msg`);
    if (box) box.style.display = 'none';
}

function openModal(id) {
    document.getElementById(id).style.display = 'flex';
}

function closeModal(id) {
    document.getElementById(id).style.display = 'none';
    hideModalMsg(id.split('-')[0]);
}

function openGenerateModal() {
    document.getElementById('key-name').value = '';
    document.getElementById('key-rate').value = '100';
    openModal('generate-modal');
}

// --- Auth ---

function checkAuthState() {
    const loggedIn = !!token;
    document.getElementById('btn-show-login').style.display = loggedIn ? 'none' : 'inline-flex';
    document.getElementById('btn-logout').style.display = loggedIn ? 'inline-flex' : 'none';
    if (loggedIn) {
        fetchKeys();
        fetchLogs();
        fetchAnalytics();
        logInterval = setInterval(() => { fetchLogs(); fetchAnalytics(); }, 5000);
    } else {
        if (logInterval) clearInterval(logInterval);
        openModal('login-modal');
    }
}

async function handleAuth(action) {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    hideModalMsg('auth');

    if (!email || !password) {
        showModalMsg('auth', 'Missing credentials', true);
        return;
    }

    const btn = document.getElementById(action === 'login' ? 'btn-login' : 'btn-register');
    const origHTML = btn.innerHTML;
    btn.innerHTML = 'Wait...';
    btn.disabled = true;

    try {
        if (action === 'register') {
            const res = await fetch('/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            if (!res.ok) {
                const data = await res.json();
                let msg = 'Registration failed';
                if (data.detail) {
                    msg = Array.isArray(data.detail)
                        ? data.detail.map(e => `${e.loc[e.loc.length - 1]}: ${e.msg}`).join(', ')
                        : data.detail;
                }
                throw new Error(msg);
            }
            action = 'login';
        }

        if (action === 'login') {
            const form = new URLSearchParams({ username: email, password });
            const res = await fetch('/auth/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: form
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Authentication failed');
            token = data.access_token;
            localStorage.setItem('accessor_token', token);
            showModalMsg('auth', 'Authentication successful', false);
            setTimeout(() => { closeModal('login-modal'); checkAuthState(); }, 600);
        }
    } catch (err) {
        showModalMsg('auth', err.message, true);
    } finally {
        btn.innerHTML = origHTML;
        btn.disabled = false;
    }
}

function logout() {
    token = null;
    localStorage.removeItem('accessor_token');
    showToast('Session ended', 'success');
    checkAuthState();
}

// --- Keys ---

async function fetchKeys() {
    try {
        const res = await fetch('/keys/', { headers: authHeaders() });
        if (res.status === 401) { logout(); return; }
        const keys = await res.json();
        const tbody = document.getElementById('keys-body');
        tbody.innerHTML = '';

        if (keys.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-muted);padding:2rem;">No API keys configured.</td></tr>';
            return;
        }

        keys.forEach(k => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="font-weight:500">${k.name}</td>
                <td class="mono" style="color:var(--text-muted);max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${k.key}">${k.key}</td>
                <td class="mono">${k.rate_limit}/min</td>
                <td style="display:flex;gap:0.5rem;align-items:center">
                    <button class="btn-icon" onclick="testKey('${k.key}', this)" title="Test Ping"><i data-lucide="play"></i></button>
                    <button class="btn-icon" onclick="editKey(${k.id}, '${k.name}', ${k.rate_limit})" title="Edit"><i data-lucide="edit-2"></i></button>
                    <button class="btn-icon danger" onclick="deleteKey(${k.id}, this)" title="Revoke"><i data-lucide="trash-2"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        if (typeof lucide !== 'undefined') lucide.createIcons();
    } catch (e) {
        console.error('Error fetching keys:', e);
    }
}

async function testKey(apiKey, btn) {
    const origHTML = btn.innerHTML;
    btn.innerHTML = '<i data-lucide="loader"></i>';
    if (typeof lucide !== 'undefined') lucide.createIcons();
    btn.disabled = true;

    try {
        const res = await fetch('/status', { headers: { 'X-API-Key': apiKey } });
        if (res.status === 429) showToast('Rate Limit Triggered (429)', 'error');
        else if (res.status === 401 || res.status === 403) showToast('Key Rejected or Expired', 'error');
        else if (res.status === 500) showToast('Redis Connection Error (500)', 'error');
        else showToast('Test Request Received', 'success');
        fetchLogs();
        fetchAnalytics();
    } catch {
        showToast('Telemetry test failed', 'error');
    } finally {
        btn.innerHTML = origHTML;
        btn.disabled = false;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}

function editKey(id, currentName, currentLimit) {
    document.getElementById('edit-key-id').value = id;
    document.getElementById('edit-key-name').value = currentName;
    document.getElementById('edit-key-rate').value = currentLimit;
    openModal('edit-modal');
}

function deleteKey(id, btn) {
    keyToRevokeId = id;
    keyToRevokeBtn = btn;
    openModal('revoke-modal');
}

// --- Analytics ---

async function fetchLogs() {
    try {
        const res = await fetch('/analytics/logs?limit=15', { headers: authHeaders() });
        if (res.status === 401) { logout(); return; }
        const logs = await res.json();
        const tbody = document.getElementById('logs-body');
        tbody.innerHTML = '';

        if (logs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:2rem;">No telemetry detected. Fire a test request!</td></tr>';
            return;
        }

        logs.forEach(log => {
            const tr = document.createElement('tr');
            const time = new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
            tr.innerHTML = `
                <td style="color:var(--text-muted);font-size:0.85rem">${time}</td>
                <td class="mono">${log.method} ${log.endpoint}</td>
                <td>${statusBadge(log.status_code)}</td>
                <td class="mono">${log.response_time_ms.toFixed(1)}ms</td>
            `;
            tbody.appendChild(tr);
        });
        if (typeof lucide !== 'undefined') lucide.createIcons();
    } catch (e) {
        console.error('Error fetching logs:', e);
    }
}

async function fetchAnalytics() {
    try {
        const res = await fetch('/analytics/summary', { headers: authHeaders() });
        if (res.status === 401) { logout(); return; }
        const summary = await res.json();

        let totalReqs = 0, avgLat = 0, count = 0;
        summary.forEach(s => {
            totalReqs += s.total_requests;
            if (s.total_requests > 0) { avgLat += s.avg_response_time_ms; count++; }
        });

        document.getElementById('stat-reqs').textContent = totalReqs;
        document.getElementById('stat-latency').textContent = (count > 0 ? (avgLat / count).toFixed(1) : 0) + 'ms';
        document.getElementById('stat-keys').textContent = summary.length;
    } catch (e) {
        console.error('Error fetching analytics:', e);
    }
}

// --- Init ---

document.addEventListener('DOMContentLoaded', () => {
    checkAuthState();

    document.getElementById('btn-show-login').addEventListener('click', () => openModal('login-modal'));
    document.getElementById('btn-login').addEventListener('click', () => handleAuth('login'));
    document.getElementById('btn-register').addEventListener('click', () => handleAuth('register'));
    document.getElementById('btn-logout').addEventListener('click', logout);
    document.getElementById('btn-refresh').addEventListener('click', () => {
        fetchKeys(); fetchLogs(); fetchAnalytics();
        showToast('Syncing telemetry...', 'success');
    });

    document.getElementById('key-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('key-name').value.trim();
        const rate_limit = parseInt(document.getElementById('key-rate').value);
        if (!name) return;

        const btn = e.target.querySelector('button[type="submit"]');
        const orig = btn.textContent;
        btn.textContent = 'Initializing...';
        btn.disabled = true;

        try {
            const res = await fetch('/keys/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify({ name, rate_limit })
            });
            if (res.status === 401) { logout(); return; }
            if (!res.ok) throw new Error('Failed to generate key');
            showModalMsg('generate', 'Key generated successfully!', false);
            fetchKeys(); fetchAnalytics();
            setTimeout(() => closeModal('generate-modal'), 1000);
        } catch {
            showModalMsg('generate', 'Error generating key', true);
        } finally {
            btn.textContent = orig;
            btn.disabled = false;
        }
    });

    document.getElementById('edit-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('edit-key-id').value;
        const name = document.getElementById('edit-key-name').value.trim();
        const rate_limit = parseInt(document.getElementById('edit-key-rate').value);
        if (!name || !rate_limit) return;

        const btn = e.target.querySelector('button[type="submit"]');
        const orig = btn.textContent;
        btn.textContent = 'Saving...';
        btn.disabled = true;

        try {
            const res = await fetch(`/keys/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify({ name, rate_limit })
            });
            if (res.status === 401) { logout(); return; }
            if (!res.ok) throw new Error('Failed to update key');
            showModalMsg('edit', 'Key updated successfully!', false);
            fetchKeys();
            setTimeout(() => closeModal('edit-modal'), 1000);
        } catch {
            showModalMsg('edit', 'Error updating key', true);
        } finally {
            btn.textContent = orig;
            btn.disabled = false;
        }
    });

    document.getElementById('btn-confirm-revoke').addEventListener('click', async () => {
        if (!keyToRevokeId) return;
        const id = keyToRevokeId;
        const btn = keyToRevokeBtn;
        const orig = btn.textContent;
        btn.textContent = 'Revoking...';
        btn.disabled = true;

        try {
            const res = await fetch(`/keys/${id}`, { method: 'DELETE', headers: authHeaders() });
            if (res.status === 401) { logout(); return; }
            if (!res.ok) throw new Error('Failed to revoke key');
            closeModal('revoke-modal');
            showToast('Key Permanently Revoked', 'success');
            fetchKeys(); fetchAnalytics();
        } catch {
            showToast('Error revoking key', 'error');
        } finally {
            btn.textContent = orig;
            btn.disabled = false;
            keyToRevokeId = null;
            keyToRevokeBtn = null;
        }
    });
});
