const express = require('express');
const router = express.Router();
const { patientQueries, appointmentQueries } = require('../db/queries');

// GET /api/patients
router.get('/', (req, res) => {
  const { q } = req.query;
  if (q) {
    const like = `%${q}%`;
    const patients = patientQueries.search.all(like, like, like);
    return res.json(patients);
  }
  res.json(patientQueries.getAll.all());
});

// GET /api/patients/:id
router.get('/:id', (req, res) => {
  const patient = patientQueries.getById.get(req.params.id);
  if (!patient) return res.status(404).json({ error: 'Patient not found' });
  res.json(patient);
});

// GET /api/patients/:id/appointments
router.get('/:id/appointments', (req, res) => {
  const patient = patientQueries.getById.get(req.params.id);
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  const db = require('../db/database');
  const appts = db.prepare(
    `SELECT * FROM appointments WHERE patient_id = ? ORDER BY appointment_date DESC`
  ).all(req.params.id);

  res.json(appts);
});

// POST /api/patients
router.post('/', (req, res) => {
  const { full_name, first_name, phone, id_number, hmo, email, notes } = req.body;

  if (!full_name || !first_name || !phone) {
    return res.status(400).json({ error: 'Missing required fields: full_name, first_name, phone' });
  }

  const result = patientQueries.create.run({
    full_name, first_name, phone,
    id_number: id_number || null,
    hmo: hmo || null,
    email: email || null,
    notes: notes || null
  });

  res.status(201).json(patientQueries.getById.get(result.lastInsertRowid));
});

// PUT /api/patients/:id
router.put('/:id', (req, res) => {
  const patient = patientQueries.getById.get(req.params.id);
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  const { full_name, first_name, phone, id_number, hmo, email, notes } = req.body;

  patientQueries.update.run({
    id: patient.id,
    full_name: full_name || patient.full_name,
    first_name: first_name || patient.first_name,
    phone: phone || patient.phone,
    id_number: id_number !== undefined ? id_number : patient.id_number,
    hmo: hmo !== undefined ? hmo : patient.hmo,
    email: email !== undefined ? email : patient.email,
    notes: notes !== undefined ? notes : patient.notes
  });

  res.json(patientQueries.getById.get(patient.id));
});

module.exports = router;
