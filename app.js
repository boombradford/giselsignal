const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const titles = {
  'timeline': 'Timeline',
  'map': 'Cassini Coordinates',
  'graph': 'Vault'
};

function tabSetup() {
  $$('.nav-btn').forEach(b => {
    b.onclick = () => {
      // Manage active states
      $$('.nav-btn').forEach(x => x.classList.remove('active'));
      $$('.tab').forEach(x => x.classList.remove('active'));
      $$('.control-group').forEach(x => x.classList.remove('active'));

      b.classList.add('active');
      const tabId = b.dataset.tab;
      const tabTarget = $('#' + tabId);
      if (tabTarget) tabTarget.classList.add('active');

      // Update contextual heading
      $('#current-view-title').textContent = titles[tabId] || 'Dashboard View';

      // Reveal associated controls
      if (tabId === 'timeline' && $('#timeline-controls')) {
        $('#timeline-controls').classList.add('active');
      }
    };
  });
}

async function loadJSON(p) {
  try {
    const r = await fetch(p);
    return await r.json();
  } catch (e) {
    console.error(`Failed to load Data from ${p}`, e);
    return [];
  }
}

function renderTimeline(events) {
  const wrap = $('#timelineList');
  const q = ($('#timelineSearch').value || '').toLowerCase();
  wrap.innerHTML = '';

  if (!events || !events.length) return;

  events.filter(e => JSON.stringify(e).toLowerCase().includes(q)).forEach(e => {
    const d = document.createElement('div');
    d.className = 'card';

    // Format description text with paragraphs instead of raw text
    const descText = e.description || e.event || 'No detailed description.';
    const formattedDesc = descText.split('\n').filter(p => p.trim() !== '').map(p => `<p style="margin: 0; padding-bottom: 8px;">${p.trim()}</p>`).join('');

    d.innerHTML = `
      <div class="card-title">
        <span>${e.date || 'Undated Period'}</span>
      </div>
      <div class="card-body" style="display: flex; flex-direction: column;">${formattedDesc}</div>
      <div class="card-meta">
        ${e.event ? `<span>EVENT ID: ${e.event}</span>` : '<span>UNKNOWN</span>'}
      </div>
    `;
    wrap.appendChild(d);
  });
}

function renderGraph(connections) {
  const wrap = $('#graphList');
  wrap.innerHTML = '';

  if (!connections || !connections.length) return;

  connections.sort((a, b) => (b.weight || 0) - (a.weight || 0)).slice(0, 180).forEach(c => {
    const d = document.createElement('div');
    d.className = 'card';
    d.innerHTML = `
      <div class="card-title">
      <span>${c.node} &rarr; ${c.related_node}</span>
      </div>
      <div class="card-body blur-text">${c.notes || 'Connection notes obscured or unavailable.'}</div>
      <div class="card-meta">
        <span>WEIGHT ${c.weight || 0}</span>
        ${c.date ? `<span>${c.date}</span>` : ''}
      </div>
    `;
    wrap.appendChild(d);
  });
}



function initMap(geo) {
  const container = L.DomUtil.get('mapView');
  if (container != null) container._leaflet_id = null;

  const map = L.map('mapView', {
    zoomControl: false
  }).setView([28, 30], 2);

  L.control.zoom({ position: 'bottomright' }).addTo(map);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://carto.com/">CartoDB</a>'
  }).addTo(map);

  const points = [];
  if (geo && geo.features) {
    geo.features.forEach(f => {
      if (!f.geometry || !f.geometry.coordinates) return;
      const [lon, lat] = f.geometry.coordinates;
      const p = f.properties || {};

      const m = L.circleMarker([lat, lon], {
        radius: 5,
        color: '#0A84FF',
        fillColor: '#0A84FF',
        fillOpacity: 0.8,
        weight: 1
      }).addTo(map);

      m.bindPopup(`
      <div style="font-family: 'Inter', sans-serif; padding: 4px; width: 220px;">
            <b style="color: #111; font-size: 14px; display:block; margin-bottom:4px;">${p.id || 'Data Point'}</b>
            <span style="color: #666; font-size: 12px; display:block; margin-bottom: 8px;">${p.event_type || 'Unknown Event'}</span>
            <div style="width: 100%; height: 120px; border-radius: 6px; overflow: hidden; margin-bottom: 6px;">
              <iframe width="100%" height="100%" frameborder="0" scrolling="no" marginheight="0" marginwidth="0" src="https://maps.google.com/maps?q=${lat},${lon}&hl=en&z=14&t=k&output=embed"></iframe>
            </div>
            <span style="color: #888; font-size: 11px; display:block;">${lat.toFixed(5)}, ${lon.toFixed(5)}</span>
        </div>
      `);
      points.push([lat, lon]);
    });
  }

  let boundsFitted = false;
  $$('button[data-tab="map"]').forEach(b => {
    b.addEventListener('click', () => {
      setTimeout(() => {
        map.invalidateSize();
        if (!boundsFitted && points.length) {
          map.fitBounds(points, { padding: [40, 40] });
          boundsFitted = true;
        }
      }, 150);
    });
  });

  if (container.offsetWidth > 0 && points.length) {
    map.fitBounds(points, { padding: [40, 40] });
    boundsFitted = true;
  }
}

(async function main() {
  tabSetup();

  try {
    const events = window.EVENTS_DATA || [];
    const connections = window.CONNECTIONS_DATA || [];
    const geo = window.MAP_DATA || {};

    renderTimeline(events);
    renderGraph(connections);
    initMap(geo);

    if ($('#timelineSearch')) {
      $('#timelineSearch').addEventListener('input', () => renderTimeline(events));
    }
  } catch (err) {
    console.error("Boot sequence failed loading JSON targets.", err);
  }
})();