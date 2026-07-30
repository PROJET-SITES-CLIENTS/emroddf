const fs = require('fs');
fetch('http://localhost:3000/api/image/1J2fbOXNkJnMXhnd79VwHk-VKBUp7uSm9')
  .then(res => {
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const dest = fs.createWriteStream('test-image-output.png');
    res.body.pipe(dest);
  })
  .catch(console.error);
