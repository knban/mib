# mib

[![Stories in Ready](https://badge.waffle.io/keyvanfatehi/mib.png?label=ready&title=Ready)](https://waffle.io/keyvanfatehi/mib)
[![Build Status][strider-build-status-img]][strider-build-status-link]
[![Dependency Status][dep-img]][dep-link]
[![devDependency Status][dev-dep-img]][dev-dep-link]
[![NPM][npm-badge-img]][npm-badge-link]

### Modular Issue Board

**mib** is a [kanban](http://en.wikipedia.org/wiki/Kanban_(development)) board that uses Github issues as cards.

An important distinction made by this project versus other implementations is that it refuses to create a 1:1 relation between a board and repositories.

This results in a design in which projects from multiple providers can collect into a single board.

Webhooks are automatically installed to keep cards and issues in sync, however Github does not perform hookshots for every action (e.g. assignee change, label change).

## Supported Providers

Currently only Github is implemented, but I plan to work towards adding more in the future.

- [x] Github
- [ ] Gitlab
- [ ] Bitbucket

## Freedom Features

I believe your data should always be portable, as such import/export is first-class.

* Export board data as a JSON file
* Import board data via JSON file

## Usage

There are (will be) two ways to use **mib**

### Hosted

**mib** will be operated professionally downstream that will include a free plan.

Open source projects will be 100% free of charge at the downstream entity.

More information coming soon, once **mib** is stable.

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

**mib** uses the MEAN stack (MongoDB, Express, Angular, NodeJS)

Mobile development is being done with [Ionic](http://ionicframework.com/).

It's easy to get started hacking features (maybe you want to help get Bitbucket/Gitlab supported sooner?)

* Fork the project
* Clone your fork
* `npm install`
* Examine the tests and go from there
* Pull request!

## Community

There isn't one yet. Reach out by creating an issue and I'll put some effort into creating one, like setting up an IRC channel.

## Special Thanks

DigitalFilm Tree & DFTi

[dev-dep-img]: https://david-dm.org/keyvanfatehi/mib/dev-status.svg
[dev-dep-link]: https://david-dm.org/keyvanfatehi/mib#info=devDependencies
[dep-img]: https://david-dm.org/keyvanfatehi/mib.svg
[dep-link]: https://david-dm.org/keyvanfatehi/mib
[npm-badge-img]: https://nodei.co/npm/mib.png?downloads=true&stars=true
[npm-badge-link]: https://nodei.co/npm/mib/
[strider-build-status-img]: https://strider.critiqueapp.com/keyvanfatehi/mib/badge
[strider-build-status-link]: https://strider.critiqueapp.com/keyvanfatehi/mib
