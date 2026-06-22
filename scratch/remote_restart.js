const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log("Connected to server. Restarting sozlukzzz in PM2...");
  conn.exec("pm2 restart sozlukzzz", (err, stream) => {
    if (err) {
      console.error("Exec error:", err);
      conn.end();
      process.exit(1);
    }
    stream.on('close', (code, signal) => {
      console.log(`PM2 restart completed with code ${code}`);
      conn.end();
      process.exit(code);
    }).on('data', (data) => {
      process.stdout.write(data);
    }).stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  });
}).on('error', (err) => {
  console.error("Connection error:", err);
  process.exit(1);
}).connect({
  host: '23.88.37.81',
  port: 22,
  username: 'root',
  password: 'UtNt9thVM3xEEW9gHpcj'
});
