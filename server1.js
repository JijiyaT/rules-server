// ------------------------------
// Backend: Express + json-rules-engine
// ------------------------------

const express = require('express');
const bodyParser = require('body-parser');
const { Engine } = require('json-rules-engine');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// In-memory rule store
let rules = [];

// Add a new rule
app.post('/rules', (req, res) => {
  const rule = req.body;
  rules.push(rule);
  res.status(201).json({ message: 'Rule added.' });
});

// Get all rules
app.get('/rules', (req, res) => {
  res.json(rules);
});

// Evaluate rules for given facilityId
app.post('/evaluate', async (req, res) => {
  const { facilityId } = req.body;
  const engine = new Engine();

  rules.forEach(rule => engine.addRule(rule));

  try {
    const { events } = await engine.run({ facilityId });
    if (events.length === 0) {
      return res.status(404).json({ error: 'No matching manifest' });
    }
    const manifest = events[0].params.manifest;
    res.json({ manifest });
  } catch (err) {
    res.status(500).json({ error: 'Engine error', details: err });
  }
});

// Serve the HTML UI
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>Facility Manifest Rules</title>
</head>
<body>
  <h2>Get Manifest by Facility ID</h2>
  <input type="text" id="facilityId" placeholder="Enter Facility ID" />
  <button onclick="getManifest()">Get Manifest</button>
  <pre id="output"></pre>

  <h2>Add Rule</h2>
  <textarea id="ruleInput" rows="10" cols="60" placeholder="Paste rule JSON here"></textarea><br>
  <button onclick="addRule()">Add Rule</button>
  <pre id="ruleOutput"></pre>

  <script>
    async function getManifest() {
      const facilityId = document.getElementById('facilityId').value;
      const response = await fetch('http://localhost:3000/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facilityId })
      });
      const result = await response.json();
      document.getElementById('output').textContent = JSON.stringify(result, null, 2);
    }

    async function addRule() {
      const rule = document.getElementById('ruleInput').value;
      try {
        const parsed = JSON.parse(rule);
        const response = await fetch('http://localhost:3000/rules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsed)
        });
        const result = await response.json();
        document.getElementById('ruleOutput').textContent = JSON.stringify(result, null, 2);
      } catch (e) {
        document.getElementById('ruleOutput').textContent = 'Invalid JSON';
      }
    }
  </script>
</body>
</html>
  `);
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Rules server listening on port ${PORT}`);
});
