const session = require('express-session');
const MongoStore = require('connect-mongo');

module.exports = session({
  secret: process.env.SESSION_SECRET || 'your-secret',
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'None',
  },
});
