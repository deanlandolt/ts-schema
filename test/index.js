var assert = require('assert');
var schema = require('../');
var fs = require('fs');

var models = fs.readdirSync(__dirname + '/models').filter(function (name) {
  return /.ts$/.test(name);
}).map(function (name) {
  return __dirname + '/models/' + name;
})

console.log('compiling: \n\n' + models.join('\n'))
var results = schema.compile(models, { noWrite: true });
console.log(JSON.stringify(results, null, '  '))
