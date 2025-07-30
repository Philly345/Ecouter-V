import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const usersFile = path.join(dataDir, 'users.json');
const filesFile = path.join(dataDir, 'files.json');

// Initialize files if they don't exist
const initFile = (filePath, defaultData = []) => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
  }
};

initFile(usersFile);
initFile(filesFile);

// Users database
export const usersDB = {
  getAll: () => {
    try {
      const data = fs.readFileSync(usersFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  },

  save: (users) => {
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
  },

  findByEmail: (email) => {
    const users = usersDB.getAll();
    return users.find(user => user.email === email);
  },

  findById: (id) => {
    const users = usersDB.getAll();
    return users.find(user => user.id === id);
  },

  create: (userData) => {
    const users = usersDB.getAll();
    const newUser = {
      id: Date.now().toString(),
      ...userData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    users.push(newUser);
    usersDB.save(users);
    return newUser;
  },

  update: (id, updateData) => {
    const users = usersDB.getAll();
    const index = users.findIndex(user => user.id === id);
    if (index !== -1) {
      users[index] = {
        ...users[index],
        ...updateData,
        updatedAt: new Date().toISOString(),
      };
      usersDB.save(users);
      return users[index];
    }
    return null;
  },
};

// Files database
export const filesDB = {
  getAll: () => {
    try {
      const data = fs.readFileSync(filesFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  },

  save: (files) => {
    fs.writeFileSync(filesFile, JSON.stringify(files, null, 2));
  },

  findByUserId: (userId) => {
    const files = filesDB.getAll();
    return files.filter(file => file.userId === userId);
  },

  findById: (id) => {
    const files = filesDB.getAll();
    return files.find(file => file.id === id);
  },

  create: (fileData) => {
    const files = filesDB.getAll();
    const newFile = {
      id: Date.now().toString(),
      ...fileData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    files.push(newFile);
    filesDB.save(files);
    return newFile;
  },

  update: (id, updateData) => {
    const files = filesDB.getAll();
    const index = files.findIndex(file => file.id === id);
    if (index !== -1) {
      files[index] = {
        ...files[index],
        ...updateData,
        updatedAt: new Date().toISOString(),
      };
      filesDB.save(files);
      return files[index];
    }
    return null;
  },

  delete: (id) => {
    const files = filesDB.getAll();
    const filteredFiles = files.filter(file => file.id !== id);
    filesDB.save(filteredFiles);
    return true;
  },

  getByStatus: (userId, status) => {
    const files = filesDB.findByUserId(userId);
    return files.filter(file => file.status === status);
  },

  getStorageUsed: (userId) => {
    const files = filesDB.findByUserId(userId);
    return files.reduce((total, file) => total + (file.size || 0), 0);
  },
};
