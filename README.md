# Delpa Redirection Server

This repository includes the code that runs at https://packages.delpa.org. It
redirects to the corresponding Melpa snapshot repository located at
https://github.com/delpa-org/melpa-snapshot-*.

For more information about Delpa, see https://delpa.org.

## Build

You need [podman][] installed.

To build the server for production, run:

    npm run build_prod

## Development

You need [podman][] installed.

To build the server for test, run:

    npm run build

To start the server, run:

    npm run start

After starting the test server, to run test:

    npm run test

The `snapshot_versions.json` file in this repo is deliberately set wrong and for
test purpose only. In production build, it will be replaced by the file grabbed
from https://delpa.org/snapshot_versions.json.

[podman]: https://podman.io/
