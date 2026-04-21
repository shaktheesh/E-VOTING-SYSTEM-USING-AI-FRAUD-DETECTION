let isLogin = true;
let currentUser = null;

// 1. DATA INITIALIZATION (Local Images, NOTA, and Persistence)
let db = JSON.parse(localStorage.getItem('election_db'));

if (!db || !db.candidates.find(c => c.userid === "Vijay") || !db.candidates.find(c => c.userid === "NOTA")) {
    db = {
        voters: [],
        candidates: [
            { userid: "Vijay", party: "TVK", symbol: "Whistle", img: "whistle.png", pass: "evoting", votes: 0 },
            { userid: "MK Stalin", party: "DMK", symbol: "Rising Sun", img: "sunrise.png", pass: "evoting", votes: 0 },
            { userid: "Palanisamy", party: "ADMK", symbol: "Two Leaves", img: "leaf.png", pass: "evoting", votes: 0 },
            { userid: "NOTA", party: "None", symbol: "None of the Above", img: "nota.png", pass: "evoting", votes: 0 }
        ]
    };
    localStorage.setItem('election_db', JSON.stringify(db));
}

// 2. SESSION MANAGEMENT
window.onload = () => {
    const session = JSON.parse(localStorage.getItem('active_session'));
    if (session) {
        const list = session.type === 'voter' ? db.voters : db.candidates;
        currentUser = list.find(u => u.userid === session.userid);
        if (currentUser) {
            currentUser.type = session.type;
            openDashboard();
        } else { logout(); }
    }
};

// 3. AUTHENTICATION LOGIC
function handleAuth() {
    const type = document.getElementById('userType').value;
    const uid = document.getElementById('userid').value.trim();
    const pass = document.getElementById('password').value;
    const list = type === 'voter' ? db.voters : db.candidates;

    if (isLogin) {
        const user = list.find(u => u.userid === uid && u.pass === pass);
        if (user) {
            currentUser = { ...user, type };
            localStorage.setItem('active_session', JSON.stringify({ userid: uid, type: type }));
            openDashboard();
        } else { alert("Authentication Failed. Check ID/Password."); }
    } else {
        if (list.find(u => u.userid === uid)) return alert("User already exists.");
        list.push({ userid: uid, pass, voterid: document.getElementById('voterid').value, voted: false });
        localStorage.setItem('election_db', JSON.stringify(db));
        alert("Registration Successful! Please login."); toggleForm();
    }
}

// 4. DASHBOARD & BALLOT VIEW (Horizontal Layout)
function openDashboard() {
    document.getElementById('auth-box').classList.add('hidden');
    document.getElementById('dash-box').classList.remove('hidden');
    const status = currentUser.type === 'voter' ? (currentUser.voted ? "✅ Voted" : "❌ Not Voted") : "Official Candidate";
    document.getElementById('user-info').innerHTML = `<strong>Welcome, ${currentUser.userid}</strong><br><small>Status: ${status}</small>`;
    renderBallot();
}

function renderBallot() {
    const list = document.getElementById('ballot-list');
    list.innerHTML = `
        <div style="margin-bottom: 20px;">
            <button class="btn btn-primary" onclick="showResults()" style="width: auto; padding: 10px 25px;">📊 View Live Results Count</button>
        </div>
        <div id="candidate-grid" style="display: flex; flex-direction: row; justify-content: center; gap: 20px; flex-wrap: wrap;"></div>
    `;

    const grid = document.getElementById('candidate-grid');

    db.candidates.forEach(c => {
        const canVote = currentUser.type === 'voter' && !currentUser.voted;

        grid.innerHTML += `
            <div class="card" style="flex: 1; min-width: 200px; max-width: 240px; flex-direction: column; text-align: center;">
                <img src="${c.img}" class="symbol-img" alt="${c.symbol}" style="margin: 0 auto 10px auto;">
                <div class="candidate-info">
                    <strong>${c.userid}</strong> <br>
                    <span class="party-badge">${c.party}</span><br>
                    <small>Symbol: ${c.symbol}</small>
                </div>
                ${canVote ? `<button class="btn btn-primary" onclick="castVote('${c.userid}')" style="margin-top:15px;">VOTE</button>` : ''}
            </div>`;
    });
}

// 5. LIVE RESULTS VIEW
function showResults() {
    const list = document.getElementById('ballot-list');
    const totalVotes = db.candidates.reduce((a, b) => a + b.votes, 0);

    list.innerHTML = `
        <h1>Live Election Count</h1>
        <div id="results-stack" style="display: flex; flex-direction: column; align-items: center; gap: 15px;"></div>
        <button class="btn btn-outline" onclick="renderBallot()" style="margin-top: 20px; width: auto; padding: 10px 30px;">Back to Ballot</button>
    `;

    const stack = document.getElementById('results-stack');

    db.candidates.forEach(c => {
        const perc = totalVotes === 0 ? 0 : (c.votes / totalVotes) * 100;
        stack.innerHTML += `
            <div class="card" style="flex-direction: row; text-align: left; width: 100%; max-width: 600px; padding: 15px; gap: 20px;">
                <img src="${c.img}" style="width: 50px; height: 50px; object-fit: contain;">
                <div style="flex-grow: 1;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <strong>${c.userid} (${c.party})</strong>
                        <span style="font-weight: bold; color: var(--primary-navy);">${c.votes} Votes</span>
                    </div>
                    <div class="results-bar"><div class="results-fill" style="width: ${perc}%"></div></div>
                    <small>${Math.round(perc)}% of total votes cast</small>
                </div>
            </div>`;
    });
}

// 6. VOTING LOGIC
function castVote(name) {
    const cand = db.candidates.find(c => c.userid === name);
    const voter = db.voters.find(v => v.userid === currentUser.userid);
    if (cand && voter && !voter.voted) {
        cand.votes++; 
        voter.voted = true; 
        currentUser.voted = true;
        localStorage.setItem('election_db', JSON.stringify(db));
        alert("Success! Your vote for " + name + " has been recorded.");
        renderBallot(); 
        openDashboard();
    }
}

function toggleForm() {
    isLogin = !isLogin;
    document.getElementById('reg-area').classList.toggle('hidden', isLogin);
    document.getElementById('action-btn').innerText = isLogin ? "Login to Portal" : "Register Account";
    document.getElementById('toggle-link-text').innerText = isLogin ? "Register Now" : "Back to Login";
}

function logout() { localStorage.removeItem('active_session'); location.reload(); }
