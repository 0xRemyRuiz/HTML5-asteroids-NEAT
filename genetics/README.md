NEAT algorithm
==============
nodejs is used so heavy neural network computation doesn't cost more in the game process, it makes two different processes.
The main reason is that there is no real thread nor fork capabilities in the javascript engine espacially in the browser.

Master-Client-Server protocol
-----------------------------
In the intent to be able to manage multiple games simultaneously to speed up training process, the master-client-server protocol has been implemented.
Simply put, you can launch the master client as a flat html file to load in the browser. Its file is located at `debug_views/master_controller.html`. It is a very simple (and boring) html page that connects to the node server, can send commands to it and gather information of ongoing process.


More to be defined as implementation progresses...
