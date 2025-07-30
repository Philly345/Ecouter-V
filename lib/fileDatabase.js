// Temporary file-based database for development
const fs = require('fs');
const path = require('path');

const usersFilePath = path.join(process.cwd(), 'data', 'users.json');

function readUsers() {
  try {
    const data = fs.readFileSync(usersFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading users file:', error);
    return [];
  }
}

function writeUsers(users) {
  try {
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing users file:', error);
    return false;
  }
}

function findUserById(userId) {
  const users = readUsers();
  return users.find(user => user.id === userId || user._id === userId);
}

function updateUser(userId, updates) {
  const users = readUsers();
  const userIndex = users.findIndex(user => user.id === userId || user._id === userId);
  
  if (userIndex === -1) {
    return null;
  }
  
  users[userIndex] = { ...users[userIndex], ...updates, updatedAt: new Date().toISOString() };
  
  if (writeUsers(users)) {
    return users[userIndex];
  }
  
  return null;
}

module.exports = {
  findUserById,
  updateUser,
  readUsers,
  writeUsers
};
