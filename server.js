const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Productivity Goblin is alive!');
});

const listener = app.listen(process.env.PORT || 3000, function() {
  console.log('Keep-alive server is running on port ' + listener.address().port);
});
