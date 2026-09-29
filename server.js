const fs = require('fs');
const path = require('path');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function loadData() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      students: Array.isArray(parsed.students) ? parsed.students : [],
      rooms: Array.isArray(parsed.rooms) ? parsed.rooms : [],
      payments: Array.isArray(parsed.payments) ? parsed.payments : [],
      menu: Array.isArray(parsed.menu) ? parsed.menu : [],
      facilities: Array.isArray(parsed.facilities) ? parsed.facilities : []
    };
  } catch (error) {
    return { students: [], rooms: [], payments: [], menu: [], facilities: [] };
  }
}

function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

let data = loadData();

app.get('/api/dashboard', (req, res) => {
  const occupied = data.rooms.reduce((sum, room) => sum + room.occupied, 0);
  const capacity = data.rooms.reduce((sum, room) => sum + room.capacity, 0);
  const collected = data.payments.filter((payment) => payment.status === 'Paid').reduce((sum, payment) => sum + payment.amount, 0);
  const pending = data.payments.filter((payment) => payment.status === 'Pending').reduce((sum, payment) => sum + payment.amount, 0);
  res.json({ occupied, capacity, availableBeds: capacity - occupied, collected, pending, students: data.students.length, rooms: data.rooms.length, payments: data.payments });
});

app.get('/api/students', (req, res) => res.json(data.students));
app.get('/api/rooms', (req, res) => res.json(data.rooms));
app.get('/api/payments', (req, res) => res.json(data.payments));
app.get('/api/menu', (req, res) => res.json(data.menu));
app.get('/api/facilities', (req, res) => res.json(data.facilities));

app.post('/api/students', (req, res) => {
  const { name, course, phone, room } = req.body;
  if (!name || !course || !phone || !room) return res.status(400).json({ error: 'All student fields are required.' });
  const student = { id: `STU-${1043 + data.students.length - 5}`, name, course, phone, room, status: 'Active', joined: new Date().toISOString().slice(0, 10) };
  data.students.unshift(student);
  const assignedRoom = data.rooms.find((item) => item.number === room);
  if (assignedRoom && assignedRoom.occupied < assignedRoom.capacity) {
    assignedRoom.occupied += 1;
    assignedRoom.status = assignedRoom.occupied === assignedRoom.capacity ? 'Full' : 'Available';
  }
  saveData();
  res.status(201).json(student);
});

app.post('/api/payments', (req, res) => {
  const { student, room, amount, method } = req.body;
  if (!student || !room || !amount) return res.status(400).json({ error: 'Student, room, and amount are required.' });
  const payment = { id: `PAY-${8832 + data.payments.length}`, student, room, amount: Number(amount), date: new Date().toISOString().slice(0, 10), status: 'Paid', method: method || 'Cash' };
  data.payments.unshift(payment);
  saveData();
  res.status(201).json(payment);
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// DELETE STUDENT
app.delete('/api/students/:id', (req, res) => {
  const id = req.params.id;

  const index = data.students.findIndex(
    student => String(student.id) === String(id)
  );

  if (index === -1) {
    return res.status(404).json({
      message: 'Student not found'
    });
  }

  data.students.splice(index, 1);
  saveData();

  res.json({
    message: 'Student deleted successfully'
  });
});

// START SERVER
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});