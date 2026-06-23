/*
 *  Amina App 1.0
 *
 *  Copyright (c) 2015 Amina
 *  http://amina.co.kr
 *
 */

(function($) {
	$.fn.amina_menu = function(option) {
        var cfg = { name: '.sub', show: '', hide: '' };

		if(typeof option == "object")
            cfg = $.extend(cfg, option);

		var subname = cfg.name;
		var submenu = $(this).find(subname).parent();

		submenu.each(function(i){
			$(this).hover(
				function(e){
					var targetmenu = $(this).children(subname + ":eq(0)");
					if (targetmenu.queue().length <= 1) {
						switch(cfg.show) {
							case 'show'  : targetmenu.show(); break;
							case 'fade'  : targetmenu.fadeIn(300, 'swing'); break;
							default		 : targetmenu.slideDown(300, 'swing'); break;
						}
					}
				},
				function(e){
					var targetmenu = $(this).children(subname + ":eq(0)");
					switch(cfg.hide) {
						case 'fade'		: targetmenu.fadeOut(100, 'swing'); break;
						case 'slide'	: targetmenu.slideUp(100, 'swing'); break;
						default			: targetmenu.hide(); break;
					}
				}
			) //end hover
			$(this).click(function(){
				$(this).children(subname + ":eq(0)").hide();
			})
		}); //end submenu.each()

		$(this).find(subname).css({display:"none", visibility:"visible"});
	}
}(jQuery));

function go_page(url) {
	document.location.href = decodeURIComponent(url);
	return false;
}

function tsearch_submit(f) {

	if (f.psearch.value.length < 2) {
		salert("info","","검색어는 두글자 이상 입력해주세요");
		f.psearch.select();
		f.psearch.focus();
		return false;
	}

	// 검색에 많은 부하가 걸리는 경우 이 주석을 제거하세요.
	var cnt = 0;
	for (var i=0; i<f.psearch.value.length; i++) {
		if (f.psearch.value.charAt(i) == ' ')
			cnt++;
	}

	if (cnt > 1) {
        salert("info","","빠른 검색을 위해 한단어만 검색하실 수 있습니다.");
		f.psearch.select();
		f.psearch.focus();
		return false;
	}

	url=updateQueryString('psearch',f.psearch.value);
	document.location.href=url;
	return false;
}

$(document).ready(function() {

    $('#favorite').on('click', function(e) {
        var bookmarkURL = window.location.href;
        var bookmarkTitle = document.title;
        var triggerDefault = false;

        if (window.sidebar && window.sidebar.addPanel) {
            // Firefox version < 23
            window.sidebar.addPanel(bookmarkTitle, bookmarkURL, '');
        } else if ((window.sidebar && (navigator.userAgent.toLowerCase().indexOf('firefox') > -1)) || (window.opera && window.print)) {
            // Firefox version >= 23 and Opera Hotlist
            var $this = $(this);
            $this.attr('href', bookmarkURL);
            $this.attr('title', bookmarkTitle);
            $this.attr('rel', 'sidebar');
            $this.off(e);
            triggerDefault = true;
        } else if (window.external && ('AddFavorite' in window.external)) {
            // IE Favorite
            window.external.AddFavorite(bookmarkURL, bookmarkTitle);
        } else {
            // WebKit - Safari/Chrome
            alert((navigator.userAgent.toLowerCase().indexOf('mac') != -1 ? 'Cmd' : 'Ctrl') + '+D 키를 눌러 즐겨찾기에 등록하실 수 있습니다.');
        }

        return triggerDefault;
    });

	// Tooltip
    $('body').tooltip({
		selector: "[data-toggle='tooltip']"
    });

	// Mobile Menu
    $('#mobile_nav').sly({
		horizontal: 1,
		itemNav: 'centered', //basic
		smart: 1,
		mouseDragging: 1,
		touchDragging: 1,
		releaseSwing: 1,
		startAt: menu_startAt,
		speed: 300,
		elasticBounds: 1,
		dragHandle: 1,
		dynamicHandle: 1
    });

	if(menu_sub) {
		$('#mobile_nav_sub').sly({
			horizontal: 1,
			itemNav: 'centered', //basic
			smart: 1,
			mouseDragging: 1,
			touchDragging: 1,
			releaseSwing: 1,
			startAt: menu_subAt,
			speed: 300,
			elasticBounds: 1,
			dragHandle: 1,
			dynamicHandle: 1
		});
	}

	$(window).resize(function(e) {
		$('#mobile_nav').sly('reload');
		if(menu_sub) {
			$('#mobile_nav_sub').sly('reload');
		}
	});

	// Amina Menu
	$('.nav-slide').amina_menu({name:'.sub-slide', show: sub_show, hide: sub_hide});

	// Carousel Swipe
	$(".swipe-carousel").swiperight(function(e) {
		e.preventDefault();
		$(this).carousel('prev');
	});
	
	$(".swipe-carousel").swipeleft(function(e) {  
		e.preventDefault();
		$(this).carousel('next');
	});
/*
var nav_bottom_btn=$('#go-btn .go-bottom');
var nav_top_btn=$('#go-btn .go-bottom');

	// Top & Bottom Button

	$(window).scroll(function() {
		if ($(this).scrollTop() > 100) {
			$(nav_top_btn).removeClass("btn_disable");
		} else {
			$(nav_top_btn).addClass("btn_disable");
		}

	    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight-100) {
			$(nav_bottom_btn).addClass("btn_disable");
		} else {
			$(nav_bottom_btn).removeClass("btn_disable");
	    }
	});
*/
	$('.go-hamburger').on('click', function () {
		if (g5_member_id!='') {
			sidebar_open('sidebar-user');
		} else {
			openLoginModal();
		}
	});

	$('.go-home').on('click', function () {
		document.location.href="/index.php";
	});

	$('.go-comment').on('click', function () {
		var $target = $('.view-wrap .view-comment').first();
		if ($target.length) {
			var pad = 12;
			var y = Math.max(0, $target.offset().top - pad);
			$('html, body').animate({ scrollTop: y }, 500);
		}
		return false;
	});

	$('.go-top').on('click', function () {
		if (!$(this).hasClass('btn_disable')) {
			$('html, body').animate({ scrollTop: '0px' }, 500);
			return false;
		}
	});

	$('.go-bottom').on('click', function () {
		if (!$(this).hasClass('btn_disable')) {
			$('html, body').animate({ scrollTop: $(document).height() }, 500);
			return false;
		}
	});

});
