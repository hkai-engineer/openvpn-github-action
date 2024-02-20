const fs = require("fs");
const core = require("@actions/core");
const exec = require("./exec");
const Tail = require("tail").Tail;

const run = (callback) => {
  const configFile = core.getInput("config_file", { required: true });
  const hostname = core.getInput("hostname", { required: true });
  const port = core.getInput("port", { required: true });
  const ca = core.getInput("ca");
  const cert = core.getInput("cert");
  const username = core.getInput("username");
  const password = core.getInput("password");
  const clientKey = core.getInput("client_key");
  const tlsAuthKey = core.getInput("tls_auth_key");
  const tlsCryptV2Key = core.getInput("tls_crypt_v2_key");
  const passphrase = core.getInput("passphrase");

  if (!fs.existsSync(configFile)) {
    throw new Error(`config file '${configFile}' not found`);
  }

  // add hostname and port to config file
  fs.appendFileSync(configFile, `remote ${hostname} ${port}\n`);

  // 1. Configure client

  fs.appendFileSync(configFile, "\n# ----- modified by action -----\n");

  // username & password auth
  if (username && password) {
    fs.appendFileSync(configFile, "auth-user-pass up.txt\n");
    fs.writeFileSync("up.txt", [username, password].join("\n"), { mode: 0o600 });
  }

  // certificate passphrase
  if (passphrase) {
    fs.appendFileSync(configFile, "askpass ap.txt\n");
    fs.writeFileSync("ap.txt", passphrase, { mode: 0o600 });
  }

  // ca
  if (ca) {
    fs.appendFileSync(configFile, "ca ca.crt\n");
    fs.writeFileSync("ca.crt", ca, { mode: 0o600 });
  }

  // client certificate
  if (cert) {
    fs.appendFileSync(configFile, "cert client.crt\n");
    fs.writeFileSync("client.crt", cert, { mode: 0o600 });
  }

  // client certificate auth
  if (clientKey) {
    fs.appendFileSync(configFile, "key client.key\n");
    fs.writeFileSync("client.key", clientKey, { mode: 0o600 });
  }

  if (tlsAuthKey) {
    fs.appendFileSync(configFile, "tls-auth ta.key 1\n");
    fs.writeFileSync("ta.key", tlsAuthKey, { mode: 0o600 });
  }

  if (tlsCryptV2Key) {
    fs.appendFileSync(configFile, "tls-crypt-v2 tcv2.key 1\n");
    fs.writeFileSync("tcv2.key", tlsCryptV2Key, { mode: 0o600 });
  }

  core.info("========== begin configuration ==========");
  core.info(fs.readFileSync(configFile, "utf8"));
  core.info("=========== end configuration ===========");

  // 2. Run openvpn

  // prepare log file
  fs.writeFileSync("openvpn.log", "");
  const tail = new Tail("openvpn.log");

  try {
    exec(`sudo openvpn --config ${configFile} --daemon --log openvpn.log --writepid openvpn.pid`);
  } catch (error) {
    core.error(fs.readFileSync("openvpn.log", "utf8"));
    tail.unwatch();
    throw error;
  }

  tail.on("line", (data) => {
    core.info(data);
    if (data.includes("Initialization Sequence Completed")) {
      tail.unwatch();
      clearTimeout(timer);
      const pid = fs.readFileSync("openvpn.pid", "utf8").trim();
      core.info(`VPN connected successfully. Daemon PID: ${pid}`);
      callback(pid);
    }
  });

  const timer = setTimeout(() => {
    core.setFailed("VPN connection failed.");
    tail.unwatch();
  }, 15000);
};

module.exports = run;
