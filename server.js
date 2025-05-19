const jsonServer = require('json-server');
const path = require('path');
const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults({
  static: path.join(__dirname, 'public') // Serve your frontend
});

server.use(middlewares);
server.use(jsonServer.bodyParser);
server.use('/users', router); // Endpoint to save user data

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
