document.addEventListener('DOMContentLoaded', function() {
    let offset = 0;
    const limit = 5;
    let disastersData = [];

    const displayError = (message) => {
        document.getElementById('error').innerHTML = `<p class="error">${message}</p>`;
    };

    const setLoading = (isLoading) => {
        document.getElementById('loading').style.display = isLoading ? 'block' : 'none';
    };

    const fetchUserFeeds = async () => {
        const response = await fetch('/api/feeds');
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Fehler beim Abrufen der Benutzer-Feeds: ${response.status} ${response.statusText} - ${errorText}`);
        }
        return response.json();
    };

    const fetchGeoJSONEvents = async (offset, limit) => {
        const response = await fetch(`/api/geojson-events?offset=${offset}&limit=${limit}`);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Fehler beim Abrufen der GeoJSON-Events: ${response.status} ${response.statusText} - ${errorText}`);
        }
        return response.json();
    };

    const analyzeDisaster = async (text) => {
        try {
            const response = await fetch('/api/analyze-disaster', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text }),
            });

            if (!response.ok) {
                throw new Error('Fehler bei der Analyse des Ereignisses');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error(error);
            return { error: 'Fehler bei der Analyse' };
        }
    };

    const renderEvents = () => {
        const geoJSONEventsContainer = document.getElementById('geoJSONEvents');
        geoJSONEventsContainer.innerHTML = '';
        disastersData.forEach(event => {
            geoJSONEventsContainer.innerHTML += `
                <div class="disaster">
                    <p class="halloballo"><strong>Event Name:</strong> ${event.eventName}</p>
                    <p class="halloballo"><strong>Description:</strong> ${event.description}</p>
                    <p class="halloballo"><strong>Location:</strong> ${event.location}</p>
                    <p class="halloballo"><strong>Severity:</strong> ${event.severity}</p>
                    <p class="halloballo"><strong>Affected Population:</strong> ${event.affectedPopulation}</p>
                    <p class="halloballo"><strong>Updated At:</strong> ${event.updatedAt}</p>
                    <p class="halloballo"><strong>External URLs:</strong> ${event.externalUrls.map(url => `<a href="${url}" target="_blank">${url}</a>`).join(', ')}</p>
                    <button class="analyzeButton" data-description="${event.description}">Analyze</button>
                </div>
            `;
        });
    };

    const main = async () => {
        setLoading(true);
        try {
            const userFeeds = await fetchUserFeeds();
            document.getElementById('userFeeds').innerHTML = '<h2>Natural Disaster Feed</h2>';
            userFeeds.forEach(feed => {
                document.getElementById('userFeeds').innerHTML += `<p class="desc">${feed.description}</p>`;
            });

            const geoJSONEvents = await fetchGeoJSONEvents(offset, limit);
            disastersData = geoJSONEvents;
            renderEvents();
        } catch (error) {
            console.error(error);
            displayError(error.message);
        } finally {
            setLoading(false);
        }
    };

    main();
    document.getElementById('geoJSONEvents').addEventListener('click', async (event) => {
        if (event.target.classList.contains('analyzeButton')) {
            const description = event.target.dataset.description;
            console.log('Description:', description); // Konsolenausgabe hinzugefügt
            const analysis = await analyzeDisaster(description);
            console.log('Analysis:', analysis); // Konsolenausgabe hinzugefügt
            // Hier kannst du die Analyseergebnisse weiterverarbeiten, z.B. anzeigen
        }
    });
    
});
