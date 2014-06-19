Mïmisbrunnr
===========

The idea with Mïmis is a public irrevocable data store. Users insert mappings into a distributed hash table and the peers coordniate to allow that pair to be retreived at any point in the future.

There are two main uses I'm interested in: scientific publishing and entertainment distribution. For science, it is a global store where all the data is collected and accessed. For entertainment. I want to overlay a system of tipping to allow content producters to be directly compensated for their work.

I want to have it be browser-based, but there are no DHTs that operate over [WebRTC](http://webrtc.org). The most promising work is [WebTorrent](https://github.com/feross/webtorrent).

