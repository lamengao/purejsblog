var postsEditable = false;
var args = {};
$(document).ready(function(){
	init_();
	if (formKey == '' || ssKey == ''){
		showMsg('notconfig');
	}
	var url = 'http://spreadsheets.google.com/feeds/list/' + ssKey + '/od6/public/values?alt=json-in-script';
	if ($.isEmptyObject(args)){
		url += '&max-results=' + maxPostsNum;
		url += '&reverse=true';
		$.getJSON(url + '&callback=?', showHomePage);
	} else if (args.action && args.action == 'new'){
		newPost();
		return ;
	} else if (args.p){
		if (!/^(\d+)$/.test(args.p)){
			location.href = location.pathname;
			return ;
		}
		url += '&max-results=1&sq=postid%3D' + args.p;
		$.getJSON(url + '&callback=?', showSinglePage);
	} else if (args.page){
		if (!/^(\d+)$/.test(args.page)){
			location.href = location.pathname;
			return ;
		}
		var index = (args.page - 1) * maxPostsNum + 1;
		url += '&start-index=' + index + '&max-results=' + maxPostsNum;
		url += '&reverse=true';
		$.getJSON(url + '&callback=?', showHomePage);
	} else{
		showMsg('notfound');
	}
});

function init_(){
	args = getArgs();
	if (args.editable){
		postsEditable = true;
		delete args.editable;
	}
	document.title = blogTitle;
	$('#header h1:first a').text(blogTitle).attr('href', makeUrl('home'));
	$('#homelink').attr('href', makeUrl('home'));
	$('#aboutlink').attr('href', makeUrl('post', aboutPageId));
	loadingAnimate(true);
}

function showHomePage(data){
	loadingAnimate(false);
	var feed = data.feed;
	var totalResults = parseInt(feed.openSearch$totalResults.$t);
	var entry = feed.entry;
	if (!entry){
		showMsg('nopost');
		initEditableButton();
		return ;
	}
	for (var i = 0; i < entry.length; i++){
		var article = entry[i];
		$article = makeArticleDom(article);
		$article.appendTo($('#articles'));
	}
	pageLinks(totalResults);
	initEditableButton();
}

function showSinglePage(data){
	loadingAnimate(false);
	var feed = data.feed;
	var totalResults = parseInt(feed.openSearch$totalResults.$t);
	if (!feed.entry){
		showMsg('notfound');
		return ;
	}
	var entry = feed.entry[0];
	$article = makeArticleDom(entry);
	$article.appendTo($('#articles'));
	document.title = $article.find('h2.entry-title a').text();
	initEditableButton();
	if (args.action && args.action == 'edit'){
		editPost($article);
	}
}

function newPost(){
	loadingAnimate(false);
	document.title = 'Add New Post';
	initActionForm_('new');
	$("#ss-form").submit(function(){
		var pwd = $('#pwdinput').val();
		if (pwd == ''){
			alert('ERROR: The password field is empty.');
			return false;
		}
	});
	$('#hiddenframe').load(function(){
		var pwd = $('#pwdinput').val();
		if (pwd == '')
			return ;
		$('#formbox p.msg a').attr('href', makeUrl('home'));
		$('#formbox p.msg').hide().fadeIn();
	});
}

function editPost($article){
	initActionForm_('edit');
	var id = $article.data('id');
	$('#postIdInput').val(id);
	$('#formbox a.cancel')
		.attr('href', makeUrl('post', id));
	$('#titleinput').val($article.data('title'))
	$('#contenttextarea').val($article.data('content'));
	$('#titleinput, #contenttextarea').keyup(function(){
		var title = $('#titleinput').val();
		var content = $('#contenttextarea').val();
		updatePost($article, title, content);
	});
	$("#ss-form").submit(function(){
		var pwd = $('#pwdinput').val();
		if (pwd == ''){
			alert('ERROR: The password field is empty.');
			return false;
		}
	});
	$('#hiddenframe').load(function(){
		var pwd = $('#pwdinput').val();
		if (pwd == '')
			return ;
		setTimeout(function(){
			location.href = makeUrl('post', id);
		}, 1000);
	});
}

function initActionForm_(type){
	var $form = $('#ss-form');
	switch(type){
		case 'new':
			$('#formbox').show();
			$('#formbox a.cancel, #formbox p.msg a')
				.attr('href', location.pathname);
			break;
		case 'edit':
			$form.find('h2').text('Edit Post');
			$('#sbtinput').val('Save');
			$('#formbox').show();
			break;
	}
	$('#titleinput').attr('name', titleFieldName);
	$('#contenttextarea').attr('name', contentFieldName);
	$('#pwdinput').attr('name', passwordFieldName);
	$('#postIdInput').attr('name', postidFieldName);
	var actionUrl = "https://spreadsheets.google.com/formResponse?formkey=" +
			formKey;
	$form.attr("action", actionUrl);
}

function getArgs(){
	var args = new Object();
	var query = location.search.substring(1);
	var pairs = query.split("&");
	for(var i = 0; i < pairs.length; i++) {
		var pos = pairs[i].indexOf('=');
		if (pos == -1) continue;
		var argname = pairs[i].substring(0,pos);
		var value = pairs[i].substring(pos+1);
		value = decodeURIComponent(value);
		args[argname] = value;
	}
	return args;
}

loadingAnimate.timeId = false;
function loadingAnimate(isRun){
	var $load = $('#articleloading');
	var $loadDots = $('#loadingdots');
	if (isRun){
		$('#loadingmsg').text('Loading');
		$load.show();
		$loadDots.show();
		loadingAnimate.timeId = setInterval(function(){
			var dotsNum = $loadDots.text().length;
			if (dotsNum < 6){
				$loadDots.text($loadDots.text() + '.');
			} else{
				$loadDots.text('.');
			}
		}, 500);
	} else{
		if (loadingAnimate.timeId)
			clearInterval(loadingAnimate.timeId);
		$load.hide();
	}
}

function showMsg(type){
	loadingAnimate(false);
	$('#articleloading').show();
	$('#loadingdots').hide();
	switch(type){
		case 'nopost':
			$('#loadingmsg').text('No posts.');
			break;
		case 'notfound':
			$('#loadingmsg').text('Page not found');
			break;
		case 'notconfig':
			$('#loadingmsg').html('This blog is not yet setup. <a href="http://purejsblog.cuoluo.net/index.html?p=20">Learn more...</a>');
			break;
	}
}

function makeArticleDom(entry){
	var articleHtml = '<div class="article">' +
			'<div class="entry-date"><abbr class="published"></abbr></div>' +
			'<h2 class="entry-title"><a href=""></a></h2>' +
			'<div class="entry-content"></div></div>';
	var $article = $(articleHtml);
	var id = entry.gsx$postid.$t;
	var published = entry.gsx$timestamp.$t.split(' ')[0];
	var title = entry.gsx$title.$t;
	var content = entry.gsx$content.$t;

	$article.data('id', id);
	$article.data('title', title);
	$article.data('content', content);
	$article.attr('id', 'post_' + id);
	$article.find('abbr.published').text(published);
	var postUrl = makeUrl('post', id);
	$article.find('h2.entry-title a').attr('href', postUrl);
	updatePost($article, title, content);
	var $editBox = makeEditBox(entry);
	$article.find('h2.entry-title').after($editBox);
	$article.hover(
		function () {
			if (postsEditable)
				$(this).find('div.editbox').addClass("visible");
		},
		function () {
			if (postsEditable)
				$(this).find('div.editbox').removeClass("visible");
		}
	);

	return $article;
}

function updatePost($article, title, content){
	$article.find('h2.entry-title a').text(title);
	if (contentToHtml){
		$article.find('div.entry-content').html('<pre>'+content+'</pre>');
	} else{
		var html = $('<div/>').text(content).html();
		$article.find('div.entry-content').html('<pre>'+html+'</pre>');
	}
}

function makeEditBox(entry){
	var id = entry.gsx$postid.$t;
	var editBoxHtml = '<div class="editbox">' +
			'<ul class="mini_commands">' +
			'<li><a class="editlink" href="/">Edit</a></li>' +
			'<li><a class="deletelink" onclick="return false;" href="/">Delete</a></li>' +
			'</ul></div>';
	var $editBox = $(editBoxHtml);
	$editBox.find('a.editlink').attr('href', '?action=edit&p=' + id);
	$editBox.find('a.deletelink').click(deletePost)
		.attr('href', '?action=delete&p=' + id);
	return $editBox;
}

function deletePost(){
	var pwd = window.prompt("Input admin password to confirm delete.","");
	if (!pwd)
		return ;
	var $article = $(this).parents("div.article");
	var id = $article.data('id');
	$('#titleinput').val('');
	$('#contenttextarea').val('');
	$('#pwdinput').val(pwd);
	$('#postIdInput').val(id);
	initActionForm_('delete');
	$('#sbtinput').click();
	$('#hiddenframe').load(function(){
		var pwd = $('#pwdinput').val();
		if (pwd == '')
			return ;
		$article.fadeOut(1600, function(){
			location.href = location.pathname;
		});
	});
}

function makeUrl(type, val){
	var url = location.pathname + '?';
	if (postsEditable)
		url += 'editable=true&';
	switch(type){
		case 'post':
			url += 'p=' + val;
			break;
		case 'page':
			url += 'page=' + val;
			break;
		case 'home':
			url = location.pathname;
			break;
	}
	if (location.protocol == 'file:' && $.browser.msie)
		url = 'file://' + url;
	return url;
}

function pageLinks(total){
	var lastPage = Math.ceil(total/maxPostsNum);
	if (lastPage == 1)
		return ;
	var $pagination = $('#pagination');
	$pagination.show();
	if (args.page)
		var curPage = parseInt(args.page);
	else
		var curPage = 1;
	if (curPage == 1){
		var prevLinkHtml = '<span class="disabled prev_page">« Previous</span>';
		var nextLinkHtml = '<a rel="next" class="next_page" href="' +
			makeUrl('page', 2) + '">Next »</a>';
	} else if (curPage == lastPage){
		var prePage = lastPage - 1;
		var prevLinkHtml = '<a rel="prev start" class="prev_page" href="' +
				makeUrl('page', prePage) + '">« Previous</a>';
		var nextLinkHtml = '<span class="disabled next_page">Next »</span>';
	} else{
		var prevLinkHtml = '<a rel="prev start" class="prev_page" href="' +
				makeUrl('page', (curPage - 1)) + '">« Previous</a>';
		var nextLinkHtml = '<a rel="next" class="next_page" href="' +
				makeUrl('page', (curPage + 1)) + '">Next »</a>';
	}
	var pageLinksHtml = '';
	for (var i = 1; i <= lastPage; i++){
		if (i == curPage)
			pageLinksHtml += '<span class="current">' + i + '</span>';
		else
			pageLinksHtml += '<a rel="next" href="'+makeUrl('page', i)+'">'+i+'</a>';
	}
	pageLinksHtml = prevLinkHtml + pageLinksHtml + nextLinkHtml;
	$(pageLinksHtml).appendTo($pagination);
}

function initEditableButton(){
	if ($('div.article').length > 1)
		var t = 'make posts ';
	else
		var t = 'make post ';
	if (args.action == 'edit')
		return ;
	var $editonoff = $('#editonoff');
	$editonoff.show();
	if (postsEditable){
		$editonoff.removeClass('off').addClass('on');
		$editonoff.text(t + 'uneditable');
		makeEditable(true);
	} else{
		$editonoff.removeClass('on').addClass('off');
		$editonoff.text(t + 'editable');
		makeEditable(false);
	}
	$editonoff.click(function(){
		if ($(this).hasClass('on')){
			// turn off editable
			$(this).text(t + 'editable');
			$(this).removeClass('on').addClass('off');
			postsEditable = false;
			makeEditable(false);
		} else{
			// turn on editable
			$(this).text(t + 'uneditable');
			$(this).removeClass('off').addClass('on');
			postsEditable = true;
			makeEditable(true);
		}
	});
	$('#helplink').addClass('leftline');
}

function makeEditable(b){
	$('#aboutlink').attr('href', makeUrl('post', aboutPageId));
	var curPage = parseInt($('#pagination span.current').text());
	var $addnewpost = $('#addnewpost');
	if (b)
		$addnewpost.show();
	else
		$addnewpost.hide();
	$('#pagination a').each(function(i){
		if ($(this).hasClass('prev_page')){
			this.href = makeUrl('page', curPage - 1);
		} else if ($(this).hasClass('next_page')){
			this.href = makeUrl('page', curPage + 1);
		} else{
			var page = $(this).text();
			this.href = makeUrl('page', page);
		}
	});
	$('div.article').each(function(i){
		var id = $(this).data('id');
		$(this).find('h2.entry-title a').attr('href', makeUrl('post', id));
	});
}
