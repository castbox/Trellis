# Installed Version Boundary

The current CLI initializes new projects and reapplies its managed templates
only when the installed version exactly matches the CLI version. A different
or missing installed version is rejected before project files are read.

Published release manifest files remain historical records. The runtime does
not load them or use them to transform an installation.

Managed-template inventory and conflict behavior are specified in
[the update command](./commands-update.md). Release packaging and version
checks are specified in [Release Process](./release-process.md).
