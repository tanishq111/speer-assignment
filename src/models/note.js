const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  title: String,
  content: String,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
})
noteSchema.index({ title: 'text', content: 'text' });
const Note = mongoose.model('Note', noteSchema);

module.exports = Note;

