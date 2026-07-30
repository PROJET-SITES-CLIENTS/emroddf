fetch('http://localhost:3000/api/image/1J2fbOXNkJnMXhnd79VwHk-VKBUp7uSm9')
  .then(res => console.log('status:', res.status, 'content-type:', res.headers.get('content-type')))
  .catch(console.error);
