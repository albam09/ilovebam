// Sidebar
var sidebar_id;
var sidebar_size = "-355px";
var sidebar_hide = "-355px";
/** 닫힘 위치(px). 브라우저·줌에 따라 -355px가 부동소수로 들어오므로 엄격 비교하지 않는다. */
var sidebar_hide_px = -355;

/** 모바일 화면 또는 실제 모바일 기기(PC보기 전환 포함) */
function is_mobile_device() {
	if (typeof g5_is_mobile !== "undefined" && g5_is_mobile == "1") {
		return true;
	}
	if (typeof g5_is_mobile_device !== "undefined" && g5_is_mobile_device == "1") {
		return true;
	}
	return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function is_sidebar() {
	if (is_mobile_device()) {
		return 'left';
	}
	var width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
	return (width > 767) ? 'right' : 'left';
}

/** 모바일=왼쪽 슬라이드·닫기버튼 우측 / PC=오른쪽 슬라이드·닫기버튼 좌측 */
function sidebar_sync_layout_class() {
	var div = $("#sidebar-box");
	if (!div.length) {
		return;
	}
	var side = is_sidebar();
	div.toggleClass("sidebar-axis-left", side === "left");
	div.toggleClass("sidebar-axis-right", side === "right");
}

/** 현재 축(side) 기준으로 사이드바가 화면 밖(닫힘)에 가까운지 */
function sidebar_axis_is_hidden(div, side) {
	var raw = div.css(side);
	if (raw === undefined || raw === null || raw === "" || raw === "auto") {
		return true;
	}
	var px = parseFloat(raw);
	if (isNaN(px)) {
		return true;
	}
	return px <= sidebar_hide_px + 1;
}

/**
 * 모바일↔PC(뷰포트·device 전환) 시 left/right 축이 바뀌므로,
 * 반대쪽 인라인 위치를 제거하고 현재 축 기준으로 닫힘/열림을 맞춘다.
 * (모바일 기기는 is_sidebar()가 항상 left)
 */
function sidebar_reset_axis() {
	var div = $("#sidebar-box");
	if (!div.length) return;

	sidebar_sync_layout_class();

	var side = is_sidebar();
	var other = (side === "left") ? "right" : "left";
	var maskVisible = $("#sidebar-box-mask").is(":visible");

	div.css(other, "");

	if (maskVisible) {
		div.css(side, "0px");
		return;
	}

	var cur = div.css(side);
	if (!cur || cur === "auto" || cur === "") {
		div.css(side, sidebar_hide);
	}
}

function ani_sidebar(div, type, val) {
	div.stop(true, true);
	if(type == "left") {
		div.animate({ left : val }); 
	} else {
		div.animate({ right : val }); 
	}
}

function sidebar_mask(opt) {

	var mask = $("#sidebar-box-mask");
	if(opt == 'show') {
		mask.show();
		$('html, body').css({'overflow': 'hidden', 'height': '100%'});
	} else {
		mask.hide();
		$('html, body').css({'overflow': '', 'height': ''});
	}
}

function sidebar_open(id) {

	sidebar_reset_axis();

	var div = $("#sidebar-box");
	var side = is_sidebar();
	var hidden = sidebar_axis_is_hidden(div, side);
	var is_show;

	if(id == sidebar_id) {
		if(hidden) {
			is_show = false;
			ani_sidebar(div, side, '0px'); 
			sidebar_mask('show');
/*
			if(side == "left") {
				sidebar_mask('show');
			} else {
				sidebar_mask('hide');
			}
*/
		} else {
			is_show = false;
			ani_sidebar(div, side, sidebar_hide); 
			sidebar_mask('hide');
		}
	} else {
		if(hidden) {
			is_show = true;
			ani_sidebar(div, side, '0px'); 
		} else {
			is_show = true;
		}
		sidebar_mask('show');
/*
		if(side == "left") {
			sidebar_mask('show');
		} else {
			sidebar_mask('hide');
		}
*/
	}

	// Show
	if(is_show) {
		$('.sidebar-item').hide();

		if(id == "sidebar-user") {
			$('.sidebar-common').hide();
		} else {
			$('.sidebar-common').show();
		}

		switch(id) {
			case 'sidebar-response'	: $('#' + id + '-list').load(sidebar_url + '/response.php'); break;
			//case 'sidebar-cart'		: $('#' + id + '-list').load(sidebar_url + '/cart.php'); break;
		}

		$('#' + id).show();

		// 메뉴가 4칸 그리드가 되도록 부족한 칸은 빈 메뉴로 채움
		try {
			sidebar_fill_menu_grid();
		} catch (e) {}

		$('#sidebar-content').scrollTop(0);
	}

	// Save id
	sidebar_id = id;

	return false;
}

// 메뉴 4칸 고정 정렬 (개수가 4의 배수가 아니면 빈칸 추가)
function sidebar_fill_menu_grid() {
	var cols = 4;
	var $containers = $('#sidebar-content .menu-container');
	if (!$containers.length) return;

	$containers.each(function() {
		var $c = $(this);

		// 기존 빈칸 제거 후 다시 계산
		$c.find('a.menu-item.menu-item-empty, a.my-menu-item.menu-item-empty').remove();

		// 두 클래스 모두 포함하여 갯수 파악
		var count = $c.find('a.menu-item, a.my-menu-item').length;
		var need = (cols - (count % cols)) % cols;

		if (need > 0) {
			// 컨테이너 내의 다른 아이템 클래스 확인하여 빈칸 클래스 결정
			var itemClass = $c.find('a.my-menu-item').length > 0 ? 'my-menu-item' : 'menu-item';
			for (var i = 0; i < need; i++) {
				$c.append('<a href=\"#\" class=\"' + itemClass + ' menu-item-empty\" tabindex=\"-1\" aria-hidden=\"true\"></a>');
			}
		}
	});
}

// sidebar Empty
function sidebar_empty(id) {

	// Ajax
	switch(id) {
		case 'sidebar-cart' : $('#' + id + '-list').load(sidebar_url + '/cart.php?del=1'); break;
	}

	return false;
}

// sidebar Read
function sidebar_read(id) {

	$('#sidebar-response-list').load(sidebar_url + '/response.php?read=1&id=' + id);

	return false;
}

// sidebar Href
function sidebar_href(url) {

	$('.sidebar-menu .panel-collapse').hide();

	document.location.href = decodeURIComponent(url);

	return false;
}

// sidebar Login
function sidebar_login(f) {
	if (f.mb_id.value == '') {
		salert("info","","아이디를 입력해주세요.");
		f.mb_id.focus();
		return false;
	}
	if (f.mb_password.value == '') {
		salert("info","","비밀번호를 입력해주세요.");
		f.mb_password.focus();
		return false;
	}
	return true;
}

// sidebar Search
function sidebar_search(f) {

	if (f.psearch.value.length < 2) {
		salert("info","","검색어는 두글자 이상 입력해주세요");
		f.psearch.select();
		f.psearch.focus();
		return false;
	}

	f.action = "/?psearch="+f.psearch.value;

	return true;
}

var response_work=false;

// sidebar Response Count
function sidebar_response() {

	if (response_work) {
		console.log('another alarm works..');
		return false;
	}

	console.log('response execute : ' + new Date);

	response_work=true;

	var $labels = $('.sidebarLabel');
	var $counts = $('.sidebarCount');
	var url = sidebar_url + '/response.php?count=1';

	try {
		$.get(url, function(data) {
			// 카운트 처리
			if (data!=null && data.count > 0) {
				$counts.text(number_format(data.count));
				$labels.show();
			} else {
				$labels.hide();
			}
			
			// 알람 정보 처리 (통합된 알람 체크)
			if (data!=null && data.alarm && data.alarm.msg=='SUCCESS') {
				if (typeof show_alarm == 'function') {
					show_alarm(data.alarm.title, data.alarm.content, data.alarm.url, data.alarm.me_id);
				}
			}
			
			response_work=false;
		}, "json");
		
	} catch (ex) {
		response_work=false;
	}

	return false;
}

var timer_response;

// Response Auto Check
if(g5_is_member && sidebar_time > 0) {

	function call_sidebar_response() {
		timer_response=setInterval(function() {
			sidebar_response();
		}, sidebar_time * 1000); // Time = 1000ms ex) 10sec = 10 * 1000
		sidebar_response();
	}
}

function close_sidebar() {
	var div = $("#sidebar-box");
	var side = is_sidebar();
	ani_sidebar(div, side, sidebar_hide); 
	sidebar_mask('hide');
	return false;
}
$(document).ready(function () {

	sidebar_sync_layout_class();

	// Sidebar Close
	$('.sidebar-close').on('click', function () {
		close_sidebar();
    });

	// Sidebar Menu
	$('.sidebar-menu .ca-head').on('click', function () {
		var clicked_toggle = $(this);

		if(clicked_toggle.hasClass('active')) {
			clicked_toggle.parents('.sidebar-menu').find('.ca-head').removeClass('active');
		} else {
			clicked_toggle.parents('.sidebar-menu').find('.ca-head').removeClass('active');
			clicked_toggle.addClass('active');
		}
	});

	// Sidebar Goto Top
	$('.sidebar-scrollup').on('click', function () {
        $("html, body").animate({
            scrollTop: 0
        }, 500);
        return false;
    });

	// 뷰포트 변경(회전, 주소창, 데스크톱 사이트 요청 등) 시 축 동기화
	$(window).on('resize orientationchange', function () {
		sidebar_reset_axis();
	});

	if (g5_is_member && sidebar_time > 0) {
		call_sidebar_response();
	}

	// 페이지 로드시에도 그리드 채우기 실행
	try {
		sidebar_fill_menu_grid();
	} catch (e) {}
});

function gotonearshop() {
	close_sidebar();
	if ($("#geolocation").hasClass("nogpsrecogize")) {
		swal.fire({
			title: "위치확인불가",
			text: "현재 위치를 확인할수 없어, 근처업소를 찾을수 없습니다!",
			icon: "info",
			allowOutsideClick: true,
			allowEscapeKey: true,
			confirmButtonColor: "var(--group_color_39)",
			cancelButtonColor: "#474747",
			showConfirmButton: true,
			showCancelButton: true,
			confirmButtonText: "사용방법",
			cancelButtonText: "닫기",
			timer: 5000,
			timerProgressBar: true,
		}).then((result) => {
			/* Read more about isConfirmed, isDenied below */
			if (result.isConfirmed) {
				pageopen("/howto.php");
			}
		});

		//salert('info','위치확인불가','현재 위치를 확인할수 없어, 근처업소를 찾을수 없습니다!');
		return false;
	}
	document.location.href="/nearshop.php";
}

function pageopen(url) {
	if (typeof g5_is_mobile != "undefined" && g5_is_mobile=="1") {
		window.open(url,"_blank");
	} else {
		if(jQuery().fancybox) {
			$.fancybox({
				'width'				: 800,
				'height'			: '99%',
				'autoScale'			: false,
				'transitionIn'		: 'none',
				'transitionOut'		: 'none',
				'overlayOpacity'	: 0.8, // Set opacity to 0.8
				'overlayColor'		: "#000000", // Set color to Black
				'type'				: 'iframe',
		        'href'				: url,
				// --- 콜백 함수 추가 ---
				'onStart': function() {
				  // fancybox가 열릴 때 body의 스크롤을 숨깁니다.
				  $('body').css('overflow', 'hidden');
				},
				'onClosed': function() {
				  // fancybox가 닫힐 때 body의 스크롤을 다시 보여줍니다.
				  $('body').css('overflow', 'visible');
				}					
			});
		} 		
	}
}

function openUpsoReport() {
	var u = url;
	if (typeof g5_is_mobile != "undefined" && g5_is_mobile == "1") {
		try {
			var w = window.open(u, "upsoreport");
			if (w) {
				try { w.focus(); } catch(eFocus) {}
			}
		} catch(eOpen) {}
		return false;
	}
	if (jQuery().fancybox) {
		$.fancybox({
			'width'				: 1100,
			'height'			: '95%',
			'autoScale'			: false,
			'transitionIn'		: 'none',
			'transitionOut'		: 'none',
			'overlayOpacity'	: 0.8,
			'overlayColor'		: "#000000",
			'type'				: 'iframe',
			'href'				: u,
			'onStart': function () {
				$('body').css('overflow', 'hidden');
			},
			'onClosed': function () {
				$('body').css('overflow', 'visible');
			}
		});
	} else {
		try {
			var w2 = window.open(u, "upsoreport");
			if (w2) {
				try { w2.focus(); } catch(eFocus2) {}
			}
		} catch(eOpen2) {}
	}
	return false;
}