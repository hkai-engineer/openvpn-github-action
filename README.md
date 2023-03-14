# openvpn-github-action

GitHub Action for connecting to OpenVPN server.

A modification of https://github.com/kota65535/github-openvpn-connect-action to include the following inputs:
- CA <ca>, 
- Client Certificate <cert>, 
- Passphrase <askpass>, and 
- tls-crypt <tls-crypt>

To install OpenVPN on your Linux server, follow the instructions here:
- https://www.cyberciti.biz/faq/ubuntu-20-04-lts-set-up-openvpn-server-in-5-minutes/
If you would like to use Passphrase authentication <askpsas>, use the following script:
- wget https://raw.githubusercontent.com/angristan/openvpn-install/master/openvpn-install.sh -O openvpn-ubuntu-install.sh

## Inputs

### General Inputs

| Name          | Description                            | Required |
|---------------|----------------------------------------|----------|
| `config_file` | Location of OpenVPN client config file | yes      |
| `hostname`    | Remote OpenVPN server hostname         | yes      |
| `port`        | Remote OpenVPN server port number      | yes      |

### Authentication Inputs

Supported authentication methods:

- Username & password auth
- Client certificate auth
- Both of them

| Name            | Description                                   | Required when                           | 
|-----------------|-----------------------------------------------|-----------------------------------------|
| `ca`            | CA certificate                                | Optional (only if not specified inline) |
| `cert`          | Client certificate                            | Optional (only if not specified inline) |
| `username`      | Username                                      | Username-password auth                  |
| `password`      | Password                                      | Username-password auth                  |
| `client_key`    | Local peer's private key                      | Client certificate auth                 |
| `passphrase`    | Passphrase for the client certificate         | Optional                                |
| `tls_auth_key`  | Pre-shared secret for TLS-auth HMAC signature | Optional                                |
| `tls_crypt_key` | TLS crypt key                                 | Optional                                |


**Note: It is strongly recommended that you provide all credentials
via [encrypted secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets).**

## Usage

- Create client configuration file based on
  the [official sample](https://github.com/OpenVPN/openvpn/blob/master/sample/sample-config-files/client.conf). It is
  recommended to use inline certificates to include them directly in configuration file
  like [this](https://github.com/hkai-engineer/openvpn-github-action/tree/master/.github/workflows/client.ovpn).
- Usage in your workflow is like following:

```yaml
      - name: Checkout
        uses: actions/checkout@v3
      - name: Install OpenVPN
        run: |
          sudo apt update
          sudo apt install -y openvpn openvpn-systemd-resolved
      - name: Connect to VPN
        uses: "hkai-engineer/openvpn-github-action@v2.1.1"
        with:
          config_file: ./github/workflows/client.ovpn
          hostname: ${{ secrets.OVPN_HOSTNAME }}
          port: ${{ secrets.OVPN_PORT }}
          ca: ${{ secrets.OVPN_CA }}
          cert: ${{ secrets.OVPN_CERT }}
          username: ${{ secrets.OVPN_USERNAME }}
          password: ${{ secrets.OVPN_PASSWORD }}
          passphrase: ${{ secrets.OVPN_PASSPHRASE }}
          client_key: ${{ secrets.OVPN_CLIENT_KEY }}
          tls_auth_key: ${{ secrets.OVPN_TLS_AUTH_KEY }}
          tls_crypt_key: ${{ secrets.OVPN_TLS_CRYPT_KEY }}

      - name: Build something
        run: ./gradlew clean build
      # The openvpn process is automatically terminated in post-action phase
```

## License

[MIT](LICENSE)
