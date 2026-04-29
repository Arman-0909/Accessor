let token = localStorage.getItem('accessor_token');

document.addEventListener('DOMContentLoaded', () => {
    checkAuthState();

    document.getElementById('btn-show-login').addEventListener('click', () => {
        openModal('login-modal');
    });

    document.getElementById('btn-login').addEventListener('click', () => handleAuth('login'));
    document.getElementById('btn-register').addEventListener('click', () => handleAuth('register'));
    document.getElementById('btn-logout').addEventListener('click', logout);
    document.getElementById('btn-refresh').addEventListener('click', () => {
        fetchKeys();
        fetchLogs();
        fetchAnalytics();
        showToast('Syncing telemetry...', 'success');
    });

    const keyForm = document.getElementById('key-form');
    keyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nameInput = document.getElementById('key-name');
        const rateInput = document.getElementById('key-rate');
        
        const name = nameInput.value.trim();
        const rate_limit = parseInt(rateInput.value);

        if (!name) return;

        const submitBtn = e.target.querySelector('button[type="submit"]');
        const origText = submitBtn.textContent;
        submitBtn.textContent = 'Initializing...';
        submitBtn.disabled = true;

        try {
            const res = await fetch('/keys/', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name: name, rate_limit: rate_limit })
            });
            if (res.ok) {
                showModalMsg('generate', 'Key generated successfully!', false);
                fetchKeys();
                fetchAnalytics();
                setTimeout(() => closeModal('generate-modal'), 1000);
            } else if (res.status === 401) {
                logout();
            } else {
                throw new Error("Failed to generate key");
            }
        } catch (error) {
            showModalMsg('generate', 'Error generating key', true);
        } finally {
            submitBtn.textContent = origText;
            submitBtn.disabled = false;
        }
    });

    const editForm = document.getElementById('edit-form');
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('edit-key-id').value;
        const newName = document.getElementById('edit-key-name').value.trim();
        const newLimit = parseInt(document.getElementById('edit-key-rate').value);

        if (!newName || !newLimit) return;

        const submitBtn = e.target.querySelector('button[type="submit"]');
        const origText = submitBtn.textContent;
        submitBtn.textContent = 'Saving...';
        submitBtn.disabled = true;

        try {
            const res = await fetch(`/keys/${id}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ name: newName, rate_limit: newLimit })
            });
            if (res.ok) {
                showModalMsg('edit', 'Key updated successfully!', false);
                fetchKeys();
                setTimeout(() => closeModal('edit-modal'), 1000);
            } else if (res.status === 401) { logout(); } else {
                throw new Error("Failed to update key");
            }
        } catch (error) {
            showModalMsg('edit', 'Error updating key', true);
        } finally {
            if(submitBtn) {
                submitBtn.textContent = origText;
                submitBtn.disabled = false;
            }
        }
    });

    document.getElementById('btn-confirm-revoke').addEventListener('click', async () => {
        if (!keyToRevokeId) return;
        
        const id = keyToRevokeId;
        const btn = keyToRevokeBtn;
        
        const origText = btn.textContent;
        btn.textContent = 'Revoking...';
        btn.disabled = true;

        try {
            const res = await fetch(`/keys/${id}`, { 
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.status === 401) { logout(); return; }
            if (res.ok) {
                closeModal('revoke-modal');
                showToast('Key Permanently Revoked', 'success');
                fetchKeys();
                fetchAnalytics();
            } else {
                throw new Error('Failed to revoke key');
            }
        } catch (error) {
            showToast('Error revoking key', 'error');
        } finally {
            if(btn) {
                btn.textContent = origText;
                btn.disabled = false;
            }
            keyToRevokeId = null;
            keyToRevokeBtn = null;
        }
    });
});

let logInterval;
let keyToRevokeId = null;
let keyToRevokeBtn = null;

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'error' ? 'alert-circle' : 'check-circle';
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
    const prefix = id.split('-')[0];
    hideModalMsg(prefix);
}

function openGenerateModal() {
    document.getElementById('key-name').value = '';
    document.getElementById('key-rate').value = '100';
    openModal('generate-modal');
}

function checkAuthState() {
    if (token) {
        document.getElementById('btn-show-login').style.display = 'none';
        document.getElementById('btn-logout').style.display = 'inline-flex';
        fetchKeys();
        fetchLogs();
        fetchAnalytics();
        logInterval = setInterval(() => {
            fetchLogs();
            fetchAnalytics();
        }, 5000);
    } else {
        document.getElementById('btn-show-login').style.display = 'inline-flex';
        document.getElementById('btn-logout').style.display = 'none';
        if (logInterval) clearInterval(logInterval);
        
        // Auto show login modal
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
                let errMsg = 'Registration failed';
                if (data.detail) {
                    if (Array.isArray(data.detail)) {
                        errMsg = data.detail.map(e => `${e.loc[e.loc.length-1]}: ${e.msg}`).join(', ');
                    } else {
                        errMsg = data.detail;
                    }
                }
                throw new Error(errMsg);
            }
            action = 'login';
        }

        if (action === 'login') {
            const formData = new URLSearchParams();
            formData.append('username', email);
            formData.append('password', password);

            const res = await fetch('/auth/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData
            });

            const data = await res.json();
            if (res.ok) {
                token = data.access_token;
                localStorage.setItem('accessor_token', token);
                showModalMsg('auth', 'Authentication successful', false);
                setTimeout(() => {
                    closeModal('login-modal');
                    checkAuthState();
                }, 600);
            } else {
                throw new Error(data.detail || "Authentication failed");
            }
        }
    } catch (err) {
        showModalMsg('auth', err.message, true);
    } finally {
        if(btn) {
            btn.innerHTML = origHTML;
            btn.disabled = false;
        }
    }
}

function logout() {
    token = null;
    localStorage.removeItem('accessor_token');
    showToast('Session ended', 'success');
    checkAuthState();
}

async function fetchKeys() {
    try {
        const res = await fetch('/keys/', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.status === 401) { logout(); return; }
        
        const keys = await res.json();
        const tbody = document.getElementById('keys-body');
        tbody.innerHTML = '';

        if (keys.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 2rem;">No API keys configured.</td></tr>';
            return;
        }

        keys.forEach(k => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="font-weight: 500;">${k.name}</td>
                <td class="mono" style="color: var(--text-muted); max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${k.key}">${k.key}</td>
                <td class="mono">${k.rate_limit}/min</td>
                <td style="display: flex; gap: 0.5rem; align-items: center;">
                    <button class="btn-icon" onclick="testKey('${k.key}', this)" title="Test Ping"><i data-lucide="play"></i></button>
                    <button class="btn-icon" onclick="editKey(${k.id}, '${k.name}', ${k.rate_limit})" title="Edit"><i data-lucide="edit-2"></i></button>
                    <button class="btn-icon danger" onclick="deleteKey(${k.id}, this)" title="Revoke"><i data-lucide="trash-2"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
        if (typeof lucide !== 'undefined') lucide.createIcons();
    } catch (error) {
        console.error("Error fetching keys:", error);
    }
}

async function testKey(apiKey, btn) {
    const origHTML = btn.innerHTML;
    btn.innerHTML = '<i data-lucide="loader"></i>';
    if (typeof lucide !== 'undefined') lucide.createIcons();
    btn.disabled = true;
    try {
        const res = await fetch('/status', {
            headers: { 'X-API-Key': apiKey }
        });
        if (res.status === 429) {
            showToast('Rate Limit Triggered (429)', 'error');
        } else if (res.status === 401 || res.status === 403) {
            showToast('Key Rejected or Expired', 'error');
        } else if (res.status === 500) {
            showToast('Redis Connection Error (500)', 'error');
        } else {
            showToast('Test Request Received', 'success');
        }
        fetchLogs();
        fetchAnalytics();
    } catch (e) {
        showToast('Telemetry test failed', 'error');
    } finally {
        if(btn) {
            btn.innerHTML = origHTML;
            btn.disabled = false;
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
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

async function fetchLogs() {
    try {
        const res = await fetch('/analytics/logs?limit=15', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.status === 401) { logout(); return; }

        const logs = await res.json();
        const tbody = document.getElementById('logs-body');
        
        tbody.innerHTML = '';

        if (logs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 2rem;">No telemetry detected. Fire a test request!</td></tr>';
            return;
        }

        logs.forEach(log => {
            const tr = document.createElement('tr');
            
            let statusBadge = '';
            if (log.status_code === 429) {
                statusBadge = `<span class="status-badge status-limit">${log.status_code}</span>`;
            } else if (log.status_code >= 400) {
                statusBadge = `<span class="status-badge status-err">${log.status_code}</span>`;
            } else {
                statusBadge = `<span class="status-badge status-ok">${log.status_code}</span>`;
            }

            const date = new Date(log.timestamp);
            const timeStr = date.toLocaleTimeString([], {hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit'});

            tr.innerHTML = `
                <td style="color: var(--text-muted); font-size: 0.85rem;">${timeStr}</td>
                <td class="mono">${log.method} ${log.endpoint}</td>
                <td>${statusBadge}</td>
                <td class="mono">${log.response_time_ms.toFixed(1)}ms</td>
            `;
            tbody.appendChild(tr);
        });
        if (typeof lucide !== 'undefined') lucide.createIcons();
    } catch (error) {
        console.error("Error fetching logs:", error);
    }
}

async function fetchAnalytics() {
    try {
        const res = await fetch('/analytics/summary', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.status === 401) { logout(); return; }

        const summary = await res.json();
        
        let totalReqs = 0;
        let avgLat = 0;
        let count = 0;

        summary.forEach(s => {
            totalReqs += s.total_requests;
            if (s.total_requests > 0) {
                avgLat += s.avg_response_time_ms;
                count++;
            }
        });
        
        const finalAvgLat = count > 0 ? (avgLat / count).toFixed(1) : 0;

        document.getElementById('stat-reqs').textContent = totalReqs;
        document.getElementById('stat-latency').textContent = finalAvgLat + 'ms';
        document.getElementById('stat-keys').textContent = summary.length;

    } catch (error) {
        console.error("Error fetching analytics:", error);
    }
}
