const fs = require('fs');
const path = require('path');

const FL_DIR = '/Users/zachgrzeskowiak/Projects/FL - AG';
const CONN_FILE = '/Users/zachgrzeskowiak/Projects/gisel-signal/data/connections.js';

let content = fs.readFileSync(CONN_FILE, 'utf-8');
let jsonStr = content.replace('window.CONNECTIONS_DATA = ', '');
if(jsonStr.endsWith(';')) jsonStr = jsonStr.slice(0, -1);
let connections = JSON.parse(jsonStr);

function addConn(node, relatedNode, weight, notes, date = '') {
    connections.push({
        node_type: 'concept',
        node,
        related_node_type: 'concept',
        related_node: relatedNode,
        date,
        source_url: '',
        weight,
        notes
    });
}

// Parse Giselian Encounters.txt
try {
  let d = JSON.parse(fs.readFileSync(path.join(FL_DIR, 'Giselian Encounters.txt'), 'utf-8'));
  d.events.forEach(e => addConn('Giselians', e.event || e.location || 'Encounter', 15.0, e.description, e.date));
  d.projects.forEach(p => addConn('Project', p.name, 12.0, p.description));
  d.facilities.forEach(f => addConn('Facility', f.name, 10.0, f.description));
} catch(e) {}

// Parse LyAV.txt
try {
  let d = JSON.parse(fs.readFileSync(path.join(FL_DIR, 'LyAV.txt'), 'utf-8'));
  addConn('Supercomputer', 'LyAv', 20.0, d.Lyav.Classification);
  d.Lyav.Usage.forEach(u => addConn('LyAv', u, 10.0, 'LyAv Usage'));
} catch(e) {}

// Parse Queltron Machine History.txt
try {
  let d = JSON.parse(fs.readFileSync(path.join(FL_DIR, 'Queltron Machine History.txt'), 'utf-8'));
  addConn('Superconducting Super Collider', 'Desertron', 18.0, d.Superconducting_Super_Collider.aim);
  addConn('Desertron', 'Magnablend', 8.0, d.Superconducting_Super_Collider.post_cancellation['2012_buyer']);
} catch(e) {}

// Parse Queltron Machine.txt
try {
  let d = JSON.parse(fs.readFileSync(path.join(FL_DIR, 'Queltron Machine.txt'), 'utf-8'));
  addConn('Queltron Machine', 'Quantum Computer', 20.0, d.QueltronMachine.Description);
  d.QueltronMachine.Applications.forEach(a => addConn('Queltron Machine', a, 14.0, 'Application'));
} catch(e) {}

// Parse UFO Information.txt
try {
  let d = JSON.parse(fs.readFileSync(path.join(FL_DIR, 'UFO Information.txt'), 'utf-8'));
  addConn('Vehicle', 'MilOrbs', 16.0, d.Vehicles.MilOrbs.Purpose.join(', '));
  addConn('Vehicle', 'PSVs', 16.0, d.Vehicles.PSVs.Capabilities.join(', '));
  addConn('Vehicle', 'SRUAVs', 15.0, d.Vehicles.SRUAVs.Purpose);
} catch(e) {}

// Parse tehran.json
try {
  let d = JSON.parse(fs.readFileSync(path.join(FL_DIR, 'tehran.json'), 'utf-8'));
  addConn('Incident', '1976 Tehran UFO Incident', 25.0, d.incident.classification, d.incident.date);
  addConn('1976 Tehran UFO Incident', 'Electromagnetic Interference', 18.0, d.evidence_quality.electromagnetic_interference.weapons_systems);
} catch(e) {}

// Parse qualia.json
try {
  let d = JSON.parse(fs.readFileSync(path.join(FL_DIR, 'qualia.json'), 'utf-8'));
} catch(e) {}

fs.writeFileSync(CONN_FILE, 'window.CONNECTIONS_DATA = ' + JSON.stringify(connections, null, 2) + ';');
console.log('Added connections!');
