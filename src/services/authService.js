const User = require('../models/user');
const Note = require('../models/note');
const bcrypt = require('bcrypt');
const jwtUtils = require('../utils/jwtUtils');

const registerUser = async (username, password) => {
    try {
        // Check if the username already exists
        const existingUser = await User.findOne({ username });
    
        if (existingUser) {
          throw new Error('Username is already registered');
        }
    
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, password: hashedPassword });
        await user.save();
        return user;
      } catch (error) {
        throw new Error(error.message);
      }
};

const loginUser = async (username, password) => {
    try {
        const user = await User.findOne({ username });
    
        if (!user) {
          throw new Error('User not found');
        }
    
        const isPasswordValid = await bcrypt.compare(password, user.password);
    
        if (!isPasswordValid) {
          throw new Error('Incorrect password');
        }
    
        const token = jwtUtils.generateToken(user._id);
        return { user, token };
      } catch (error) {
        throw new Error(error.message);
      }
};

const createNote = async (userId, title, content) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }
    
    
    const note = new Note({ title, content, user: user._id });
    user.notes.push(note._id);

    await note.save();
    await user.save();

    return note;
  } catch (error) {
    console.error('Error creating note:', error);
    throw new Error(error.message);
  }
};

const getUserWithNotes = async (userId) => {
  return User.findById(userId).populate('notes');
};

module.exports = { registerUser, loginUser, createNote, getUserWithNotes };
