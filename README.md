# mib

_Movable issue board_

**WIP**

*mib* is a [kanban](http://en.wikipedia.org/wiki/Kanban) board that uses Github issues as cards.

It does not try to create 1:1 relations between boards and github projects.

It is designed in such a way as to allow multiple Provider sources to collect into a single board.

This means you can have cards from issues in Bitbucket, Github, Gitlab together on one board.

Card comments are placed on Provider objects. *mib* simply brings these in.

*mib* only adds a thin layer of metadata on top of the Provider objects for the purposes of kanban.

*mib* currently supports only Github. More providers will be added once the prototype is complete, starting with Bitbucket.

Slack integration will also be first-class.

