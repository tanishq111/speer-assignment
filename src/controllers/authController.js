const authService = require('../services/authService');
const User = require('../models/user');
const Note = require('../models/note');


const signup = async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Received username:', username);
    console.log('Received password:', password);
    const user = await authService.registerUser(username, password);
    res.json({ user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const { user, token } = await authService.loginUser(username, password);
    res.json({ user, token });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
};

const addNote = async (req, res) => {
  try {
    const { title, content } = req.body;
    const userId = req.decodedToken.userId;

    // Check if the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create a new note
    const newNote = new Note({
      title,
      content,
      userId,
    });

    // Save the note
    await newNote.save();

    // Add the note to the user's notes
    user.notes.push(newNote);
    await user.save();

    res.status(201).json({ message: 'Note added successfully', note: newNote });
  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
  };
 

const getNoteById = async (req, res) => {
    try {
      const id = req.params.id;
      console.log(id)
      const note = await Note.findOne({ id });

    if (!note) {
      console.log('Note not found');
      return res.status(404).json({ error: 'Note not found' });
    }
    res.json({ note });
  } catch (error) {
    console.error('Error retrieving note by ID:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
  };
  
  const getUserWithNotes = async (req, res) => {
    try {
      const { id } = req.params;
      console.log("tanishq", id)
      const userWithNotes = await authService.getUserWithNotes(id);
      res.json({ user: userWithNotes });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

const getUserNotes = async (req, res) => {
    try {
      const userId = req.decodedToken.userId;
  
      const user = await User.findById(userId).populate('notes');
  
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      const userNotes = user.notes;
      res.json({ notes: userNotes });
    } catch (error) {
      console.error('Error retrieving user notes:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };

  const deleteNote = async (req, res) => {
    try {
      const noteId = req.params.id;
      console.log('Received noteId for deletion:', noteId);
  
      // Extract userId from the authentication token
      const userIdFromToken = req.decodedToken.userId;
      
      
      // Find the note to get the associated userId (assuming userId is stored in _id)
      const note = await Note.findOne({ _id: noteId });
      
  
      if (!note) {
        console.log('Note not found for deletion');
        return res.status(404).json({ error: 'Note not found for deletion' });
      }
  
      // Delete the note from the 'notes' collection
      const deletedNote = await Note.findOneAndDelete({ _id: noteId });
  
      if (!deletedNote) {
        console.log('Note not found for deletion in the notes collection');
        return res.status(404).json({ error: 'Note not found for deletion in the notes collection' });
      }
  
      // Delete the note reference from the 'users' collection (assuming notes are referenced in the User model)
      const userUpdateResult = await User.findByIdAndUpdate(
        userIdFromToken,
        { $pull: { notes: noteId } },
        { new: true } // Return the updated user document
      );
  
      if (!userUpdateResult) {
        console.log('User not found for updating in the users collection');
        return res.status(404).json({ error: 'User not found for updating in the users collection' });
      }
  
      // Respond with a success message or the deleted note
      res.json({
        message: 'Note deleted successfully',
        deletedNote,
      });
    } catch (error) {
      console.error('Error deleting note:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
  
  const searchNotes = async (req, res) => {
    try {
      const userId = req.decodedToken.userId;
      const query = req.query.q; // Extract the query parameter from the request
      console.log('Received search query:', query);
      // Perform text search based on the query
      const searchResults = await Note.find(
        { $and: [{ $text: { $search: query } }, { userId }] },
        { score: { $meta: 'textScore' } }
      ).sort({ score: { $meta: 'textScore' } });
      
  
      res.json({
        message: 'Notes searched successfully',
        results: searchResults,
      });
    } catch (error) {
      console.error('Error searching notes:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };

  const updateNote = async (req, res) => {
    try {
      const userId = req.decodedToken.userId;
      const noteId = req.params.id; // Extract note ID from the request parameters
      const { title, content } = req.body; // Extract updated title and content from the request body
  
      // Check if the note belongs to the authenticated user
      const existingNote = await Note.findOne({ _id: noteId });
  
      if (!existingNote) {
        return res.status(404).json({ error: 'Note not found for update' });
      }
  
      // Update the note
      existingNote.title = title;
      existingNote.content = content;
  
      // Save the updated note
      const updatedNote = await existingNote.save();
  
      res.json({
        message: 'Note updated successfully',
        updatedNote,
      });
    } catch (error) {
      console.error('Error updating note:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };

  const shareNote = async (req, res) => {
    try {
      const userId = req.decodedToken.userId;
      const noteId = req.params.id;
      const { shareWithUserId } = req.body; // Extract the user ID to share the note with
  
      // Check if the note belongs to the authenticated user
      const note = await Note.findOne({ _id: noteId, userId });
  
      if (!note) {
        return res.status(404).json({ error: 'Note not found for sharing' });
      }
  
      // Check if the target user exists
      const targetUser = await User.findById(shareWithUserId);
  
      if (!targetUser) {
        return res.status(404).json({ error: 'Target user not found' });
      }
  
      // Check if the note is already shared with the target user
      if (note.sharedWith.includes(shareWithUserId)) {
        return res.status(400).json({ error: 'Note already shared with the target user' });
      }
  
      // Share the note with the target user
      note.sharedWith.push(shareWithUserId);
      await note.save();
  
      // Update the shared note in the target user's document
      const sharedNote = {
        noteId: note._id,
        title: note.title,
        content: note.content,
      };
  
      targetUser.notes.push(sharedNote);
      await targetUser.save();
  
      res.json({
        message: 'Note shared successfully',
      });
    } catch (error) {
      console.error('Error sharing note:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
  
module.exports = { signup, addNote, login,  getUserWithNotes,getUserNotes,getNoteById,deleteNote,searchNotes,updateNote,shareNote };
