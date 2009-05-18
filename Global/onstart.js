function managesessions_initialize() {
    var tab = {
	href: '/cms/managesessions',
	highlight_action: 'managesessions',
	title: 'Sessions',
	roles: ['Administrator']
    };

    registerTab(tab);
}