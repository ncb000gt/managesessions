function managesessions() {
    res.write(
	this.frame(
	    {
		title: 'Axiom CMS - Manage Sessions',
		nav: 'managesessions_nav',
		content: 'managesessions_content',
		scripts: ['manage_sessions.js']
	    }
	)
    );
}