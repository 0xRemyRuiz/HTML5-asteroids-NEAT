HTML5-Asteroids
===============
NEAT algorithm based on a pure javascript asteroids (cf. http://dougmcinnes.com/2010/05/12/html-5-asteroids).
It is a simple adaptation of a game on which is plugged a NeuroEvolution of Augmenting Topologies algorithm.
It's main purpose is for me to learn by doing.

INSTALL and RUN
---------------
Just open the `index.html` file on your favorite browser and try to get a highscore.
The game is playable by itself, no need of npm which only handles the training an autoplay of the AI agent.

To run the NEAT algorithm for training and autoplay first install the node handler.
`cd genetics`
`npm install`
Then use `npm run start [port]`.
Base port is 3000 but if you already have a service running on that port you can specify another one.
In the case you want to change the port without specifying in the command, change the config value `WEBSOCKET_PORT` in `game/config.js`.
Remember to do the same in every html clients (such as `game/config.js` file or in the `genetics/debug_views/master_controller.html`).

NOTES
-----
Base git repo of the game: https://github.com/dmcinnes/HTML5-Asteroids
Some modifications and a few refactoring have been made but as minimally as possible.

I've added some variables in `game/config.js` to easily control some elements like speed, rendering (not used) and auto-start.
I've added a bunch of code in the `game/main.js` so the AI can understand the screen easier.
I've also added a barebone interface in `index.html` and in `game/main.js` to reflect and visualize data and controls.
Finally I've added my name as a copyright below the copyright and date from Doug McInnes.

I could have had upgraded the game's interface from jquery to vue or react but that would probably have been a waste of time.

I noted that the original implementation of the game by Doug seems different than the original game but it doesn't matter. 
