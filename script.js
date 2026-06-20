const RSS_FEEDS = {
    coulthart: "https://nitter.net/rosscoulthart/rss",
    knapp: "https://nitter.net/g_knapp/rss",
    elizondo: "https://nitter.net/LueElizondo/rss",
    nolan: "https://nitter.net/GarryPNolan/rss",
    loeb: "https://nitter.net/ProfAviLoeb/rss"
};

// Funktion zum sicheren Escapen von HTML (optional, aber sicherer)
function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Lädt die RSS-Feeds über rss2json API
async function loadFeed(feedKey, clickedButton) {
    // Visuelles Feedback für aktiven Button
    document.querySelectorAll('.feed-selector button').forEach(btn => {
        btn.classList.remove('active');
    });
    if (clickedButton) clickedButton.classList.add('active');
    
    const feedUrl = RSS_FEEDS[feedKey];
    if (!feedUrl) {
        document.getElementById("feed-content").innerHTML = `<p class="error">Feed nicht gefunden.</p>`;
        return;
    }
    
    document.getElementById("feed-content").innerHTML = `<p class="no-articles">Lade Feed... 🛸</p>`;
    
    try {
        const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`;
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        if (!data.items || data.items.length === 0) {
            document.getElementById("feed-content").innerHTML = `<p class="no-articles">Keine Artikel in diesem Feed gefunden.</p>`;
            return;
        }
        
        let feedHTML = "";
        data.items.forEach(item => {
            // Bereinige die Beschreibung (HTML-Tags entfernen und kürzen)
            let cleanDescription = item.description 
                ? item.description.replace(/<[^>]*>/g, '').substring(0, 300) + '...' 
                : 'Keine Beschreibung verfügbar.';
            
            // Datum formatieren
            let formattedDate = '';
            if (item.pubDate) {
                try {
                    const dateObj = new Date(item.pubDate);
                    if (!isNaN(dateObj.getTime())) {
                        formattedDate = dateObj.toLocaleDateString('de-DE', { 
                            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                        });
                    }
                } catch(e) {
                    formattedDate = item.pubDate;
                }
            }
            
            const title = item.title || "Ohne Titel";
            const link = item.link || "#";
            
            feedHTML += `
                <div class="feed-item">
                    <h3><a href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer">${escapeHtml(title)}</a></h3>
                    <p>${escapeHtml(cleanDescription)}</p>
                    <small>🕒 ${escapeHtml(formattedDate)}</small>
                </div>
            `;
        });
        
        document.getElementById("feed-content").innerHTML = feedHTML;
        
    } catch (error) {
        console.error("Feed-Fehler:", error);
        document.getElementById("feed-content").innerHTML = `<p class="error">Fehler beim Laden des Feeds. Möglicherweise ist nitter.net nicht erreichbar oder die API blockiert.</p>`;
    }
}

// Lädt die eigenen Texte aus der texte.json Datei im selben Verzeichnis
async function loadOwnTexts(clickedButton) {
    document.querySelectorAll('.feed-selector button').forEach(btn => {
        btn.classList.remove('active');
    });
    if (clickedButton) clickedButton.classList.add('active');
    
    document.getElementById("feed-content").innerHTML = `<p class="no-articles">Lade eigene Texte... 📝</p>`;
    
    try {
        // Wichtig: Die texte.json muss im selben Verzeichnis wie die index.html liegen.
        const response = await fetch('texte.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        // Sortiert die Texte nach Datum absteigend (neuster zuerst)
        // Erwartet ein Array von Objekten mit "date" (String) und "text" (String)
        if (!Array.isArray(data) || data.length === 0) {
            document.getElementById("feed-content").innerHTML = `<p class="no-articles">Noch keine eigenen Texte vorhanden. Bearbeite die texte.json in deinem Repository.</p>`;
            return;
        }
        
        data.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        let textHTML = "";
        data.forEach(item => {
            // Datum formatieren
            let formattedDate = 'Datum unbekannt';
            if (item.date) {
                try {
                    const dateObj = new Date(item.date);
                    if (!isNaN(dateObj.getTime())) {
                        formattedDate = dateObj.toLocaleDateString('de-DE', { 
                            year: 'numeric', month: 'long', day: 'numeric' 
                        });
                    }
                } catch(e) {
                    formattedDate = item.date;
                }
            }
            
            const title = item.title || "Ohne Titel";
            const text = item.text || "Kein Textinhalt.";
            // Wandelt Zeilenumbrüche in <br> Tags um
            const textWithBreaks = escapeHtml(text).replace(/\n/g, '<br>');
            
            textHTML += `
                <div class="own-text-item">
                    <small class="text-date">📅 ${escapeHtml(formattedDate)}</small>
                    <h3>${escapeHtml(title)}</h3>
                    <p>${textWithBreaks}</p>
                </div>
            `;
        });
        
        document.getElementById("feed-content").innerHTML = textHTML;
        
    } catch (error) {
        console.error("Fehler beim Laden der eigenen Texte:", error);
        document.getElementById("feed-content").innerHTML = `
            <div class="error">
                <p>Fehler beim Laden der eigenen Texte.</p>
                <p>Stelle sicher, dass die Datei <strong>texte.json</strong> im selben Verzeichnis existiert und gültiges JSON enthält.</p>
                <p>Beispielstruktur:</p>
                <pre style="background:#111;padding:10px;text-align:left;overflow:auto;">
[
  {
    "date": "2024-05-20",
    "title": "Mein erster Eintrag",
    "text": "Hier steht der Inhalt meines Textes.\\nEr kann auch mehrere Zeilen haben."
  },
  {
    "date": "2024-05-18",
    "title": "Gedanken zum Haschismus",
    "text": "Dies ist ein weiterer Eintrag."
  }
]</pre>
            </div>
        `;
    }
}

// Startet direkt mit "Eigene Texte"
document.addEventListener('DOMContentLoaded', () => {
    const ownTextsButton = document.getElementById('own-texts-btn');
    if (ownTextsButton) {
        loadOwnTexts(ownTextsButton);
    } else {
        document.getElementById("feed-content").innerHTML = `<p class="no-articles">Bereit. Wähle einen Feed oder eigene Texte.</p>`;
    }
});
