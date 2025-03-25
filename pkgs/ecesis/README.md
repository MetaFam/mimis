# Mïmis Prep

## The Goal

[Μïmis](//forets.web.app) aims to be a distributed interface system for [IPFS](//ipfs.io) bootstrapped solely from IPFS itself.

Μïmis is backed by CouchDB for ease of syncing and efficiency of computation. It is not as simple an interface for massaging data as [ActiveRecord](https://api.rubyonrails.org/classes/ActiveRecord/Base.html).

The idea is to conglomerate sets of overlapping paths in a context forest. For example, a set of paths might include:

* /book/by/Ursula K. LeGuinn/A Wizard of Earthsea
* /A Wizard of Earthsea by Ursula K. LeGuinn
* /award/Hugo/1978/Best Novella/winner/1
* /user/23jkl4…/favorite/books/34

Each path represents a tree. Trees are published as IPFS directories. The tree is shredded as it is intaken into branches. A branch filesystem containing only the given path is created and its IPFS id is saved.

There is a special symlink starting with `...` that will be processed by finding the IPFS id for that directory branch.

# Tasks

There is a frontend interface with this app, but most of the work is done in rake tasks.

* `rake import:gutenberg[tmp/gutenberg]`

Search the given directory for files named like `GUTINDEX.\d\d\d\d`. It will then attempt to parse them and import the data as `Book`s.

It is about 99% accurate at the moment.

* `rake import:irc`

Connect to `#ebooks` and `#cinch-bots` as `hugobot` on [IRCHighway](irc://irc.irchighway.net/#ebooks), and listen for commands.

There are really only two commands: `que` and `deq`. The first populates a queue with shares of books that don't have data. The seconds begins clearing the queue by requesting the given share and repeating after the download completes.

* `rake export:gutenlinks`

For the Gutenberg data, create a forest of links of the format:

* `book/by/#{author}/#{title}` → `.../gutenberg/1/2/3/1234/`
* `book/by/#{title}(, #{author})?` → `.../gutenberg/1/2/3/1234/`

*Unix filenames are limited to 256 characters, and there are book author/title pairs that are longer than that, so this has been abandoned.*

* `rake export:gutenjson`

Exports a timestamped directory tree into `tmp/` with numbered directories each containing a json array with elements of the form:

    {
      type: 'link',
      source: ['book', 'by', author, title],
      destination: ['gutenberg', '1', '2', '123'],
    }

* `rake import:gutencache`

Imports the epubs, covers, & metadata from Project Gutenberg's [ebook cache](bin/gutenberg.sh) as a IPFS hash. The structure of the directory is:

* `/index.html`
* `/cover.png`
* `/metadata.opf`
* `/images/…`

A IPFS id is returned for a filesystem with paths following these patterns:

* `['book', 'by', author, title, ipfsId]`
* `['book', 'by', 'bibliographically', author.biblio, title, ipfsId]`
* `['book', "title #{author && ', by #{author}'}", ipfsId]`
* `['book', 'language', lang, "title #{author && ', (by|par|di) #{author}'}", ipfsId]`
* `subjects.each((s) => ['subject', ...s.path, ipfsId])`
* `['project', 'Gutenberg', gutenbergId, ipfsId]`

Where `ipfsId` are the various content directories' ids. All strings have only slashes, nulls, & percent signs percent encoded. _(So they look as normal as possible, but don't contain disallowed characters.)_

