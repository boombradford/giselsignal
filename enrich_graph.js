const fs = require('fs');
const path = require('path');

const FL_DIR = '/Users/zachgrzeskowiak/Projects/FL - AG';
const CONN_FILE = '/Users/zachgrzeskowiak/Projects/gisel-signal/data/connections.js';

let content = fs.readFileSync(CONN_FILE, 'utf-8');
let jsonStr = content.replace('window.CONNECTIONS_DATA = ', '');
if (jsonStr.endsWith(';')) jsonStr = jsonStr.slice(0, -1);
let connections = JSON.parse(jsonStr);

function addConn(node, relatedNode, weight, notes, date = '') {
    // Check if conn already exists
    if (connections.find(c => c.node === node && c.related_node === relatedNode)) return;
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

// 1. Giselian Encounters
if (fs.existsSync(path.join(FL_DIR, 'Giselian Encounters.txt'))) {
    let g = JSON.parse(fs.readFileSync(path.join(FL_DIR, 'Giselian Encounters.txt'), 'utf-8'));
    g.events.forEach(e => {
        let eventNode = e.event || "Giselian Encounter";
        addConn('Giselians', eventNode, 20.0, e.description, e.date);
        if (e.location) addConn(eventNode, e.location, 15.0, "Location of event");
    });
    g.projects.forEach(p => {
        addConn('Project', p.name, 18.0, p.description);
        if (p.location) addConn(p.name, p.location, 12.0, "Project Location");
    });
}

// 2. LyAV
if (fs.existsSync(path.join(FL_DIR, 'LyAV.txt'))) {
    let l = JSON.parse(fs.readFileSync(path.join(FL_DIR, 'LyAV.txt'), 'utf-8'));
    addConn('Supercomputer', 'LyAv', 25.0, l.Lyav.Classification);
    addConn('LyAv', l.Lyav.Location, 12.0, "Location");
    l.Lyav.Usage.forEach(u => addConn('LyAv', u, 10.0, "Usage Application"));
    addConn('LyAv', 'Neural Link', 18.0, l.Lyav.HumanInterface.NeuralLink.Description);
}

// 3. Queltron Machine History
if (fs.existsSync(path.join(FL_DIR, 'Queltron Machine History.txt'))) {
    let qh = JSON.parse(fs.readFileSync(path.join(FL_DIR, 'Queltron Machine History.txt'), 'utf-8'));
    let ssc = qh.Superconducting_Super_Collider;
    addConn('Superconducting Super Collider', 'Desertron', 22.0, ssc.aim);
    addConn('Desertron', ssc.location, 15.0, "Location");
    addConn('Desertron', ssc.history.construction_cost_at_cancellation, 8.0, "Cancellation Cost");
    addConn('Desertron', ssc.design_specifications.director, 10.0, "Director");
    ssc.cancellation.reasons.forEach(r => addConn('Desertron Cancellation', r, 12.0, "Reason"));
}

// 4. Queltron Machine
if (fs.existsSync(path.join(FL_DIR, 'Queltron Machine.txt'))) {
    let qm = JSON.parse(fs.readFileSync(path.join(FL_DIR, 'Queltron Machine.txt'), 'utf-8'));
    addConn('Queltron Machine', 'Quantum Computer', 24.0, qm.QueltronMachine.Description);
    addConn('Queltron Machine', 'Q-Nodes', 20.0, qm.QueltronMachine.Construction);
    qm.QueltronMachine.Applications.forEach(a => addConn('Queltron Machine', a, 14.0, "Application"));
    addConn('Time Travel', 'Causation And Effect', 18.0, qm.TimeTravelMechanisms.CausationAndEffect);
    addConn('Time Travel', 'Egotistic Motivation', 18.0, qm.TimeTravelMechanisms.EgotisticMotivation);
    addConn('Queltron Machine', 'Time Travel', 22.0, "Core Mechanics");
}

// 5. UFO Information
if (fs.existsSync(path.join(FL_DIR, 'UFO Information.txt'))) {
    let ui = JSON.parse(fs.readFileSync(path.join(FL_DIR, 'UFO Information.txt'), 'utf-8'));
    addConn('Vehicle', 'MilOrbs', 20.0, "Mass: " + ui.Vehicles.MilOrbs.Physical_Characteristics.Mass_Range);
    ui.Vehicles.MilOrbs.Purpose.forEach(p => addConn('MilOrbs', p, 15.0, "Purpose"));
    addConn('Vehicle', 'PSVs', 20.0, "Deployable Platforms");
    ui.Vehicles.PSVs.Models.forEach(m => addConn('PSVs', m, 18.0, "Model"));
    ui.Vehicles.PSVs.Technologies.forEach(t => addConn('PSVs', t, 16.0, "Technology"));
    addConn('Vehicle', 'SRUAVs', 15.0, ui.Vehicles.SRUAVs.Purpose);
    addConn('PSVs', 'Sienna', 25.0, "Weaponized Model Limit");
}

// 6. Tehran Incident
if (fs.existsSync(path.join(FL_DIR, 'tehran.json'))) {
    let t = JSON.parse(fs.readFileSync(path.join(FL_DIR, 'tehran.json'), 'utf-8'));
    addConn('UFO Incident', '1976 Tehran UFO Incident', 25.0, t.incident.classification, t.incident.date);
    addConn('1976 Tehran UFO Incident', 'Electromagnetic Interference', 22.0, t.evidence_quality.electromagnetic_interference.pattern);
    addConn('1976 Tehran UFO Incident', 'Radar Confirmation', 20.0, "Multiple independent tracking");
    t.alternative_frameworks.terrestrial_non_human_intelligence.dimensional_phase_theory.explains.forEach(e => {
        addConn('Dimensional Phase Theory', e, 15.0, "Explanation Framework");
    });
    addConn('1976 Tehran UFO Incident', 'Dimensional Phase Theory', 18.0, "Alternative Framework");
}

// Write back
fs.writeFileSync(CONN_FILE, 'window.CONNECTIONS_DATA = ' + JSON.stringify(connections, null, 2) + ';\n');
console.log('Graph data enriched from ' + FL_DIR);
