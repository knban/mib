# mib

_Movable issue board_

**work in progress** there is no proper security right now, please do not use it yet

**mib** is a [kanban](http://en.wikipedia.org/wiki/Kanban_(development)) board prototype that uses Github issues as cards.

It does not try to create 1:1 relations between boards and github projects.

It is designed in such a way as to allow projects from different providers to collect into a single board.

This means your cards can be issues from projects in Bitbucket, Github, or Gitlab -- all on one board.

Webhooks are automatically installed to keep cards and issues in sync.

## Supported Providers

- [x] Github
- [ ] Gitlab
- [ ] Bitbucket

## Freedom Features

* Export board data as a JSON file
* Import board data via JSON file

## Usage

There are (will be) two ways to use **mib**

### Hosted

**mib** will be operated professionally and include a free plan.

Open source projects will be 100% free of charge.

More information coming soon.

### Self-Hosting

**mib** is and will always be free and open source software. As such you may clone and run the project yourself.
Here's how:

* Clone the repo to your server (it's not on npm yet, I'll do that at 1.0.0)
* Create a github application in your user settings page and take note of the keys
* Create a `.env` file wherever you cloned the project and add the keys. Example provided below.
* Tell supervisor or whatever you're using to run `server.js` with `node`
* Setup a reverse proxy, do SSL, whatever

Example `.env` file:

```
GITHUB_CLIENT_ID=stuff
GITHUB_CLIENT_SECRET=morestuff
```

Better (read: more opinionated) instructions can be provided if requested.

## Development

**mib** uses the MEAN stack (MongoDB, Express, Angular, NodeJS)

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
