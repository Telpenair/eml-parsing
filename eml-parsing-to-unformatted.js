var fs = require('fs');
var emlformat = require('eml-format');
 
var eml = fs.readFileSync("./right_restriction.eml", "utf-8");

// emlformat.read(eml, function(error, data) {
//   if (error) return console.log(error);
//   fs.writeFileSync("right_restriction.json", JSON.stringify(data, " ", 2));
//   console.log(data);
// });

emlformat.unpack(eml, "./unpack_output", function(error, data) {
  if (error) return console.log(error);
  console.log('success');
});

