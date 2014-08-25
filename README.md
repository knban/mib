# Modular Issue Board

[![NPM][npm-badge-img]][npm-badge-link]

[![Dependency Status][dep-img]][dep-link]
[![devDependency Status][dev-dep-img]][dev-dep-link]

[![Code Climate](https://codeclimate.com/github/knban/mib/badges/gpa.svg)](https://codeclimate.com/github/knban/mib)
[![Test Coverage](https://codeclimate.com/github/knban/mib/badges/coverage.svg)](https://codeclimate.com/github/knban/mib)
[![Build Status][strider-build-status-img]][strider-build-status-link]

[strider-build-status-img]: https://strider.knban.com/knban/mib/badge
[strider-build-status-link]: https://strider.knban.com/knban/mib
[dev-dep-img]: https://david-dm.org/keyvanfatehi/mib/dev-status.svg
[dev-dep-link]: https://david-dm.org/keyvanfatehi/mib#info=devDependencies
[dep-img]: https://david-dm.org/keyvanfatehi/mib.svg
[dep-link]: https://david-dm.org/keyvanfatehi/mib
[npm-badge-img]: https://nodei.co/npm/mib.png?downloads=true&stars=true
[npm-badge-link]: https://nodei.co/npm/mib/


**mib** is a [kanban](http://en.wikipedia.org/wiki/Kanban_%28development%29) board that uses Github issues as cards.

An important distinction made by this project versus other implementations is that it refuses to create a 1:1 relation between a board and repositories.

This results in a design in which projects from multiple providers can collect into a single board.

Webhooks are automatically installed to keep cards and issues in sync, however Github does not perform hookshots for every action (e.g. assignee change, label change).

## Features

* Add/remove boards
* Add/remove columns [#40](https://github.com/keyvanfatehi/mib/issues/40)
* Add/remove cards [#47](https://github.com/keyvanfatehi/mib/issues/47)
* Drag and drop cards
* Grant users access to your board(s)
* Export board data as a JSON file
* Import board data via JSON file
* 3rd party integrations via plugin system

## Usage

There are (will be) two ways to use **mib**

### Hosted

**mib** will be operated professionally downstream that will include a free plan.

Open source projects will be 100% free of charge at the downstream entity.

More information coming soon, once **mib** is stable.

I'm looking for people to help me with this -- reach out to me at keyvan[at]mindynamics[dot]com if you're interested!

### Self-Hosting

**mib** is and will always be free and open source software. As such you may clone and run the project yourself.
Here's how:

* Clone the repo to your server
* Create a github application in your user settings page and take note of the keys
* Create a `.env` file wherever you cloned the project and add the keys. Example provided below.
* Tell supervisor or whatever you're using to run `server.js` with `node`
* Copy the public/js/config.example.js to public/js/config.js and adjust the endpoint
* Setup a reverse proxy, do SSL, whatever

Example `.env` file:

```
GITHUB_CLIENT_ID=stuff
GITHUB_CLIENT_SECRET=morestuff
```

Better (read: more opinionated) instructions can be provided if requested.

## Development

**mib** uses the MEANR stack (MongoDB, Express, Angular, NodeJS, ReactJS)

It's easy to get started hacking features (maybe you want to help get Bitbucket/Gitlab supported sooner?)

* Fork the project
* Clone your fork
* `npm install`
* Examine the tests and go from there
* Pull request!

# Plugins

Plugins provide 3rd party integrations, add API routes, provide webhooks, or otherwise extend **mib**.

## mib-github

[![NPM](https://nodei.co/npm/mib-github.png?mini=true)](https://nodei.co/npm/mib-github/)

* link repositories to boards
  * imports existing issues as cards
  * creates a webhook entry on the repository
* adds webhook consumer route for card/issue updates
* automatically updates card data on board load
* custom card template
