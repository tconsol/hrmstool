const Holiday = require('../models/Holiday');

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
      date: new Date(date),
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
    const holiday = await Holiday.findOneAndUpdate(
      { _id: req.params.id, organization: req.orgId },
      req.body,
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
