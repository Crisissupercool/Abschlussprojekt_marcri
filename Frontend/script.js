document.addEventListener('DOMContentLoaded', function() {
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
  
      const fetchGeoJSONEvents = async () => {
          const response = await fetch('/api/geojson-events');
          if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`Fehler beim Abrufen der GeoJSON-Events: ${response.status} ${response.statusText} - ${errorText}`);
          }
          return response.json();
      };
  
      const main = async () => {
          setLoading(true);
          try {
              const userFeeds = await fetchUserFeeds();
              document.getElementById('userFeeds').innerHTML = '<h2>Natural Disaster Feed</h2>';
              userFeeds.forEach(feed => {
                  document.getElementById('userFeeds').innerHTML += `<p class="desc">${feed.description}</p>`;
              });
  
              const geoJSONEvents = await fetchGeoJSONEvents();
              document.getElementById('geoJSONEvents').innerHTML = '<h2>Disasters around the world</h2>';
              geoJSONEvents.forEach(event => {
                  document.getElementById('geoJSONEvents').innerHTML += `<div class="disaster">
                      <p class="halloballo"><strong>Event Name:</strong> ${event.eventName}</p>
                      <p class="halloballo"><strong>Description:</strong> ${event.description}</p>
                      <p class="halloballo"><strong>Location:</strong> ${event.location}</p>
                      <p class="halloballo"><strong>Severity:</strong> ${event.severity}</p>
                      <p class="halloballo"><strong>Affected Population:</strong> ${event.affectedPopulation}</p>
                      <p class="halloballo"><strong>Updated At:</strong> ${event.updatedAt}</p>
                      <p class="halloballo"><strong>External URLs:</strong> ${event.externalUrls.map(url => `<a href="${url}" target="_blank">${url}</a>`).join(', ')}</p>
                      </div>
                  `;
              });
          } catch (error) {
              console.error(error);
              displayError(error.message);
          } finally {
              setLoading(false);
          }
      };
  
      main();
  });