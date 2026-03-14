const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { protect, roleAuth } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', roleAuth('admin'), eventController.createEvent);
router.get('/', eventController.getEvents);
router.put('/:id', roleAuth('admin'), eventController.updateEvent);
router.delete('/:id', roleAuth('admin'), eventController.deleteEvent);

module.exports = router;
