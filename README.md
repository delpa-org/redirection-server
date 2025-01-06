# Delpa Redirection Server

This repository includes the code that runs at https://packages.delpa.org. It
redirects to the corresponding Melpa snapshot repository located at
https://github.com/delpa-org/melpa-snapshot-*.

For more information about Delpa, see https://delpa.org.

## Build and Run

You need [podman][] and [npm][] installed.

To build the server for production, run:

    npm run build_prod

To start the server for production, run:

    HOST_ADDRESS="example.org" npm run start_prod

You need to replace `example.org` with your own server address.
[Any address acceptable by Caddy](https://caddyserver.com/docs/caddyfile/concepts#addresses) works.
If no `HOST_ADDRESS` is specified, then it is set to `localhost`.

## Development

You need [podman][] and [npm][] installed.

To build the server for test, run:

    npm run build

To start the server, run:

    npm run start

It also accepts an optional `HOST_ADDRESS` environment variable, same as the
production container image.

After starting the test server, to run test:

    npm run test

The `snapshot_versions.json` file in this repo is deliberately set wrong and for
test purpose only. In production build, it will be replaced by the file grabbed
from https://delpa.org/snapshot_versions.json.

[npm]: https://docs.npmjs.com/cli
[podman]: https://podman.io/
