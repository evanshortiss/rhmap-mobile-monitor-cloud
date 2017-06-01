# rhmap-mobile-monitor-cloud
Cloud application that provides mobile platform statistics to its companion app.


## Prerequisites
* node v.4.4.3
* npm
* mongodb >= 2.4.6


## Running
To run this application you need to set some environment variables. These are as
follows:

* FH_MILLICORE - RHMAP host, e.g acme.redhatmobile.com. Is passed to fhc target
* FHC_USER - Used for fhc login
* FHC_PASS - Used for fhc login

Once these are set just run `npm start` after you've finished an `npm install`.
The next two sections describe how you might set them.

NOTE: It is recommended to create a user account with restricted permissions
specifically for use as the `FHC_USER` and `FHC_PASS`.

### Locally
You can set these locally by creating a `.env` file in this project folder like
so:

```
FH_MILLICORE=acme.us.redhatmobile.com
FHC_PASS=your-pa55w0rd
FHC_USER=you@acme.com
```

Replace these with actual values of course! Alternatively you can do the
following on Linux/macOS systems in the terminal session you plan to run the
application from:

```
export FH_MILLICORE=acme.us.redhatmobile.com
export FHC_PASS=yourpa55w0rd
export FHC_USER=you@acme.com
```

### On Red Hat Mobile Application Platform
Use the Environment Variables section for your Cloud Application in the Studio.


## Architecture Overview
This application is a Red Hat Mobile Application Platform compatible express
server. It utilises the `fh-mbaas-api` Sycnchronisation Framework to facilitate
the sycnchronisation of data between client devices and the server's MongoDB instance.

For more information on the sycnchronisation API click [here](https://access.redhat.com/documentation/en/red-hat-mobile-application-platform-hosted/).

The following datasets are exposed for sycnchronisation:

* newsfeed - Latest Red Hat Mobile infrastructure alerts and updates.
* resources - The current resource usage statistics for the domain this
application is running on.

### Newsfeed
This dataset is refreshed using a cron job that runs every 3 minutes. Devices
can request the data more frequently than this if configured to do so, but the
actual datastore will only be updated when the cron runs and not on demand. This
prevents our application from flooding the RSS endpoint with too many requests.

### Resources
Similar to the newsfeed, resources will be updated using a cron job to prevent
excessive load on the domain resource checks. This job will run once per minute.
Any client requesting resources will receive always receive the latest entry
from the database.
