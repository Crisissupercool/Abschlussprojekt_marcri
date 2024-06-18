import express from 'express';
import fetch from 'node-fetch';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = 3000;

app.use(bodyParser.json());

// Serve static files from the frontend directory (ChatGPT command: Wie kann ich die Anmeldedaten vom Frontend ins Backend bewegen)
app.use(express.static(path.join(__dirname, '../frontend')));

const authUrl = 'https://keycloak01.kontur.io/auth/realms/kontur/protocol/openid-connect/token';
const clientId = 'kontur_platform';
const username = 'cristian.martin@bluewin.ch';
const password = 'denista1';

const getToken = async () => {
    const response = await fetch(authUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            client_id: clientId,
            grant_type: 'password',
            username: username,
            password: password
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Fehler beim Abrufen des Tokens: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    return data.access_token;
};

const getUserFeeds = async (token) => {
    const response = await fetch('https://apps.kontur.io/events/v1/user_feeds', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Fehler beim Abrufen der Benutzer-Feeds: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
};

const getGeoJSONEvents = async (token) => {
    const response = await fetch('https://disaster.ninja/active/api/events?limit=20&offset=0&feed=kontur-public', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Fehler beim Abrufen der GeoJSON-Events: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
};

app.get('/api/feeds', async (req, res) => {
    try {
        const token = await getToken();
        const userFeeds = await getUserFeeds(token);
        res.json(userFeeds);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

app.get('/api/geojson-events', async (req, res) => {
    try {
        const token = await getToken();
        const geoJSONEvents = await getGeoJSONEvents(token);
        res.json(geoJSONEvents);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

app.listen(port, () => {
    console.log(`http://localhost:${port}`);
});