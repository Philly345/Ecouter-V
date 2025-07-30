import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');
const usersFile = path.join(dataDir, 'users.json');
const pendingUsersFile = path.join(dataDir, 'pending_users.json');
const verificationsFile = path.join(dataDir, 'email_verifications.json');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize files if they don't exist
[usersFile, pendingUsersFile, verificationsFile].forEach(file => {
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify([], null, 2));
  }
});

function readJsonFile(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

function writeJsonFile(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

export async function connectDB() {
  return {
    db: {
      collection: (name) => {
        const getFilePath = () => {
          switch (name) {
            case 'users': return usersFile;
            case 'pending_users': return pendingUsersFile;
            case 'email_verifications': return verificationsFile;
            default: throw new Error(`Unknown collection: ${name}`);
          }
        };

        return {
          findOne: async (query) => {
            const data = readJsonFile(getFilePath());
            return data.find(item => {
              if (query.email) return item.email === query.email;
              if (query.email && query.code) {
                return item.email === query.email && item.code === query.code;
              }
              if (query.expiresAt && query.expiresAt.$gt) {
                return item.email === query.email && 
                       item.code === query.code && 
                       new Date(item.expiresAt) > query.expiresAt.$gt;
              }
              return false;
            });
          },

          insertOne: async (doc) => {
            const data = readJsonFile(getFilePath());
            const newDoc = { ...doc, _id: Date.now().toString() };
            data.push(newDoc);
            writeJsonFile(getFilePath(), data);
            return { insertedId: newDoc._id };
          },

          replaceOne: async (query, doc, options = {}) => {
            const data = readJsonFile(getFilePath());
            const index = data.findIndex(item => {
              if (query.email) return item.email === query.email;
              return false;
            });

            if (index >= 0) {
              data[index] = { ...doc, _id: data[index]._id };
            } else if (options.upsert) {
              data.push({ ...doc, _id: Date.now().toString() });
            }
            
            writeJsonFile(getFilePath(), data);
            return { modifiedCount: index >= 0 ? 1 : 0 };
          },

          deleteMany: async (query) => {
            const data = readJsonFile(getFilePath());
            const filteredData = data.filter(item => {
              if (query.email) return item.email !== query.email;
              return true;
            });
            writeJsonFile(getFilePath(), filteredData);
            return { deletedCount: data.length - filteredData.length };
          },

          deleteOne: async (query) => {
            const data = readJsonFile(getFilePath());
            const index = data.findIndex(item => {
              if (query.email) return item.email === query.email;
              return false;
            });
            
            if (index >= 0) {
              data.splice(index, 1);
              writeJsonFile(getFilePath(), data);
              return { deletedCount: 1 };
            }
            return { deletedCount: 0 };
          }
        };
      }
    }
  };
}

export async function connectToDatabase() {
  return connectDB();
}
