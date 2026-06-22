const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log("Connected to server. Executing prisma db push on live production database...");
  conn.exec("cd /var/www/sozlukzzz && npx prisma db push", (err, stream) => {
    if (err) {
      console.error("Exec error:", err);
      conn.end();
      process.exit(1);
    }
    stream.on('close', (code, signal) => {
      console.log(`Prisma db push completed with code ${code}`);
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
