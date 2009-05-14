function getSessions() {
    var start = req.data.start || 0;
    var length = parseInt(req.data.length) || 15;
    var context = req.data.context || 'default';
    var hits = app.getSessions();
    var results = hits.slice(start, length);
    this.writeResults(this.extractSessions,hits,results,start,length,null,false);
}

function extractSessions(result){
	var obj = {
	    id: result.id,
	    _id: result._id,
	    username: (result.user)?(result.user.getUsername()|result.user.username):'No Username',
	    created: "Session Started: " + result.getOnSince(),
	    lastmodified: "Last Login/Logout: " +result.getLastModified(),
	    lastactive: "Last Activity: " + result.getLastActive(),
	    timeremaining: result.getTimeRemaining()
	};

	return obj;
}