const Event = require('../models/Event');

// @desc  Create event
// @route POST /api/events
// @access Leader + SuperAdmin
const createEvent = async (req, res) => {
  try {
    const { title, description, date, location, category } = req.body;
    if (!title || !date) return res.status(400).json({ message: 'Title and date are required' });

    const event = await Event.create({
      title, description, date, location, category,
      createdBy: req.user._id,
      changeRequest: req.body.changeRequestId || null,
    });

    const populated = await event.populate('createdBy', 'name leaderRole');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Get all upcoming events
// @route GET /api/events
// @access All authenticated
const getEvents = async (req, res) => {
  try {
    const filter = { isActive: true };
    if (req.query.upcoming === 'true') filter.date = { $gte: new Date() };

    const events = await Event.find(filter)
      .populate('createdBy', 'name leaderRole')
      .sort({ date: 1 });

    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Update event
// @route PUT /api/events/:id
// @access Leader + SuperAdmin
const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const { title, description, date, location, category } = req.body;
    if (title) event.title = title;
    if (description) event.description = description;
    if (date) event.date = date;
    if (location) event.location = location;
    if (category) event.category = category;

    const updated = await event.save();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Delete event
// @route DELETE /api/events/:id
// @access Leader + SuperAdmin
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    event.isActive = false;
    await event.save();
    res.json({ message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createEvent, getEvents, updateEvent, deleteEvent };
