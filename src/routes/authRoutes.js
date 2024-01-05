const express = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware')

const router = express.Router();

router.post('/auth/signup', authController.signup);
router.post('/auth/login', authController.login);
router.post('/notes',authMiddleware.authenticate, authController.addNote);
router.get('/notes', authMiddleware.authenticate, authController.getUserNotes);
router.get('/notes/:id', authMiddleware.authenticate,authController.getNoteById);
router.delete('/notes/:id', authMiddleware.authenticate, authController.deleteNote);
router.get('/search', authMiddleware.authenticate, authController.searchNotes);
router.put('/notes/:id', authMiddleware.authenticate, authController.updateNote);
router.post('/notes/:id/share', authMiddleware.authenticate, authController.shareNote);

module.exports = router;
