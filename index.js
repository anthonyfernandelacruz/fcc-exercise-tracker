const express = require('express')
const app = express()
const cors = require('cors')
const crypto = require('crypto')
require('dotenv').config()

app.use(cors())
app.use(express.urlencoded({ extended: false }))
app.use(express.json())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const users = [];
const exercises = [];

// Create a user
app.post('/api/users', (req, res) => {
  const username = req.body.username;

  if (typeof username !== 'string' || !username.trim()) {
    return res.status(400).json({ error: 'Username is required' });
  }

  const user = {
    username: username.trim(),
    _id: crypto.randomBytes(12).toString('hex')
  };

  users.push(user);
  res.json(user);
});

// Get all users
app.get('/api/users', (req, res) => {
  res.json(users);
});

// Add an exercise
app.post('/api/users/:_id/exercises', (req, res) => {
  const user = users.find(user => user._id === req.params._id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { description, duration, date } = req.body;
  const durationNumber = Number(duration);

  if (
    typeof description !== 'string' ||
    !description.trim() ||
    duration === undefined ||
    duration === null ||
    String(duration).trim() === '' ||
    !Number.isFinite(durationNumber) ||
    durationNumber < 0
  ) {
    return res.status(400).json({
      error: 'A description and valid duration are required'
    });
  }

  const exerciseDate = date ? new Date(date) : new Date();

  if (Number.isNaN(exerciseDate.getTime())) {
    return res.status(400).json({ error: 'Invalid date' });
  }

  const exercise = {
    _id: user._id,
    description: description.trim(),
    duration: durationNumber,
    date: exerciseDate.toDateString(),
    timestamp: exerciseDate.getTime()
  };

  exercises.push(exercise);

  res.json({
    username: user.username,
    _id: user._id,
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date
  });
});

// Get a user's exercise log
app.get('/api/users/:_id/logs', (req, res) => {
  const user = users.find(user => user._id === req.params._id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { from, to, limit } = req.query;

  const fromDate = from ? new Date(from) : null;
  const toDate = to ? new Date(to) : null;

  if (
    (fromDate && Number.isNaN(fromDate.getTime())) ||
    (toDate && Number.isNaN(toDate.getTime()))
  ) {
    return res.status(400).json({ error: 'Invalid date range' });
  }

  if (toDate) {
    toDate.setUTCHours(23, 59, 59, 999);
  }

  let logEntries = exercises.filter(exercise => {
    return (
      exercise._id === user._id &&
      (!fromDate || exercise.timestamp >= fromDate.getTime()) &&
      (!toDate || exercise.timestamp <= toDate.getTime())
    );
  });

  if (limit !== undefined) {
    const limitNumber = Number(limit);

    if (
      String(limit).trim() === '' ||
      !Number.isInteger(limitNumber) ||
      limitNumber < 0
    ) {
      return res.status(400).json({ error: 'Invalid limit' });
    }

    logEntries = logEntries.slice(0, limitNumber);
  }

  const log = logEntries.map(exercise => ({
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date
  }));

  res.json({
    username: user.username,
    _id: user._id,
    count: log.length,
    log
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})