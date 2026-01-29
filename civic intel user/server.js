const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

const app = express();
const PORT = process.env.PORT || 5000;

// Secure API Key - Should be moved to environment variable in production
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AIzaSyDHfpLLDzBmkaGChU4HsJ-3cb7lET4N_x0";

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin SDK (Optional - for advanced backend features)
// Setup Guide: https://firebase.google.com/docs/admin/setup
/*
try {
    const serviceAccount = require('./service-account-key.json');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log("Firebase Admin Initialized");
} catch (error) {
    console.log("Firebase Admin not initialized (Missing keys)");
}
*/

// Basic Routes
app.get('/', (req, res) => {
    res.send('Civic-Intel-OS Backend Running');
});

app.get('/api/status', (req, res) => {
    res.json({
        status: 'active',
        timestamp: new Date(),
        service: 'Civic Grievance Portal API'
    });
});

// Example API Endpoint: Get System Stats (Mock)
app.get('/api/stats', (req, res) => {
    res.json({
        totalComplaints: 1250,
        resolved: 980,
        pending: 270
    });
});

// Secure Gemini API Proxy Endpoint
app.post('/api/verify-complaint', async (req, res) => {
    const { location, description, category } = req.body;

    if (!location || !description || !category) {
        return res.status(400).json({
            isValid: false,
            feedback: "Missing required fields: location, description, or category."
        });
    }

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
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            }
        );

        const data = await response.json();

        if (!data.candidates || !data.candidates[0]) {
            return res.status(500).json({
                isValid: true,
                feedback: "AI returned unexpected response. Proceeding with manual review.",
                severity: "Medium"
            });
        }

        const text = data.candidates[0].content.parts[0].text;
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const result = jsonMatch
            ? JSON.parse(jsonMatch[0])
            : { isValid: false, feedback: "AI Verification failed to parse." };

        // Ensure summary exists if valid
        if (result.isValid && !result.summary) {
            result.summary = description.substring(0, 50) + "...";
        }

        res.json(result);
    } catch (error) {
        console.error("Gemini API Error:", error);
        res.json({
            isValid: true,
            feedback: "AI Offline. Proceeding with manual review.",
            severity: "Medium"
        });
    }
});

// New endpoint: Analyze user response during confirmation (context-aware)
app.post('/api/analyze-confirmation', async (req, res) => {
    const { userResponse, currentComplaint } = req.body;

    const prompt = `
    You are analyzing a user's response during a complaint confirmation flow.
    
    Current Complaint Details:
    - Category: ${currentComplaint.category}
    - Location: ${currentComplaint.location}
    - Description: ${currentComplaint.description}
    - Current Severity: ${currentComplaint.severity}
    - Current Summary: ${currentComplaint.summary || 'Not provided'}
    
    User's Response: "${userResponse}"
    
    Determine the user's intent:
    1. CONFIRM - User wants to submit (said yes, ok, confirm, submit, etc.)
    2. CANCEL - User wants to cancel (said no, cancel, stop, etc.)
    3. UPDATE - User is providing ADDITIONAL context or correcting the severity (e.g., mentioning peak hours, emergency, urgency, more details)
    
    If UPDATE: Re-assess the severity based on the new information and generate an updated summary.
    
    Output strictly in JSON format (NO Markdown, NO Backticks):
    {
        "intent": "CONFIRM" | "CANCEL" | "UPDATE",
        "updatedSeverity": "High" | "Medium" | "Low" (only if intent is UPDATE),
        "updatedSummary": "string (only if intent is UPDATE - incorporate the new details)",
        "feedback": "string (brief acknowledgment of what was understood)"
    }
    `;

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            }
        );

        const data = await response.json();

        if (!data.candidates || !data.candidates[0]) {
            // Fallback: treat as CONFIRM if contains confirmation words
            const lower = userResponse.toLowerCase();
            if (lower.includes('yes') || lower.includes('confirm') || lower.includes('ok')) {
                return res.json({ intent: 'CONFIRM', feedback: 'Proceeding with submission.' });
            }
            if (lower.includes('no') || lower.includes('cancel')) {
                return res.json({ intent: 'CANCEL', feedback: 'Complaint cancelled.' });
            }
            return res.json({ intent: 'UPDATE', feedback: 'Additional context noted.' });
        }

        const text = data.candidates[0].content.parts[0].text;
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const result = jsonMatch
            ? JSON.parse(jsonMatch[0])
            : { intent: 'CONFIRM', feedback: 'Proceeding with submission.' };

        res.json(result);
    } catch (error) {
        console.error("AI Intent Analysis Error:", error);
        // Fallback logic
        const lower = userResponse.toLowerCase();
        if (lower.includes('yes') || lower.includes('confirm') || lower.includes('ok')) {
            res.json({ intent: 'CONFIRM', feedback: 'Proceeding with submission.' });
        } else if (lower.includes('no') || lower.includes('cancel')) {
            res.json({ intent: 'CANCEL', feedback: 'Complaint cancelled.' });
        } else {
            res.json({ intent: 'UPDATE', feedback: 'Additional context noted.', updatedSeverity: 'High' });
        }
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
