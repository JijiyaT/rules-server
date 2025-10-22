// const express = require('express');
// const bodyParser = require('body-parser');
// const { Engine } = require('json-rules-engine');
// const cors = require('cors');
// const { v4: uuidv4 } = require('uuid');

// const app = express();
// app.use(cors());
// app.use(bodyParser.json());

// // In-memory rules
// let rules = [];

// // Add Rule
// app.post('/rules', (req, res) => {
//   const rule = req.body;
//   rule.id = uuidv4();
//   rules.push(rule);
//   res.status(201).json({ message: 'Rule added.', id: rule.id });
// });

// // Get All Rules
// app.get('/rules', (req, res) => {
//   res.json(rules);
// });

// // Update Rule
// app.put('/rules/:id', (req, res) => {
//   const { id } = req.params;
//   const index = rules.findIndex(r => r.id === id);
//   if (index === -1) return res.status(404).json({ message: 'Rule not found.' });
//   rules[index] = { ...req.body, id };
//   res.json({ message: 'Rule updated.' });
// });

// // Delete Rule
// app.delete('/rules/:id', (req, res) => {
//   const { id } = req.params;
//   const index = rules.findIndex(r => r.id === id);
//   if (index === -1) return res.status(404).json({ message: 'Rule not found.' });
//   rules.splice(index, 1);
//   res.json({ message: 'Rule deleted.' });
// });

// // Evaluate
// app.post('/evaluate', async (req, res) => {
//   const { facilityId } = req.body;
//   const engine = new Engine();
//   rules.forEach(rule => engine.addRule(rule));

//   try {
//     const { events } = await engine.run({ facilityId });
//     if (events.length === 0) return res.status(404).json({ error: 'No matching manifest' });
//     res.json({ manifest: events[0].params.manifest });
//   } catch (err) {
//     res.status(500).json({ error: 'Engine error', details: err.message });
//   }
// });

// // UI
// app.get('/', (req, res) => {
//   res.send(`
//     <h2>Facility Manifest Rules</h2>
//     <input id="facilityId" placeholder="Facility ID" />
//     <button onclick="getManifest()">Get Manifest</button>
//     <pre id="output"></pre>
//     <hr />
//     <textarea id="ruleInput" rows="8" cols="60" placeholder='Paste rule JSON'></textarea><br/>
//     <button onclick="addRule()">Add Rule</button>
//     <pre id="ruleOutput"></pre>
//     <hr />
//     <button onclick="loadRules()">Refresh Rules</button>
//     <ul id="ruleList"></ul>

//     <script>
//       async function getManifest() {
//         const facilityId = document.getElementById('facilityId').value;
//         const res = await fetch('/evaluate', {
//           method: 'POST',
//           headers: {'Content-Type': 'application/json'},
//           body: JSON.stringify({ facilityId })
//         });
//         const json = await res.json();
//         document.getElementById('output').textContent = JSON.stringify(json, null, 2);
//       }

//       async function addRule() {
//         try {
//           const rule = JSON.parse(document.getElementById('ruleInput').value);
//           const res = await fetch('/rules', {
//             method: 'POST',
//             headers: {'Content-Type': 'application/json'},
//             body: JSON.stringify(rule)
//           });
//           const json = await res.json();
//           document.getElementById('ruleOutput').textContent = JSON.stringify(json, null, 2);
//           loadRules();
//         } catch {
//           document.getElementById('ruleOutput').textContent = 'Invalid JSON';
//         }
//       }

//       async function loadRules() {
//         const res = await fetch('/rules');
//         const rules = await res.json();
//         const ul = document.getElementById('ruleList');
//         ul.innerHTML = '';
//         rules.forEach(rule => {
//           const li = document.createElement('li');
//           li.textContent = rule.id + ': ' + JSON.stringify(rule.conditions);

//           const del = document.createElement('button');
//           del.textContent = 'Delete';
//           del.onclick = async () => {
//             await fetch('/rules/' + rule.id, { method: 'DELETE' });
//             loadRules();
//           };

//           li.appendChild(del);
//           ul.appendChild(li);
//         });
//       }
//     </script>
//   `);
// });

// // Start server
// const PORT = 3000;
// app.listen(PORT, () => {
//   console.log(`✅ Rules server running at http://localhost:${PORT}`);
// });

const express = require('express');
const bodyParser = require('body-parser');
const { Engine } = require('json-rules-engine');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

app.use(cors());
app.use(bodyParser.json());

// In-memory rules
let rules = [];

// Add Rule
app.post('/rules', (req, res) => {
  const rule = req.body;
  rule.id = uuidv4();
  rules.push(rule);
  res.status(201).json({ message: 'Rule added.', id: rule.id });
});

// Get All Rules
app.get('/rules', (req, res) => {
  res.json(rules);
});

// Update Rule
app.put('/rules/:id', (req, res) => {
  const { id } = req.params;
  const index = rules.findIndex(r => r.id === id);
  if (index === -1) return res.status(404).json({ message: 'Rule not found.' });
  rules[index] = { ...req.body, id };
  res.json({ message: 'Rule updated.' });
});

// Delete Rule
app.delete('/rules/:id', (req, res) => {
  const { id } = req.params;
  const index = rules.findIndex(r => r.id === id);
  if (index === -1) return res.status(404).json({ message: 'Rule not found.' });
  rules.splice(index, 1);
  res.json({ message: 'Rule deleted.' });
});

// Evaluate
app.post('/evaluate', async (req, res) => {
  const { facilityId } = req.body;
  const engine = new Engine();
  rules.forEach(rule => engine.addRule(rule));

  try {
    const { events } = await engine.run({ facilityId });
    if (events.length === 0) return res.status(404).json({ error: 'No matching manifest' });
    res.json({ manifest: events[0].params.manifest });
  } catch (err) {
    res.status(500).json({ error: 'Engine error', details: err.message });
  }
});

// UI
app.get('/', (req, res) => {
  res.send(`
    <h2>Facility Manifest Rules</h2>
    <input id="facilityId" placeholder="Facility ID" />
    <button onclick="getManifest()">Get Manifest</button>
    <pre id="output"></pre>
    <hr />
    <textarea id="ruleInput" rows="8" cols="60" placeholder='Paste rule JSON'></textarea><br/>
    <button onclick="addRule()">Save Rule</button>
    <pre id="ruleOutput"></pre>
    <hr />
    <button onclick="loadRules()">Refresh Rules</button>
    <ul id="ruleList"></ul>

    <script>
      let selectedRuleId = null;

      async function getManifest() {
        const facilityId = document.getElementById('facilityId').value;
        const res = await fetch('/evaluate', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ facilityId })
        });
        const json = await res.json();
        document.getElementById('output').textContent = JSON.stringify(json, null, 2);
      }

      async function addRule() {
        try {
          const rule = JSON.parse(document.getElementById('ruleInput').value);
          const method = selectedRuleId ? 'PUT' : 'POST';
          const url = selectedRuleId ? '/rules/' + selectedRuleId : '/rules';
          
          const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(rule)
          });
          
          const json = await res.json();
          document.getElementById('ruleOutput').textContent = JSON.stringify(json, null, 2);
          selectedRuleId = null;
          document.getElementById('ruleInput').value = '';
          loadRules();
        } catch {
          document.getElementById('ruleOutput').textContent = 'Invalid JSON';
        }
      }

      async function loadRules() {
        const res = await fetch('/rules');
        const rules = await res.json();
        const ul = document.getElementById('ruleList');
        ul.innerHTML = '';

        rules.forEach(rule => {
          const li = document.createElement('li');
          li.textContent = rule.id + ': ' + JSON.stringify(rule.conditions);

          const edit = document.createElement('button');
          edit.textContent = 'Edit';
          edit.onclick = () => {
            selectedRuleId = rule.id;
            document.getElementById('ruleInput').value = JSON.stringify(rule, null, 2);
            document.getElementById('ruleOutput').textContent = 'Loaded for editing: ' + rule.id;
          };

          const del = document.createElement('button');
          del.textContent = 'Delete';
          del.onclick = async () => {
            await fetch('/rules/' + rule.id, { method: 'DELETE' });
            loadRules();
          };

          li.appendChild(edit);
          li.appendChild(del);
          ul.appendChild(li);
        });
      }

      loadRules();
    </script>
  `);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Rules server running on port ${PORT}`);
});
