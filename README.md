# Delpa Redirection Server

This repository includes the code that runs at https://packages.delpa.org. It
redirects to the corresponding Melpa snapshot repository located at
https://github.com/delpa-org/melpa-snapshot-*.

For more information about Delpa, see https://delpa.org.

## Prebuilt Images

Prebuilt images are available in the [GitHub container
registry](https://github.com/delpa-org/redirection-server/pkgs/container/delpa-redirection-server).
You can retrieve the latest version by running:

    docker pull ghcr.io/delpa-org/delpa-redirection-server:latest

You may use [podman][] in place of [Docker][] in the command above.

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

## Bug Report and Feature Request

To report a bug or request a feature about this redirection server, please open
a ticket at the [issue tracker][]. To report a bug or request a feature about
the Delpa project in general, please open a ticket at the [Delpa meta issue
tracker][].

## Ask a Question or Show Off a Trick

Please talk about them in the [Forum][].

## Contribution

Please follow the [official GitHub guide][] to create a pull request for this
Git repository.

## License

Unless otherwise stated:

    Copyright(C) 2025 Hong Xu <hong@topbug.net>

    See the `COPYING` file for license details.

[Delpa meta issue tracker]: https://github.com/delpa-org/meta/issues
[Docker]: https://docs.docker.com/
[Forum]: https://github.com/delpa-org/meta/discussions
[issue tracker]: https://github.com/delpa-org/redirection-server/issues
[npm]: https://docs.npmjs.com/cli
[official GitHub guide]: https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests
[podman]: https://podman.io/
