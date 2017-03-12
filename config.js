var env = process.env;
var nodeEnv = env.NODE_ENV || 'development';

exports.nodeEnv;

exports.logStars = function(message) {
  console.info('**********');
  console.info(message);
  console.info('**********');
};

exports.port = env.PORT || 8000;
exports.host = env.HOST || 'localhost';
exports.mongodbUri = 'mongodb://user:passord@yourdomain.mlab.com:39311/contacts_db';
