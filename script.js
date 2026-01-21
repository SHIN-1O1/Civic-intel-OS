import { auth, db } from "./firebase-config.js";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import {
    collection,
    addDoc,
    getDocs,
    doc,
    setDoc,
    getDoc,
    updateDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// --- Initialization ---
console.log("Civic Portal: Script Initializing...");

// Basic startup check
if (!document.getElementById('main-nav')) {
    console.error("Critical: DOM not ready or IDs missing");
}

// --- State & Constants ---
const APP_STATE = {
    currentUser: null,
    userProfile: null,
    currentCategory: null,
    complaintStage: 0, // 0: Idle, 1: Location, 2: Description
    complaintDraft: { location: '', description: '' }
};

const GEMINI_API_KEY = "AIzaSyDHfpLLDzBmkaGChU4HsJ-3cb7lET4N_x0";

async function verifyComplaintWithGemini(location, description, category) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`;

    const prompt = `
    You are a civic grievance verification AI. 
    Category: ${category}
    Location provided: "${location}"
    Description provided: "${description}"
    
    Task: Strictly analyze if this is a valid, specific civic complaint.
    1. **Location Check**: Must be specific (e.g., Street Name, Landmark, Colony). Reject vague inputs like "my house", "main road", "Delhi", "here".
    2. **Description Check**: Must clearly state the issue and be a valid civic grievance. reject gibberish, greetings (e.g. "hello"), or irrelevant text.
    3. **Abusive Language**: Check for profanity.
    
    Output strictly in JSON format (NO Markdown, NO Backticks):
    {
        "isValid": boolean,
        "feedback": "string (If invalid: 'This does not seem like a valid complaint. Please describe a specific civic issue.' or specific reason. If valid: 'pre-filing check passed')",
        "severity": "High" | "Medium" | "Low",
        "summary": "string (REQUIRED: A short 10-15 word summary of the complaint)"
    }
    `;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        const text = data.candidates[0].content.parts[0].text;
        // Extract JSON from potential markdown code blocks
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const result = jsonMatch ? JSON.parse(jsonMatch[0]) : { isValid: false, feedback: "AI Verification failed to parse." };

        // Ensure summary exists if valid
        if (result.isValid && !result.summary) {
            result.summary = description.substring(0, 50) + "...";
        }

        return result;
    } catch (error) {
        console.error("Gemini API Error:", error);
        return { isValid: true, feedback: "AI Offline. Proceeding with manual review.", severity: "Medium" };
    }
}

// --- DOM Elements ---
const sections = document.querySelectorAll('section');
const navLinks = document.querySelectorAll('.nav-link');
const mainNav = document.getElementById('main-nav');

// Auth Forms
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');

// Chat & Complaint
const categoriesGrid = document.querySelector('.categories-grid');
const startComplaintBtns = document.querySelectorAll('.start-complaint-btn');
const complaintForm = document.getElementById('complaint-form');
const chatMessages = document.getElementById('chat-messages');
const fileUpload = document.getElementById('file-upload');
const imagePreviewContainer = document.getElementById('image-preview-container');
const previewImg = document.getElementById('preview-img');
const removeImgBtn = document.getElementById('remove-img-btn');

// Map Elements
const mapModal = document.getElementById('map-modal');
const closeMapModalBtn = document.querySelector('.close-map-modal');
const confirmLocationBtn = document.getElementById('confirm-location-btn');
const mapContainer = document.getElementById('map-container');
let map, marker, selectedLat, selectedLng, selectedAddressText;

// History & Profile
const complaintsList = document.getElementById('complaints-list');
const profileForm = document.getElementById('profile-form');

// --- Initialization ---
init();

function init() {
    setupEventListeners();

    // Firebase Auth Listener
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            APP_STATE.currentUser = user;
            await fetchUserProfile(user.uid);
            showAuthenticatedView();
        } else {
            APP_STATE.currentUser = null;
            APP_STATE.userProfile = null;
            showLoginView();
        }
    });
}

async function fetchUserProfile(uid) {
    try {
        const docRef = doc(db, "users", uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            APP_STATE.userProfile = docSnap.data();
        }
    } catch (error) {
        console.error("Error fetching profile:", error);
    }
}

// --- Navigation Logic ---
function navigateTo(sectionId) {
    sections.forEach(s => s.classList.remove('active-section'));
    document.getElementById(sectionId).classList.add('active-section');

    navLinks.forEach(link => {
        if (link.dataset.target === sectionId) link.classList.add('active');
        else link.classList.remove('active');
    });

    if (sectionId === 'history-section') loadHistory();
    if (sectionId === 'profile-section') loadProfile();
}

function showAuthenticatedView() {
    mainNav.style.display = 'block';
    if (APP_STATE.userProfile && APP_STATE.userProfile.username) {
        document.getElementById('nav-avatar').textContent = APP_STATE.userProfile.username[0].toUpperCase();
    }
    navigateTo('home-section');
}

function showLoginView() {
    mainNav.style.display = 'none';
    navigateTo('login-section');
}

// --- Event Listeners ---
function setupEventListeners() {
    document.getElementById('go-to-signup').addEventListener('click', (e) => { e.preventDefault(); navigateTo('signup-section'); });
    document.getElementById('go-to-login').addEventListener('click', (e) => { e.preventDefault(); navigateTo('login-section'); });

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo(link.dataset.target);
        });
    });

    document.getElementById('logout-btn').addEventListener('click', logout);
    document.getElementById('user-menu-btn').addEventListener('click', (e) => {
        if (!e.target.closest('button')) {
            document.querySelector('.dropdown-menu').classList.toggle('show');
        }
    });

    const profileBtn = document.getElementById('profile-btn');
    if (profileBtn) {
        profileBtn.addEventListener('click', () => {
            navigateTo('profile-section');
            document.querySelector('.dropdown-menu').classList.remove('show');
        });
    }

    loginForm.addEventListener('submit', handleLogin);
    signupForm.addEventListener('submit', handleSignup);

    if (categoriesGrid) {
        categoriesGrid.addEventListener('click', (e) => {
            const card = e.target.closest('.category-card');
            if (card && !e.target.closest('.start-complaint-btn')) {
                document.querySelectorAll('.category-card').forEach(c => {
                    if (c !== card) c.classList.remove('expanded');
                });
                card.classList.toggle('expanded');
            }
        });
    }

    startComplaintBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            startComplaint(btn.dataset.cat);
        });
    });

    document.querySelector('.back-to-home').addEventListener('click', () => navigateTo('home-section'));

    fileUpload.addEventListener('change', handleImageSelect);
    removeImgBtn.addEventListener('click', () => {
        fileUpload.value = '';
        imagePreviewContainer.style.display = 'none';
        previewImg.src = '';
    });

    complaintForm.addEventListener('submit', handleComplaintSubmit);

    if (closeMapModalBtn) {
        closeMapModalBtn.addEventListener('click', () => {
            mapModal.classList.remove('show');
        });
    }

    if (confirmLocationBtn) {
        confirmLocationBtn.addEventListener('click', () => {
            if (selectedAddressText) {
                document.getElementById('complaint-text').value = selectedAddressText;
                mapModal.classList.remove('show');
                document.getElementById('complaint-text').focus();
            }
        });
    }

    document.getElementById('edit-profile-btn').addEventListener('click', toggleProfileEdit);
    document.getElementById('cancel-edit-btn').addEventListener('click', toggleProfileEdit);
    profileForm.addEventListener('submit', saveProfile);
}

// --- Authentication Functions ---
async function handleSignup(e) {
    e.preventDefault();
    const username = document.getElementById('signup-username').value;
    const phone = document.getElementById('signup-phone').value;
    const aadhar = document.getElementById('signup-aadhar').value;
    const address = document.getElementById('signup-address').value;
    const password = document.getElementById('signup-password').value;
    const email = `${username.replace(/\s+/g, '').toLowerCase()}@civic.com`; // Pseudo-email for simplicity

    try {
        showToast('Creating account...', 'info');
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Save extra details to Firestore
        await setDoc(doc(db, "users", user.uid), {
            username, phone, aadhar, address, uid: user.uid, email
        });

        showToast('Account created successfully!', 'success');
    } catch (error) {
        console.error(error);
        showToast(error.message, 'error');
        alert("Signup Error: " + error.message);
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    // Demo Logic
    if (username === 'demo' && password === 'demo') {
        const demoUser = {
            username: 'Demo Citizen',
            phone: '9876543210',
            aadhar: '123456789012',
            address: '123, Civic Lane, Metro City',
            uid: 'demo_user_123'
        };
        APP_STATE.currentUser = { uid: 'demo_user_123' };
        APP_STATE.userProfile = demoUser;
        showToast('Login Successful (Demo Mode)', 'success');
        showAuthenticatedView();
        return;
    }

    const email = `${username.replace(/\s+/g, '').toLowerCase()}@civic.com`;

    try {
        await signInWithEmailAndPassword(auth, email, password);
        showToast('Login Successful', 'success');
    } catch (error) {
        console.error(error);
        showToast('Login Failed: ' + error.message, 'error');
        alert("Login Failed: " + error.message);
    }
}

async function logout() {
    try {
        await signOut(auth);
        showToast('Logged out', 'info');
    } catch (error) {
        console.error(error);
    }
}

// --- Complaint Logic ---
function startComplaint(category) {
    APP_STATE.currentCategory = category;
    APP_STATE.complaintStage = 1; // Start with Location Stage
    APP_STATE.complaintDraft = { location: '', description: '' };

    document.getElementById('chat-cat_name').textContent = category;
    document.getElementById('selected-category-badge').textContent = category;

    // Reset chat
    chatMessages.innerHTML = '';
    const greeting = `Hello! I can help you file a complaint for <strong>${category}</strong>.<br>First, please tell me the <strong>exact location</strong> of the issue.`;

    // Create Greeting Div
    addMessageToChat(greeting, 'bot');

    // Add Map Button
    const mapBtnDiv = document.createElement('div');
    mapBtnDiv.style.textAlign = 'left';
    mapBtnDiv.style.marginLeft = '50px';
    mapBtnDiv.style.marginBottom = '10px';
    mapBtnDiv.innerHTML = `<button class="btn btn-sm btn-outline-primary" id="open-map-btn"><span class="material-icons-round" style="font-size:16px; vertical-align:middle; margin-right:5px;">map</span> Pick on Map</button>`;
    chatMessages.appendChild(mapBtnDiv);

    document.getElementById('open-map-btn').addEventListener('click', openMapPicker);

    // Force Map Usage: Disable text input
    const inputField = document.getElementById('complaint-text');
    inputField.readOnly = true;
    inputField.placeholder = "Please use 'Pick on Map' to set location";

    navigateTo('submission-section');
}

function handleImageSelect(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImg.src = e.target.result;
            imagePreviewContainer.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

async function handleComplaintSubmit(e) {
    e.preventDefault();
    const text = document.getElementById('complaint-text').value;
    const imageSrc = previewImg.src;
    const hasImage = imagePreviewContainer.style.display !== 'none';

    if (!text.trim()) return;

    addMessageToChat(text, 'user', hasImage ? imageSrc : null);

    // Reset Input (Text only)
    document.getElementById('complaint-text').value = '';

    // NOTE: We only clear the image in the final stage, so user can upload it anytime.

    // --- State Machine ---

    // Stage 1: Location Capture
    if (APP_STATE.complaintStage === 1) {
        APP_STATE.complaintDraft.location = text;
        APP_STATE.complaintStage = 2; // Move to Description Stage

        // Re-enable input for description
        const inputField = document.getElementById('complaint-text');
        inputField.readOnly = false;
        inputField.placeholder = "Describe the issue...";
        inputField.focus();

        setTimeout(() => {
            addMessageToChat(`Thanks. Now, please describe the <strong>details of the issue</strong>. Be as specific as possible (e.g., what is broken, how long, severity).`, 'bot');
        }, 600);
        return;
    }

    // Stage 2: Description & Verification
    if (APP_STATE.complaintStage === 2) {
        APP_STATE.complaintDraft.description = text;

        // Show verification status
        addMessageToChat(`<em>Verifying details with Smart AI...</em>`, 'bot');

        // Call Gemini
        const verification = await verifyComplaintWithGemini(
            APP_STATE.complaintDraft.location,
            APP_STATE.complaintDraft.description,
            APP_STATE.currentCategory
        );

        if (!verification.isValid) {
            setTimeout(() => {
                addMessageToChat(`<strong>Bot:</strong> ${verification.feedback}`, 'bot');
            }, 1000);
            // Reset to Stage 1 to allow full retry? Or just let them type again?
            // If they just typed nonsense in description, they remain in Stage 2 (Description).
            // If location was nonsense, they might need to reset. 
            // For now, staying in Stage 2 allows re-typing description which is usually the issue.
            return;
        }

        // If Valid -> Move to Stage 3 (Confirmation)
        APP_STATE.complaintDraft.verification = verification; // Store result
        APP_STATE.complaintStage = 3;

        setTimeout(() => {
            addMessageToChat(`
                <strong>Please Confirm Your Complaint:</strong><br>
                <ul>
                    <li><strong>Category:</strong> ${APP_STATE.currentCategory}</li>
                    <li><strong>Location:</strong> ${APP_STATE.complaintDraft.location}</li>
                    <li><strong>Summary:</strong> ${verification.summary}</li>
                    <li><strong>Severity:</strong> ${verification.severity}</li>
                </ul>
                <br>Type <strong>"Yes"</strong> or <strong>"Confirm"</strong> to submit. Type <strong>"No"</strong> to cancel.
            `, 'bot');
        }, 1000);
        return;
    }

    // Stage 3: Confirmation
    if (APP_STATE.complaintStage === 3) {
        const response = text.toLowerCase();
        if (response.includes('yes') || response.includes('confirm') || response.includes('ok')) {
            // Save to Firestore
            try {
                const verification = APP_STATE.complaintDraft.verification;
                const docRef = await addDoc(collection(db, "complaints"), {
                    userId: APP_STATE.currentUser.uid,
                    category: APP_STATE.currentCategory,
                    description: APP_STATE.complaintDraft.description,
                    location: APP_STATE.complaintDraft.location,
                    status: 'Pending',
                    severity: verification.severity || 'Medium',
                    summary: verification.summary,
                    aiVerified: true,
                    date: new Date().toLocaleDateString(),
                    timestamp: new Date(),
                    hasImage: hasImage
                });

                setTimeout(() => {
                    addMessageToChat(`<strong>Complaint Submitted!</strong><br>Reference ID: #${docRef.id.slice(0, 6)}`, 'bot');
                    APP_STATE.complaintStage = 0; // Reset

                    // Clear Image
                    fileUpload.value = '';
                    imagePreviewContainer.style.display = 'none';
                }, 1000);
            } catch (error) {
                showToast('Error filing complaint', 'error');
                console.error(error);
                APP_STATE.complaintStage = 0;
            }
        } else {
            setTimeout(() => {
                addMessageToChat(`Complaint cancelled. You can start over by selecting a category.`, 'bot');
                APP_STATE.complaintStage = 0;
                APP_STATE.complaintDraft = {};
            }, 500);
        }
        return;
    }

    // Fallback
    addMessageToChat("Please select a category to start a new complaint.", 'bot');
}

function addMessageToChat(text, sender, image = null) {
    const div = document.createElement('div');
    div.className = `message ${sender}-message`;
    let imgHtml = '';
    if (image) {
        imgHtml = `<div class="chat-image"><img src="${image}" style="max-width:100%; border-radius:8px; margin-bottom:5px;"></div>`;
    }
    const avatarIcon = sender === 'bot' ? 'smart_toy' : 'person';
    div.innerHTML = `
            <div class="message-avatar"><span class="material-icons-round">${avatarIcon}</span></div>
            <div class="message-content">
                ${imgHtml}
                <p>${text}</p>
                <span class="message-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
        `;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// --- Modal Logic ---
const modal = document.getElementById('complaint-modal');
const closeModalBtn = document.querySelector('.close-modal');

if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
        modal.classList.remove('show');
    });
}

// Close on outside click
window.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('show');
});

function openModal(complaint) {
    document.getElementById('modal-status').textContent = complaint.status;
    document.getElementById('modal-status').className = `status-badge status-${complaint.status.toLowerCase().replace(' ', '-')}`;
    document.getElementById('modal-date').textContent = complaint.date;
    document.getElementById('modal-category').textContent = complaint.category;
    document.getElementById('modal-desc').textContent = complaint.description;

    const updates = complaint.adminNote || 'No status updates available from the department yet.';
    document.getElementById('modal-update').textContent = updates;

    modal.classList.add('show');
}

// --- History Logic ---
// --- History Logic ---
async function loadHistory() {
    if (!APP_STATE.currentUser) return;

    complaintsList.innerHTML = '<div class="text-center" style="padding:20px;">Loading...</div>';

    // Demo Mode Fallback
    if (APP_STATE.currentUser.uid === 'demo_user_123') {
        complaintsList.innerHTML = '';
        const demoItem = document.createElement('div');
        demoItem.className = 'history-card';
        demoItem.innerHTML = `
                <div>
                    <h4 style="margin-bottom:5px;">Road Issues <span style="font-weight:normal; font-size:0.8em; color:var(--text-secondary);">#DEMO123</span></h4>
                    <p style="font-size:0.9em; color:var(--text-secondary); margin-bottom:5px;">Large pothole near main market...</p>
                    <small style="color:var(--text-muted);">12/12/2025</small>
                </div>
                <div style="text-align:right;">
                    <div class="status-badge status-pending" style="margin-bottom:10px;">Pending</div>
                    <button class="btn btn-sm btn-secondary view-btn">View Details</button>
                </div>`;

        demoItem.querySelector('.view-btn').addEventListener('click', () => {
            openModal({
                status: 'Pending',
                date: '12/12/2025',
                category: 'Road Issues',
                description: 'Large pothole near main market causing traffic jams.',
                adminNote: 'Scheduled for inspection on 15/12/2025.'
            });
        });

        complaintsList.appendChild(demoItem);
        return;
    }

    const q = query(
        collection(db, "complaints"),
        where("userId", "==", APP_STATE.currentUser.uid)
    );

    try {
        const querySnapshot = await getDocs(q);
        complaintsList.innerHTML = '';

        if (querySnapshot.empty) {
            complaintsList.innerHTML = `
                    <div class="empty-state" style="text-align:center; padding:40px; color:var(--text-secondary);">
                        <span class="material-icons-round" style="font-size:48px; opacity:0.5;">history</span>
                        <p>No complaints found yet.</p>
                    </div>`;
            return;
        }

        // Convert to array and sort client-side (Newest First)
        const complaints = [];
        querySnapshot.forEach((doc) => {
            complaints.push({ id: doc.id, ...doc.data() });
        });

        // Sort by timestamp (descending)
        complaints.sort((a, b) => {
            const timeA = a.timestamp ? a.timestamp.seconds : 0;
            const timeB = b.timestamp ? b.timestamp.seconds : 0;
            return timeB - timeA;
        });

        complaints.forEach((c) => {
            const card = document.createElement('div');
            card.className = 'history-card';
            card.innerHTML = `
                    <div>
                        <h4 style="margin-bottom:5px;">${c.category} <span style="font-weight:normal; font-size:0.8em; color:var(--text-secondary);">#${c.id.slice(0, 6)}</span></h4>
                        <p style="font-size:0.9em; color:var(--text-secondary); margin-bottom:5px;">${c.description.substring(0, 40)}${c.description.length > 40 ? '...' : ''}</p>
                        <small style="color:var(--text-muted);">${c.date}</small>
                    </div>
                    <div style="text-align:right;">
                        <button class="btn btn-sm btn-icon delete-btn" title="Delete" style="background:transparent; color:#ef4444; margin-bottom:5px;">
                            <span class="material-icons-round">delete</span>
                        </button>
                        <div class="status-badge status-${c.status.toLowerCase().replace(' ', '-')}" style="margin-bottom:10px;">${c.status}</div>
                        <button class="btn btn-sm btn-secondary view-details-btn">View Details</button>
                    </div>
                `;

            card.querySelector('.view-details-btn').addEventListener('click', () => {
                openModal(c);
            });

            card.querySelector('.delete-btn').addEventListener('click', async (e) => {
                e.stopPropagation();
                if (confirm('Are you sure you want to delete this complaint? This cannot be undone.')) {
                    try {
                        await deleteDoc(doc(db, "complaints", c.id));
                        showToast('Complaint deleted successfully', 'success');
                        loadHistory(); // Refresh list
                    } catch (err) {
                        console.error("Error deleting doc:", err);
                        showToast('Error deleting complaint', 'error');
                    }
                }
            });

            complaintsList.appendChild(card);
        });
    } catch (error) {
        console.error("Error loading history:", error);
        complaintsList.innerHTML = `
            <div style="text-align:center;color:var(--danger); padding: 20px;">
                <p><strong>Error loading data:</strong> ${error.message}</p>
            </div>`;
    }
}

// --- Profile Logic ---
function loadProfile() {
    const user = APP_STATE.userProfile;
    if (!user) return;

    document.getElementById('profile-name-display').textContent = user.username;
    document.getElementById('profile-username').value = user.username;
    document.getElementById('profile-phone').value = user.phone;
    document.getElementById('profile-aadhar').value = user.aadhar;
    document.getElementById('profile-address').value = user.address;
}

function toggleProfileEdit() {
    const inputs = document.querySelectorAll('.profile-input');
    const actions = document.getElementById('profile-save-actions');
    const editBtn = document.getElementById('edit-profile-btn');
    const isDisabled = inputs[0].disabled;

    inputs.forEach(input => input.disabled = !isDisabled);

    if (isDisabled) {
        actions.style.display = 'flex';
        editBtn.style.display = 'none';
    } else {
        actions.style.display = 'none';
        editBtn.style.display = 'inline-flex';
        loadProfile();
    }
}

// --- Map Logic ---
function initMap() {
    if (map) return; // Already initialized

    // Default: New Delhi (Can be user's profile city in future)
    map = L.map('map-container').setView([28.6139, 77.2090], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    map.on('click', async (e) => {
        const { lat, lng } = e.latlng;
        selectedLat = lat;
        selectedLng = lng;

        if (marker) {
            marker.setLatLng([lat, lng]);
        } else {
            marker = L.marker([lat, lng]).addTo(map);
        }

        document.getElementById('selected-address').textContent = "Fetching address...";
        confirmLocationBtn.disabled = true;

        // Reverse Geocode
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const data = await response.json();
            if (data && data.display_name) {
                selectedAddressText = data.display_name;
                document.getElementById('selected-address').textContent = selectedAddressText;
                confirmLocationBtn.disabled = false;
            } else {
                document.getElementById('selected-address').textContent = "Address not found. Try another spot.";
            }
        } catch (error) {
            console.error(error);
            document.getElementById('selected-address').textContent = "Error fetching address.";
        }
    });
}

function openMapPicker() {
    mapModal.classList.add('show');
    // Leaflet needs visible container to size correctly. Wait for fade-in (300ms)
    setTimeout(() => {
        initMap();
        map.invalidateSize();
    }, 400);
}

async function saveProfile(e) {
    e.preventDefault();
    const username = document.getElementById('profile-username').value;
    const phone = document.getElementById('profile-phone').value;
    const aadhar = document.getElementById('profile-aadhar').value;
    const address = document.getElementById('profile-address').value;

    try {
        const userRef = doc(db, "users", APP_STATE.currentUser.uid);
        await updateDoc(userRef, {
            username, phone, aadhar, address
        });

        APP_STATE.userProfile = { ...APP_STATE.userProfile, username, phone, aadhar, address };
        toggleProfileEdit();
        showToast('Profile updated successfully!', 'success');
        document.getElementById('nav-avatar').textContent = username[0].toUpperCase();
    } catch (error) {
        showToast('Error updating profile', 'error');
        console.error(error);
    }
}

function showToast(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icon = type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info';
    toast.innerHTML = `<span class="material-icons-round">${icon}</span> ${msg}`;
    toast.style.cssText = `
            background: rgba(30, 41, 59, 0.9);
            border-left: 4px solid ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#0ea5e9'};
            color: white; padding: 16px 24px; margin-bottom: 10px; border-radius: 8px;
            display: flex; align-items: center; gap: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: slideIn 0.3s ease; min-width: 300px;
        `;
    container.style.cssText = "position: fixed; top: 20px; right: 20px; z-index: 9999;";
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

