const Holiday = require('../models/Holiday');
const { parseLocalDate } = require('../utils/dateParser');

// Built-in India national holidays per year
const INDIA_HOLIDAYS = {
  2025: [
    { name: 'Republic Day', date: '2025-01-26' },
    { name: 'Maha Shivratri', date: '2025-02-26' },
    { name: 'Holi', date: '2025-03-14' },
    { name: 'Eid-ul-Fitr', date: '2025-03-31' },
    { name: 'Ram Navami', date: '2025-04-06' },
    { name: 'Mahavir Jayanti', date: '2025-04-10' },
    { name: 'Good Friday', date: '2025-04-18' },
    { name: 'Dr. Ambedkar Jayanti', date: '2025-04-14' },
    { name: 'Buddha Purnima', date: '2025-05-12' },
    { name: 'Id-ul-Zuha (Bakrid)', date: '2025-06-07' },
    { name: 'Muharram', date: '2025-07-06' },
    { name: 'Independence Day', date: '2025-08-15' },
    { name: 'Janmashtami', date: '2025-08-16' },
    { name: 'Id-e-Milad (Milad-un-Nabi)', date: '2025-09-05' },
    { name: 'Gandhi Jayanti', date: '2025-10-02' },
    { name: 'Dussehra', date: '2025-10-02' },
    { name: 'Diwali', date: '2025-10-20' },
    { name: 'Guru Nanak Jayanti', date: '2025-11-05' },
    { name: 'Christmas Day', date: '2025-12-25' },
  ],
  2026: [
    { name: 'Republic Day', date: '2026-01-26' },
    { name: 'Makara Sankranti / Pongal', date: '2026-01-14' },
    { name: 'Vasant Panchami', date: '2026-01-23' },
    { name: 'Maha Shivratri', date: '2026-02-15' },
    { name: 'Holika Dahana', date: '2026-03-03' },
    { name: 'Holi', date: '2026-03-04' },
    { name: 'Ugadi / Gudi Padwa', date: '2026-03-19' },
    { name: 'Eid-ul-Fitr (Ramzan Id)', date: '2026-03-21' },
    { name: 'Ram Navami', date: '2026-03-26' },
    { name: 'Mahavir Jayanti', date: '2026-03-31' },
    { name: 'Good Friday', date: '2026-04-03' },
    { name: 'Dr. Ambedkar Jayanti', date: '2026-04-14' },
    { name: 'Buddha Purnima', date: '2026-05-01' },
    { name: 'Id-ul-Zuha (Bakrid)', date: '2026-05-27' },
    { name: 'Muharram', date: '2026-06-26' },
    { name: 'Independence Day', date: '2026-08-15' },
    { name: 'Id-e-Milad (Milad-un-Nabi)', date: '2026-08-26' },
    { name: 'Ganesh Chaturthi', date: '2026-09-14' },
    { name: 'Gandhi Jayanti', date: '2026-10-02' },
    { name: 'Dussehra', date: '2026-10-21' },
    { name: 'Diwali', date: '2026-11-08' },
    { name: 'Guru Nanak Jayanti', date: '2026-11-24' },
    { name: 'Christmas Day', date: '2026-12-25' },
  ],
  2027: [
    { name: 'Republic Day', date: '2027-01-26' },
    { name: 'Makara Sankranti / Pongal', date: '2027-01-14' },
    { name: 'Maha Shivratri', date: '2027-03-06' },
    { name: 'Holi', date: '2027-03-22' },
    { name: 'Eid-ul-Fitr', date: '2027-03-10' },
    { name: 'Ram Navami', date: '2027-04-15' },
    { name: 'Mahavir Jayanti', date: '2027-04-19' },
    { name: 'Good Friday', date: '2027-04-02' },
    { name: 'Dr. Ambedkar Jayanti', date: '2027-04-14' },
    { name: 'Buddha Purnima', date: '2027-05-21' },
    { name: 'Independence Day', date: '2027-08-15' },
    { name: 'Gandhi Jayanti', date: '2027-10-02' },
    { name: 'Diwali', date: '2027-10-29' },
    { name: 'Christmas Day', date: '2027-12-25' },
  ],
};

// Sync India national holidays directly from built-in list into DB
exports.syncIndiaHolidays = async (req, res) => {
  try {
    const year = parseInt(req.body.year);
    
    if (!year || year < 2020 || year > 2030) {
      return res.status(400).json({ error: 'Invalid year.' });
    }

    const holidayList = INDIA_HOLIDAYS[year];
    if (!holidayList || holidayList.length === 0) {
      return res.status(400).json({ error: `No built-in holiday data available for ${year}. Supported years: ${Object.keys(INDIA_HOLIDAYS).join(', ')}.` });
    }

    // Remove existing national holidays for this year first
    await Holiday.deleteMany({
      organization: req.orgId,
      type: 'national',
      date: { $gte: new Date(year, 0, 1), $lte: new Date(year, 11, 31) },
    });

    // Insert fresh from built-in list
    const toInsert = holidayList.map(h => ({
      name: h.name,
      date: parseLocalDate(h.date),
      type: 'national',
      description: 'India National / Public Holiday',
      organization: req.orgId,
    }));

    const result = await Holiday.insertMany(toInsert);
    res.json({
      message: `Successfully synced ${result.length} India holidays for ${year}`,
      count: result.length,
    });
  } catch (error) {    res.status(500).json({ error: 'Failed to sync holidays: ' + error.message });
  }
};

exports.getHolidays = async (req, res) => {
  try {
    const { year, type } = req.query;
    const query = { organization: req.orgId };

    if (year) {
      query.date = {
        $gte: new Date(year, 0, 1),
        $lte: new Date(year, 11, 31),
      };
    }

    if (type) query.type = type;

    const holidays = await Holiday.find(query).sort({ date: 1 });
    res.json(holidays);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch holidays' });
  }
};

exports.createHoliday = async (req, res) => {
  try {
    const { name, date, type, description } = req.body;

    if (!name || !date) {
      return res.status(400).json({ error: 'Name and date are required' });
    }

    const holiday = new Holiday({
      name,
      date: parseLocalDate(date),
      type: type || 'company',
      description,
      organization: req.orgId,
    });

    await holiday.save();
    res.status(201).json(holiday);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create holiday' });
  }
};

exports.updateHoliday = async (req, res) => {
  try {
    const allowedFields = ['name', 'date', 'type', 'description'];
    const updates = {};
    allowedFields.forEach(field => {
      if (field in req.body) {
        updates[field] = field === 'date' ? parseLocalDate(req.body[field]) : req.body[field];
      }
    });

    const holiday = await Holiday.findOneAndUpdate(
      { _id: req.params.id, organization: req.orgId },
      updates,
      { new: true, runValidators: true }
    );

    if (!holiday) {
      return res.status(404).json({ error: 'Holiday not found' });
    }

    res.json(holiday);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update holiday' });
  }
};

exports.deleteHoliday = async (req, res) => {
  try {
    const holiday = await Holiday.findOneAndDelete({ _id: req.params.id, organization: req.orgId });
    if (!holiday) {
      return res.status(404).json({ error: 'Holiday not found' });
    }
    res.json({ message: 'Holiday deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete holiday' });
  }
};
