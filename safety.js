import {getApp} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js';
import {getAuth, signOut} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js';
import {getFunctions, httpsCallable} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-functions.js';

const functions = getFunctions(getApp());
const auth = getAuth(getApp());
const reasons = ['Inappropriate content', 'Harassment or bullying', 'Spam', 'False match information', 'Impersonation', 'Other'];
let safety = {blockedUserIds: [], isAdmin: false};
const call = name => httpsCallable(functions, name);
const session = () => window.rallyshSession?.() || {current: null, state: {posts: [], users: []}};
const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
const postTime = post => typeof post.createdAt?.toMillis === 'function' ? post.createdAt.toMillis() : Number(post.createdAt || post.created || 0);
const idsFor = post => [...(Array.isArray(post.playersA) ? post.playersA : [post.authorUid]), ...(Array.isArray(post.playersB) ? post.playersB : [])].filter(Boolean);

function addSafetyStyles() {
  const style = document.createElement('style');
  style.textContent = `.post-more,.comment-more{background:transparent;color:var(--muted);font-size:19px;padding:4px 7px}.comment-row{display:flex;gap:5px;align-items:start}.comment-row p{flex:1}.settings-section{border-top:1px solid var(--line);margin-top:18px;padding-top:14px}.settings-section h2{font-size:17px;margin:0 0 7px}.settings-links{display:grid;gap:7px;margin-top:10px}.settings-links a{color:#a7ff5a;font-weight:700;text-decoration:none}.danger{background:#402036!important;color:#fff!important}.safety-choice{display:grid;gap:9px}.safety-choice button{text-align:left}.admin-report{padding:12px;margin:9px 0;border:1px solid var(--line);border-radius:12px;background:#10182d}.admin-report small{display:block;color:var(--muted);margin:3px 0}.admin-actions{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}.admin-actions button{padding:8px 9px;font-size:12px}.account-delete-note{color:var(--muted);font-size:13px}`;
  document.head.append(style);
}

function legalLinks() {
  return `<div class="settings-links"><a href="https://www.termsfeed.com/live/c1f82e48-8c30-4bf5-a8d4-6d413269b8a4" target="_blank" rel="noopener">Privacy Policy</a><a href="terms.html" target="_blank" rel="noopener">Terms of Use</a><a href="community-guidelines.html" target="_blank" rel="noopener">Community Guidelines</a><a href="support.html" target="_blank" rel="noopener">Contact Support</a></div>`;
}

function injectProfileSettings() {
  const card = document.querySelector('#accountProfile .modal-card');
  if (!card || document.getElementById('safetySettings')) return;
  const section = document.createElement('section');
  section.id = 'safetySettings'; section.className = 'settings-section';
  section.innerHTML = `<h2>Account settings</h2><button class="secondary wide" onclick="openBlockedUsers()">Blocked users</button><button id="openModerationButton" class="secondary wide hidden" style="margin-top:8px" onclick="openModeration()">Moderation reports</button><button class="secondary wide" style="margin-top:8px" onclick="cloudLogout()">Sign out</button><button class="danger wide" style="margin-top:8px" onclick="openDeleteAccount()">Delete account</button><p class="account-delete-note">Deleting your account permanently removes your Rallysh profile, photos, posts, comments, likes, and related personal data.</p><h2 style="margin-top:18px">Legal and support</h2>${legalLinks()}`;
  card.append(section);
}

function injectAuthLinks() {
  const card = document.querySelector('#auth .modal-card');
  if (!card || document.getElementById('authLegalLinks')) return;
  const links = document.createElement('p'); links.id = 'authLegalLinks'; links.className = 'muted'; links.style.cssText = 'font-size:11px;text-align:center;margin:16px 0 0'; links.innerHTML = `<a href="https://www.termsfeed.com/live/c1f82e48-8c30-4bf5-a8d4-6d413269b8a4" target="_blank" rel="noopener">Privacy</a> · <a href="terms.html" target="_blank" rel="noopener">Terms</a> · <a href="community-guidelines.html" target="_blank" rel="noopener">Guidelines</a> · <a href="support.html" target="_blank" rel="noopener">Support</a>`; card.append(links);
}

function injectAppleButtons() {
  const addButton = (googleButton, id, label) => {
    if (!googleButton || document.getElementById(id)) return;
    const button = document.createElement('button');
    button.id = id;
    button.className = 'secondary wide';
    button.style.cssText = 'margin-top:10px;background:#000;color:#fff';
    button.setAttribute('onclick', 'loginWithApple()');
    button.innerHTML = `&#63743;&nbsp;&nbsp; ${label}`;
    googleButton.insertAdjacentElement('afterend', button);
  };
  addButton(document.querySelector('#loginForm button[onclick="loginWithGoogle()"]'), 'appleLoginButton', 'Continue with Apple');
  addButton(document.querySelector('#registerForm button[onclick="loginWithGoogle()"]'), 'appleRegisterButton', 'Register with Apple');
}

function ensureModals() {
  if (document.getElementById('safetyModals')) return;
  const holder = document.createElement('div'); holder.id = 'safetyModals';
  holder.innerHTML = `<div id="contentMenu" class="modal hidden"><div class="modal-card"><button class="ghost profile-close" onclick="closeSafetyModal('contentMenu')">×</button><h1>Post options</h1><div id="contentMenuActions" class="safety-choice"></div></div></div><div id="reportModal" class="modal hidden"><div class="modal-card"><button class="ghost profile-close" onclick="closeSafetyModal('reportModal')">×</button><h1>Report content</h1><p class="muted">Reports are reviewed by Rallysh moderation.</p><label>Reason<select id="reportReason">${reasons.map(reason => `<option>${reason}</option>`).join('')}</select></label><button class="primary wide" onclick="submitReport()">Submit report</button></div></div><div id="blockedModal" class="modal hidden"><div class="modal-card"><button class="ghost profile-close" onclick="closeSafetyModal('blockedModal')">×</button><h1>Blocked users</h1><p class="muted">Blocked players cannot interact with you, and their content is hidden from your feed.</p><div id="blockedList"></div></div></div><div id="deleteAccountModal" class="modal hidden"><div class="modal-card"><button class="ghost profile-close" onclick="closeSafetyModal('deleteAccountModal')">×</button><h1>Delete your account?</h1><p>This permanently deletes your Firebase sign-in, Rallysh profile, photos, posts, comments, likes, and approval data. This cannot be undone.</p><label>Type <b>DELETE</b> to confirm<input id="deleteConfirmation" autocomplete="off" placeholder="DELETE"></label><button class="danger wide" onclick="deleteMyAccount()">Permanently delete account</button></div></div><div id="moderationModal" class="modal hidden"><div class="modal-card"><button class="ghost profile-close" onclick="closeSafetyModal('moderationModal')">×</button><h1>Moderation reports</h1><p class="muted">Review reports and take action promptly under the Community Guidelines.</p><div id="adminReportList"></div></div></div>`;
  document.body.append(holder);
}

function filterPicker() {
  const blocked = new Set(safety.blockedUserIds); document.querySelectorAll('#pickerList button').forEach(button => { const match = button.getAttribute('onclick')?.match(/'([^']+)'/); if (match && blocked.has(match[1])) button.remove(); });
}

function renderSafetyFeed() {
  const {current, state} = session(); if (!current || !document.getElementById('feed')) return;
  const blocked = new Set(safety.blockedUserIds), myMatches = state.posts.filter(post => idsFor(post).includes(current.id));
  const connectedSince = new Map(); myMatches.forEach(post => idsFor(post).filter(id => id !== current.id).forEach(id => { const previous = connectedSince.get(id), time = postTime(post); if (previous === undefined || time < previous) connectedSince.set(id, time); }));
  const posts = state.posts.filter(post => { const ids = idsFor(post); if (post.pending || post.contentStatus === 'reviewing' || post.contentStatus === 'rejected' || ids.some(id => blocked.has(id))) return false; if (ids.includes(current.id)) return true; return ids.some(id => connectedSince.has(id) && postTime(post) >= connectedSince.get(id)); }).slice(0, 5);
  const names = (ids, fallback) => (ids || []).map(id => state.users.find(user => user.id === id)?.name).filter(Boolean).join(' & ') || fallback || 'Opponent';
  const markup = post => {
    const comments = (Array.isArray(post.commentItems) ? post.commentItems : []).filter(comment => !blocked.has(comment.authorUid));
    const liked = (post.likedBy || []).includes(current.id), author = names(post.playersA, post.author), opponent = names(post.playersB, post.opponent);
    const scores = String(post.score || '').match(/\d+/g) || []; const setCells = (row) => scores.filter((_, index) => index % 2 === row).map(score => `<b class="score-cell">${score}</b>`).join('');
    return `<article class="post">${post.photo ? `<img src="${escapeHtml(post.photo)}" alt="Court match post" loading="lazy" decoding="async">` : ''}<div class="post-body"><div class="row"><div class="avatar">${escapeHtml((post.author || '?')[0])}</div><div class="grow"><b>${escapeHtml(post.author || 'Match result')}</b><br><span class="outcome ${post.won ? '' : 'loss'}">${post.won ? 'Won' : 'Lost'}</span></div><b class="${post.delta < 0 ? 'loss' : 'gain'}">${post.delta > 0 ? '+' : ''}${Math.round(Number(post.delta) || 0)}</b><button class="post-more" onclick="openContentMenu('${post.id}')" aria-label="Post options">•••</button></div><div class="match-score" style="--sets:${Math.max(1, scores.length / 2)}"><div class="score-line ${post.won ? 'winner' : ''}"><span class="score-name">${escapeHtml(author)}</span>${setCells(0)}</div><div class="score-line ${post.won ? '' : 'winner'}"><span class="score-name">${escapeHtml(opponent)}</span>${setCells(1)}</div></div>${post.venue ? `<span class="venue">&#128205; ${escapeHtml(post.venue)}</span>` : ''}${comments.length ? `<div class="comment-list">${comments.map(comment => `<div class="comment-row"><p><b>${escapeHtml(comment.author || 'Player')}</b> ${escapeHtml(comment.text || '')}</p>${comment.id ? `<button class="comment-more" onclick="openCommentMenu('${post.id}','${comment.id}')" aria-label="Comment options">•••</button>` : ''}</div>`).join('')}</div>` : ''}<div class="actions"><button class="${liked ? 'liked' : ''}" onclick="likePost('${post.id}')">${liked ? 'Liked' : 'Like'} (${Number(post.likes) || 0})</button><button onclick="commentPost('${post.id}')">Comment (${Number(post.comments) || comments.length})</button><button onclick="sharePost('${post.id}')">Share</button></div></div></article>`;
  };
  document.getElementById('feed').innerHTML = posts.length ? posts.map(markup).join('') : '<div class="card" style="padding:20px;text-align:center;color:var(--muted)">Your approved match posts will appear here.</div>';
}

async function refreshSafety() {
  if (!auth.currentUser) return; try { safety = {...safety, ...(await call('getSafetyState')()).data}; const button = document.getElementById('openModerationButton'); if (button) button.classList.toggle('hidden', !safety.isAdmin); filterPicker(); renderSafetyFeed(); } catch (error) { console.warn('Could not load Rallysh safety settings', error); }
}

window.closeSafetyModal = id => document.getElementById(id)?.classList.add('hidden');
window.openContentMenu = postId => { const {current, state} = session(), post = state.posts.find(item => item.id === postId); if (!post) return; window.safetyTarget = {targetType: 'post', postId}; const canBlock = post.authorUid && post.authorUid !== current?.id; document.getElementById('contentMenuActions').innerHTML = `<button class="secondary wide" onclick="openReportModal()">Report post</button>${canBlock ? `<button class="secondary wide" onclick="blockUser('${post.authorUid}')">Block ${escapeHtml(post.author || 'player')}</button>` : ''}`; document.getElementById('contentMenu').classList.remove('hidden'); };
window.openCommentMenu = (postId, commentId) => { window.safetyTarget = {targetType: 'comment', postId, commentId}; document.getElementById('contentMenuActions').innerHTML = '<button class="secondary wide" onclick="openReportModal()">Report comment</button>'; document.getElementById('contentMenu').classList.remove('hidden'); };
window.openReportModal = () => { window.closeSafetyModal('contentMenu'); document.getElementById('reportModal').classList.remove('hidden'); };
window.submitReport = async () => { if (!window.safetyTarget) return; try { await call('reportContent')({...window.safetyTarget, reason: document.getElementById('reportReason').value}); window.closeSafetyModal('reportModal'); alert('Report submitted. Rallysh moderation will review it.'); } catch (error) { console.error(error); alert('Could not submit the report. Please try again.'); } };
window.blockUser = async targetUid => { if (!confirm('Block this player? Their posts and comments will be hidden, and neither of you can interact in Rallysh.')) return; try { await call('blockUser')({targetUid}); window.closeSafetyModal('contentMenu'); await refreshSafety(); alert('Player blocked. You can unblock them in Account settings.'); } catch (error) { console.error(error); alert('Could not block this player. Please try again.'); } };
window.openBlockedUsers = () => { const {state} = session(), users = state.users.filter(user => safety.blockedUserIds.includes(user.id)); document.getElementById('blockedList').innerHTML = users.length ? users.map(user => `<div class="pending-item"><b>${escapeHtml(user.name)}</b><button class="secondary wide" style="margin-top:8px" onclick="unblockUser('${user.id}')">Unblock</button></div>`).join('') : '<p class="muted">You have not blocked any users.</p>'; document.getElementById('blockedModal').classList.remove('hidden'); };
window.unblockUser = async targetUid => { try { await call('unblockUser')({targetUid}); await refreshSafety(); window.openBlockedUsers(); } catch (error) { console.error(error); alert('Could not unblock this player.'); } };
window.likePost = async postId => { try { await call('toggleLike')({postId}); } catch (error) { console.error(error); alert('Could not save the like. This interaction may be blocked.'); } };
window.commentPost = async postId => { const text = prompt('Add a comment'); if (!text?.trim()) return; try { await call('addComment')({postId, text: text.trim()}); } catch (error) { console.error(error); const message = error.code === 'functions/failed-precondition' ? error.message : 'Could not post that comment. Please try again.'; alert(message); } };
window.openDeleteAccount = () => { window.closeProfile?.(); document.getElementById('deleteConfirmation').value = ''; document.getElementById('deleteAccountModal').classList.remove('hidden'); };
window.deleteMyAccount = async () => { if (document.getElementById('deleteConfirmation').value !== 'DELETE') { alert('Type DELETE to confirm permanent account deletion.'); return; } try { await call('deleteMyAccount')({}); await signOut(auth); alert('Your Rallysh account and associated personal data have been deleted.'); location.replace(location.pathname); } catch (error) { console.error(error); alert('Could not delete your account. Please sign in again and retry.'); } };
window.openModeration = async () => { if (!safety.isAdmin) return; document.getElementById('adminReportList').innerHTML = '<p class="muted">Loading reports…</p>'; document.getElementById('moderationModal').classList.remove('hidden'); try { const reports = (await call('getAdminReports')()).data.reports || [], {state} = session(); document.getElementById('adminReportList').innerHTML = reports.length ? reports.map(report => { const post = state.posts.find(item => item.id === report.postId); return `<div class="admin-report"><b>${escapeHtml(report.reason)}</b><small>${escapeHtml(report.targetType)} · ${escapeHtml(post?.author || report.targetAuthorUid || 'Unknown player')}</small><small>Status: ${escapeHtml(report.status || 'open')}</small><div class="admin-actions"><button class="secondary" onclick="moderateReport('${report.id}','dismiss')">Dismiss</button><button class="secondary" onclick="moderateReport('${report.id}','${report.targetType === 'comment' ? 'removeComment' : 'removePost'}')">Remove content</button>${report.targetAuthorUid ? `<button class="danger" onclick="moderateReport('${report.id}','suspendUser')">Suspend user</button>` : ''}</div></div>`; }).join('') : '<p class="muted">No reports to review.</p>'; } catch (error) { console.error(error); document.getElementById('adminReportList').innerHTML = '<p class="loss">Could not load reports.</p>'; } };
window.moderateReport = async (reportId, action) => { if (!confirm(`Confirm moderation action: ${action}?`)) return; try { await call('moderateReport')({reportId, action}); await window.openModeration(); } catch (error) { console.error(error); alert('Could not apply this moderation action.'); } };

addSafetyStyles(); ensureModals(); injectAuthLinks(); injectAppleButtons();
const baseOpenProfile = window.openProfile; window.openProfile = async () => { await baseOpenProfile?.(); injectProfileSettings(); await refreshSafety(); };
const baseOpenPicker = window.openPicker; window.openPicker = (...args) => { baseOpenPicker?.(...args); filterPicker(); };
const baseRenderAll = window.renderAll; window.renderAll = (...args) => { const result = baseRenderAll?.(...args); injectProfileSettings(); renderSafetyFeed(); refreshSafety(); return result; };
setTimeout(() => { injectAuthLinks(); injectAppleButtons(); refreshSafety(); }, 700);
