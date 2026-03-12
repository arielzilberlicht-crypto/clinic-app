const express = require('express');
const router = express.Router();
const { templateQueries } = require('../db/queries');

// GET /api/templates
router.get('/', (req, res) => {
  res.json(templateQueries.getAll.all());
});

// GET /api/templates/:name
router.get('/:name', (req, res) => {
  const template = templateQueries.getByName.get(req.params.name);
  if (!template) return res.status(404).json({ error: 'Template not found' });
  res.json(template);
});

// PUT /api/templates/:name
router.put('/:name', (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'Content is required' });

  const template = templateQueries.getByName.get(req.params.name);
  if (!template) return res.status(404).json({ error: 'Template not found' });

  templateQueries.update.run(content, req.params.name);
  res.json(templateQueries.getByName.get(req.params.name));
});

module.exports = router;
