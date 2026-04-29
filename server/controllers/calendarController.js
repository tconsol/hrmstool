const CalendarEvent = require('../models/CalendarEvent');
const User = require('../models/User');
const { parseLocalDateRange } = require('../utils/dateParser');
const { sendEmail } = require('../utils/email');

// GET /api/calendar?month=4&year=2026
exports.getEvents = async (req, res) => {
  try {
    const { month, year } = req.query;
    const query = { organization: req.orgId };

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

// GET /api/calendar/year?year=2026
exports.getYearEvents = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31, 23, 59, 59);

    const events = await CalendarEvent.find({
      organization: req.orgId,
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

// POST /api/calendar
exports.createEvent = async (req, res) => {
  try {
    const { title, description, type, startDate, endDate, color } = req.body;

    if (!title || !type || !startDate || !endDate) {
      return res.status(400).json({ error: 'title, type, startDate and endDate are required' });
    }

    const { startDate: start, endDate: end } = parseLocalDateRange(startDate, endDate);

    if (end < start) {
      return res.status(400).json({ error: 'endDate must be on or after startDate' });
    }

    const event = await CalendarEvent.create({
      title,
      description,
      type,
      startDate: start,
      endDate: end,
      color: color || getDefaultColor(type),
      createdBy: req.user._id,
      organization: req.orgId,
    });

    const populated = await event.populate('createdBy', 'name');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create event' });
  }
};

// PUT /api/calendar/:id
exports.updateEvent = async (req, res) => {
  try {
    const event = await CalendarEvent.findOneAndUpdate(
      { _id: req.params.id, organization: req.orgId },
      { ...req.body },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name');

    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update event' });
  }
};

// DELETE /api/calendar/:id
exports.deleteEvent = async (req, res) => {
  try {
    const event = await CalendarEvent.findOneAndDelete({ _id: req.params.id, organization: req.orgId });
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

// POST /api/calendar/:id/send-invites
// Send event invitations to all active employees
exports.sendEventInvites = async (req, res) => {
  try {
    const event = await CalendarEvent.findOne({ _id: req.params.id, organization: req.orgId });
    if (!event) return res.status(404).json({ error: 'Event not found' });

    // Fetch all active employees with emails
    const employees = await User.find({
      organization: req.orgId,
      status: 'active',
      email: { $exists: true, $ne: '' },
    }).select('email name');

    if (employees.length === 0) {
      return res.status(200).json({ message: 'No active employees found to invite' });
    }

    const emailList = employees.map((emp) => emp.email);
    const eventDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);
    const dateRange = eventDate.toDateString() === endDate.toDateString()
      ? eventDate.toDateString()
      : `${eventDate.toDateString()} - ${endDate.toDateString()}`;

    const html = `
      <h2>You're invited to: ${event.title}</h2>
      <p><strong>Type:</strong> ${event.type.replace(/_/g, ' ')}</p>
      <p><strong>Date:</strong> ${dateRange}</p>
      ${event.description ? `<p><strong>Description:</strong></p><p>${event.description}</p>` : ''}
      <p style="margin-top: 20px; color: #666;">
        This is an automated invitation. Please check your calendar for more details.
      </p>
    `;

    await sendEmail({
      to: emailList,
      subject: `Event Invitation: ${event.title}`,
      html,
    });

    res.json({ message: `Event invitation sent to ${employees.length} employee(s)` });
  } catch (error) {    res.status(500).json({ error: 'Failed to send event invitations' });
  }
};
