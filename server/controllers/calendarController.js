const CalendarEvent = require('../models/CalendarEvent');

// GET /api/calendar?month=4&year=2026
exports.getEvents = async (req, res) => {
  try {
    const { month, year } = req.query;
    const query = {};

    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);
      query.$or = [
        { startDate: { $gte: start, $lte: end } },
        { endDate: { $gte: start, $lte: end } },
        { startDate: { $lte: start }, endDate: { $gte: end } },
      ];
    }

    const events = await CalendarEvent.find(query)
      .populate('createdBy', 'name')
      .sort({ startDate: 1 });

    res.json({ events });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch calendar events' });
  }
};

// GET /api/calendar/year?year=2026 — all events for a full year
exports.getYearEvents = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31, 23, 59, 59);

    const events = await CalendarEvent.find({
      $or: [
        { startDate: { $gte: start, $lte: end } },
        { endDate: { $gte: start, $lte: end } },
        { startDate: { $lte: start }, endDate: { $gte: end } },
      ],
    })
      .populate('createdBy', 'name')
      .sort({ startDate: 1 });

    res.json({ events });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch calendar events' });
  }
};

// POST /api/calendar — HR only
exports.createEvent = async (req, res) => {
  try {
    const { title, description, type, startDate, endDate, color } = req.body;

    if (!title || !type || !startDate || !endDate) {
      return res.status(400).json({ error: 'title, type, startDate and endDate are required' });
    }

    if (new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({ error: 'endDate must be on or after startDate' });
    }

    const event = await CalendarEvent.create({
      title,
      description,
      type,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      color: color || getDefaultColor(type),
      createdBy: req.user._id,
    });

    const populated = await event.populate('createdBy', 'name');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create event' });
  }
};

// PUT /api/calendar/:id — HR only
exports.updateEvent = async (req, res) => {
  try {
    const event = await CalendarEvent.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name');

    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update event' });
  }
};

// DELETE /api/calendar/:id — HR only
exports.deleteEvent = async (req, res) => {
  try {
    const event = await CalendarEvent.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json({ message: 'Event deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete event' });
  }
};

function getDefaultColor(type) {
  switch (type) {
    case 'holiday': return '#ef4444';
    case 'company_leave': return '#f59e0b';
    case 'event': return '#6366f1';
    default: return '#6366f1';
  }
}
