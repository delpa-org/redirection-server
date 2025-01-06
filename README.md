# Delpa Redirection Server

This repository includes the code that runs at https://packages.delpa.org. It
redirects to the corresponding Melpa snapshot repository located at
https://github.com/delpa-org/melpa-snapshot-*.

For more information about Delpa, see https://delpa.org.

## Development

You need [podman][] installed.

To build the server, run:

    npm run build

To start the server, run:

    npm run start

[podman]: https://podman.io/
