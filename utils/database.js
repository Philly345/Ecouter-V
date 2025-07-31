
import fs from 'fs';
import path from 'path';

// Check if we're in a serverless environment (like Vercel)
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NODE_ENV === 'production';

let dataDir, usersFile, filesFile;
let filesystemAvailable = false;

if (!isServerless) {
  // Only set up file system in development/local environments
  try {
    dataDir = path.join(process.cwd(), 'data');
    
    // Ensure data directory exists
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    usersFile = path.join(dataDir, 'users.json');
    filesFile = path.join(dataDir, 'files.json');
    
    // Initialize files if they don't exist
    const initFile = (filePath, defaultData = []) => {
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
      }
    };
    
    initFile(usersFile);
    initFile(filesFile);
    filesystemAvailable = true;
  } catch (error) {
    console.warn('File system not available, skipping file-based database initialization:', error.message);
    filesystemAvailable = false;
  }
}

// Users database
export const usersDB = {
  getAll: () => {
    if (!filesystemAvailable) {
      console.warn('File system not available, returning empty user list');
      return [];
    }
    try {
      const data = fs.readFileSync(usersFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.warn('Error reading users file:', error.message);
      return [];
    }
  },

  save: (users) => {
    if (!filesystemAvailable) {
      console.warn('File system not available, cannot save users');
      return;
    }
    try {
      fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
    } catch (error) {
      console.error('Error saving users file:', error.message);
    }
  },

  findByEmail: (email) => {
    if (!filesystemAvailable) {
      console.warn('File system not available, cannot find user by email');
      return null;
    }
    const users = usersDB.getAll();
    return users.find(user => user.email === email);
  },

  findById: (id) => {
    if (!filesystemAvailable) {
      console.warn('File system not available, cannot find user by id');
      return null;
    }
    const users = usersDB.getAll();
    return users.find(user => user.id === id);
  },

  create: (userData) => {
    if (!filesystemAvailable) {
      console.warn('File system not available, cannot create user');
      return null;
    }
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
    if (!filesystemAvailable) {
      console.warn('File system not available, cannot update user');
      return null;
    }
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
    if (!filesystemAvailable) {
      console.warn('File system not available, returning empty files list');
      return [];
    }
    try {
      const data = fs.readFileSync(filesFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.warn('Error reading files file:', error.message);
      return [];
    }
  },

  save: (files) => {
    if (!filesystemAvailable) {
      console.warn('File system not available, cannot save files');
      return;
    }
    try {
      fs.writeFileSync(filesFile, JSON.stringify(files, null, 2));
    } catch (error) {
      console.error('Error saving files file:', error.message);
    }
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
