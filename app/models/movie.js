var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var MovieSchema = new Schema({
  title: String,
  description: String,
  director: String,
  categories: Array
});

module.exports = mongoose.model('Movie', MovieSchema);
