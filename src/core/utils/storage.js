export const storage = {
     get: (key) => {
          try {
               const value = localStorage.getItem(key);
               return value ? JSON.parse(value) : null;
          } catch {
               return localStorage.getItem(key);
          }
     },

     set: (key, value) => {
          if (typeof value === "string") {
               localStorage.setItem(key, value);
          } else {
               localStorage.setItem(key, JSON.stringify(value));
          }
     },

     remove: (key) => {
          localStorage.removeItem(key);
     },

     clear: () => {
          localStorage.clear();
     },
};
