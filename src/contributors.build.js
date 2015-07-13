var Promise = require('bluebird'),
	fs = Promise.promisifyAll(require('fs')),
	octonode = require('octonode'),
	usersStreaks = require('./contributors.streak')
	ghStreak = Promise.promisify(require('gh-streak')),
	players = require('./../players');	

var users = [],
	hasChange = false,
	client = Promise.promisifyAll(octonode.client());

Promise.map(players, function(player) {
	return client.getAsync('/users/' + player, {})
		.spread(function(status, body, headers) {
			return ghStreak(player).then(function(currentStreak) {
				if (!usersStreaks[player] || usersStreaks[player] < currentStreak) {
					hasChange = true;
					usersStreaks[player] = currentStreak;
				}

				body.longestStreak = usersStreaks[player];
				users.push(body);
  				console.log('[Script] Contributors total: ' + users.length  + ', statusCode: ' + status)	
			})
	})
}).then(function() {
	users = users.sort(function(a, b) {
  		return (a.longestStreak < b.longestStreak);
	});
	var dataContributors = 'module.exports = ' + JSON.stringify(users), 
		dataContributorsStreak = 'module.exports = ' + JSON.stringify(usersStreaks);

	return fs.writeFileAsync('./src/contributors.js', dataContributors)
		.then(function(json) {
			if (hasChange) 
				return fs.writeFileAsync('./src/contributors.streak.js', dataContributorsStreak)

			return Promise.resolve();
		})
		.then(function() {
			console.log('[Script] Finished!')
		})
})