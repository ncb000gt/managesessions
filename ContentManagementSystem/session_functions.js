function getSessions() {
    var start = req.data.start || 0;
    var length = parseInt(req.data.length) || 15;
    var context = req.data.context || 'default';
    var hits = app.getSessions();
    var results = hits.slice(start, length);
    this.writeResults(this.extractSessions,hits,results,start,length,null,false);
}

function extractSessions(result){
    var remaining = (result.getTimeRemaining()/(60000))+'';
    var idx = remaining.indexOf('.');
    var obj = {
	id: result._id,
	_id: result._id,
	username: (result.user)?(result.user.getUsername()||result.user.username):'No Username',
	created: "Session Started: " + result.getOnSince().format('hh:mm a'),
	lastactive: "Last Activity: " + result.getLastActive().format('hh:mm a'),
	timeremaining: remaining.substring(0,idx+3)
    };

    return obj;
}

function getSessionsData() {
    function sort_sessions(a, b) {
	var a_la = a.getLastActive().getTime();
	var b_la = b.getLastActive().getTime();
	if (a_la > b_la) return 1;
	else if (a_la == b_la) return 0;
	return -1;
    }

    var sessions = app.getSessions();
    sessions.sort(sort_sessions);

    return {
	total: sessions.length,
	leastactive: sessions[0]._id
    };
}

function logoutSessions() {
    var sessions = req.data.ids;
    for each(var session in app.getSessions()) {
	if (session._id in sessions) {
	    session.logout();
	}
    }
}