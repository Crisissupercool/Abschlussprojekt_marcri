import express from 'express';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';
import path from 'path';
import { LanguageServiceClient } from '@google-cloud/language';
import { PredictionServiceClient } from '@google-cloud/aiplatform';

const app = express();
const port = 3000;
app.set('view engine', 'ejs');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(bodyParser.json());

// Serve static files from the frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

const PROJECT_ID = 'wide-origin-426109-h4';
const location = 'europe-west6-a';
const modelId = 'gemini-1.5-pro-001';

// Initialize PredictionServiceClient with the full endpoint
const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${location}/publishers/google/models/${modelId}`;
const predictionClient = new PredictionServiceClient({
  apiEndpoint: `${location}-aiplatform.googleapis.com`
});

const apiKey = "28dd2111720337a86ce6abda3142b0b722efa056"; // Replace with your actual API key

fetch('https://example.googleapis.com/v1/resource', {
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${apiKey}`, // This is a common way to pass API keys, adjust based on the service's documentation
        'Content-Type': 'application/json'
    }
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));

app.post('/api/analyze-disaster', async (req, res) => {
    try {
        console.log('Analyze Disaster Request:', req.body);
        const { userChosenDisaster } = req.body;

        // Analyze sentiment of the text using Google Cloud Language API
        const client = new LanguageServiceClient();

        // Define the document object
        const document = {
            type: 'PLAIN_TEXT', // Set the type to PLAIN_TEXT
            content: `Analyze the following Natural Disaster: ${userChosenDisaster}`, // Set the content of the document
        };

        // Analyze sentiment of the document
        const [sentimentResult] = await client.analyzeSentiment({ document });
        const sentiment = sentimentResult.documentSentiment;

        // Adjusted request body for the Gemini model
        const instance = {
            content: userChosenDisaster
        };

        const predictionRequest = {
            endpoint: endpoint,
            instances: [instance],
            parameters: {
                safetySettings: [
                    {
                        category: "HARM_CATEGORY_HATE_SPEECH",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        category: "HARM_CATEGORY_HARASSMENT",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    }
                ]
            }
        };

        // Generate suggestions using Google Cloud Vertex AI Generative Model
        const [response] = await predictionClient.predict(predictionRequest);
        const contentResponse = response.predictions[0]?.content || '';

        // Return the sentiment results and generated suggestions
        res.json({ sentiment, mitigationSuggestions: contentResponse });
    } catch (error) {
        console.error('Error analyzing disaster:', error);
        res.status(500).json({ error: 'Error analyzing disaster' });
    }
});

// Endpoint for text generation
app.post('/api/generate-text', async (req, res) => {
    try {
        const { prompt } = req.body;

        // Use Gemini for text generation
        const generatedText = await gemini.generateText(prompt);

        // Return the generated text
        res.json({ text: generatedText });
    } catch (error) {
        console.error('Error generating text:', error);
        res.status(500).json({ error: 'Error generating text' });
    }
});

// Disaster API Authentication
const authUrl = 'https://keycloak01.kontur.io/auth/realms/kontur/protocol/openid-connect/token';
const clientId = 'kontur_platform';
const username = 'cristian.martin@bluewin.ch';
const password = 'denista1';

const getToken = async () => {
    const response = await fetch(authUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            client_id: clientId,
            grant_type: 'password',
            username: username,
            password: password,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error getting token: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    return data.access_token;
};

const getUserFeeds = async (token) => {
    const response = await fetch('https://apps.kontur.io/events/v1/user_feeds', {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error getting user feeds: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
};

const getGeoJSONEvents = async (token, offset, limit) => {
    const response = await fetch(`https://disaster.ninja/active/api/events?limit=${limit}&offset=${offset}&feed=kontur-public`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error getting GeoJSON events: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
};

// Endpoint for user feeds
app.get('/api/feeds', async (req, res) => {
    try {
        const token = await getToken();
        const userFeeds = await getUserFeeds(token);
        res.json(userFeeds);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Endpoint for GeoJSON events
app.get('/api/geojson-events', async (req, res) => {
    try {
        const { offset = 0, limit = 5 } = req.query;
        const token = await getToken();
        const geoJSONEvents = await getGeoJSONEvents(token, offset, limit);
        res.json(geoJSONEvents);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});