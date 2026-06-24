if (typeof window.commonJsLoaded=='undefined') {
	// 전역 변수
	var errmsg = "";
	var errfld = null;

	// 필드 검사
	function check_field(fld, msg)
	{
		if ((fld.value = trim(fld.value)) == "")
			error_field(fld, msg);
		else
			clear_field(fld);
		return;
	}

	// 필드 오류 표시
	function error_field(fld, msg)
	{
		if (msg != "")
			errmsg += msg + "\n";
		if (!errfld) errfld = fld;
		fld.style.background = "#BDDEF7";
	}

	// 필드를 깨끗하게
	function clear_field(fld)
	{
		fld.style.background = "#FFFFFF";
	}

	function trim(s)
	{
		var t = "";
		var from_pos = to_pos = 0;

		for (i=0; i<s.length; i++)
		{
			if (s.charAt(i) == ' ')
				continue;
			else
			{
				from_pos = i;
				break;
			}
		}

		for (i=s.length; i>=0; i--)
		{
			if (s.charAt(i-1) == ' ')
				continue;
			else
			{
				to_pos = i;
				break;
			}
		}

		t = s.substring(from_pos, to_pos);
		//				alert(from_pos + ',' + to_pos + ',' + t+'.');
		return t;
	}

	// 자바스크립트로 PHP의 number_format 흉내를 냄
	// 숫자에 , 를 출력
	function number_format(data)
	{

		var tmp = '';
		var number = '';
		var cutlen = 3;
		var comma = ',';
		var i;

		data = data + '';

		var sign = data.match(/^[\+\-]/);
		if(sign) {
			data = data.replace(/^[\+\-]/, "");
		}

		len = data.length;
		mod = (len % cutlen);
		k = cutlen - mod;
		for (i=0; i<data.length; i++)
		{
			number = number + data.charAt(i);

			if (i < data.length - 1)
			{
				k++;
				if ((k % cutlen) == 0)
				{
					number = number + comma;
					k = 0;
				}
			}
		}

		if(sign != null)
			number = sign+number;

		return number;
	}

	function numberWithCommas(x) {
		x = x.toString();
		var pattern = /(-?\d+)(\d{3})/;
		while (pattern.test(x))
			x = x.replace(pattern, "$1,$2");
		return x;
	}

	// 새 창
	function popup_window(url, winname, opt)
	{
		window.open(url, winname, opt);
	}


	// 폼메일 창
	function popup_formmail(url)
	{
		opt = 'scrollbars=yes,width=417,height=385,top=10,left=20';
		popup_window(url, "wformmail", opt);
	}

	// , 를 없앤다.
	function no_comma(data)
	{
		var tmp = '';
		var comma = ',';
		var i;

		for (i=0; i<data.length; i++)
		{
			if (data.charAt(i) != comma)
				tmp += data.charAt(i);
		}
		return tmp;
	}

	// 삭제 검사 확인
	function del(href)
	{
		if(confirm(aslang[19])) { //한번 삭제한 자료는 복구할 방법이 없습니다.\n\n정말 삭제하시겠습니까?
			var iev = -1;
			if (navigator.appName == 'Microsoft Internet Explorer') {
				var ua = navigator.userAgent;
				var re = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
				if (re.exec(ua) != null)
					iev = parseFloat(RegExp.$1);
			}

			// IE6 이하에서 한글깨짐 방지
			if (iev != -1 && iev < 7) {
				document.location.href = encodeURI(href);
			} else {
				document.location.href = href;
			}
		}
	}

	// 쿠키 입력
	function set_cookie(name, value, expirehours, domain)
	{
		var today = new Date();
		today.setTime(today.getTime() + (60*60*1000*expirehours));
		document.cookie = name + "=" + escape( value ) + "; path=/; expires=" + today.toGMTString() + ";";
		if (domain) {
			document.cookie += "domain=" + domain + ";";
		}
	}

	// 쿠키 얻음
	function get_cookie(name)
	{
		var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
		if (match) return unescape(match[2]);
		return "";
	}

	// 쿠키 지움
	function delete_cookie(name)
	{
		var today = new Date();

		today.setTime(today.getTime() - 1);
		var value = get_cookie(name);
		if(value != "")
			document.cookie = name + "=" + value + "; path=/; expires=" + today.toGMTString();
	}

	var last_id = null;
	function menu(id)
	{
		if (id != last_id)
		{
			if (last_id != null)
				document.getElementById(last_id).style.display = "none";
			document.getElementById(id).style.display = "block";
			last_id = id;
		}
		else
		{
			document.getElementById(id).style.display = "none";
			last_id = null;
		}
	}

	function textarea_decrease(id, row)
	{
		if (document.getElementById(id).rows - row > 0)
			document.getElementById(id).rows -= row;
	}

	function textarea_original(id, row)
	{
		document.getElementById(id).rows = row;
	}

	function textarea_increase(id, row)
	{
		document.getElementById(id).rows += row;
	}

	// 글숫자 검사
	function check_byte(content, target)
	{
		var i = 0;
		var cnt = 0;
		var ch = '';
		var cont = document.getElementById(content).value;

		for (i=0; i<cont.length; i++) {
			ch = cont.charAt(i);
			if (escape(ch).length > 4) {
				cnt += 2;
			} else {
				cnt += 1;
			}
		}
		// 숫자를 출력
		document.getElementById(target).innerHTML = cnt;

		return cnt;
	}

	// 브라우저에서 오브젝트의 왼쪽 좌표
	function get_left_pos(obj)
	{
		var parentObj = null;
		var clientObj = obj;
		//var left = obj.offsetLeft + document.body.clientLeft;
		var left = obj.offsetLeft;

		while((parentObj=clientObj.offsetParent) != null)
		{
			left = left + parentObj.offsetLeft;
			clientObj = parentObj;
		}

		return left;
	}

	// 브라우저에서 오브젝트의 상단 좌표
	function get_top_pos(obj)
	{
		var parentObj = null;
		var clientObj = obj;
		//var top = obj.offsetTop + document.body.clientTop;
		var top = obj.offsetTop;

		while((parentObj=clientObj.offsetParent) != null)
		{
			top = top + parentObj.offsetTop;
			clientObj = parentObj;
		}

		return top;
	}

	function flash_movie(src, ids, width, height, wmode)
	{
		var wh = "";
		if (parseInt(width) && parseInt(height))
			wh = " width='"+width+"' height='"+height+"' ";
		return "<object classid='clsid:d27cdb6e-ae6d-11cf-96b8-444553540000' codebase='http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=6,0,0,0' "+wh+" id="+ids+"><param name=wmode value="+wmode+"><param name=movie value="+src+"><param name=quality value=high><embed src="+src+" quality=high wmode="+wmode+" type='application/x-shockwave-flash' pluginspage='http://www.macromedia.com/shockwave/download/index.cgi?p1_prod_version=shockwaveflash' "+wh+"></embed></object>";
	}

	function obj_movie(src, ids, width, height, autostart)
	{
		var wh = "";
		if (parseInt(width) && parseInt(height))
			wh = " width='"+width+"' height='"+height+"' ";
		if (!autostart) autostart = false;
		return "<embed src='"+src+"' "+wh+" autostart='"+autostart+"'></embed>";
	}

	function doc_write(cont)
	{
		document.write(cont);
	}

	function updateMarginTop() {
		let marginTop = 5;

		if ($('#gnb_cate').is(':visible')) {
			marginTop += $('#gnb_cate').outerHeight();
		} else if ($('#gnb_area').is(':visible')) {
			marginTop += $('#gnb_area').outerHeight();
		} else if ($('#gnb_bbs').is(':visible')) {
			marginTop += $('#gnb_bbs').outerHeight();
		}
/*
		if ($('.at-title').length>0) {
			$('.at-title').css('margin-top', marginTop+'px');
		} else {
			$('.at-body').css('margin-top', marginTop + 'px');
		}
*/
		$('.at-title').css('margin-top', '10px');
	}
	
	var win_password_lost = function(href) {
		window.open(href, "win_password_lost", "left=50, top=50, width=617, height=330, scrollbars=1");
	}

	var last_area_status="";
	var last_type_status="";

	$(document).ready(function(){
		$("#login_password_lost, #ol_password_lost").click(function(){
			win_password_lost(this.href);
			return false;
		});
		// 화면 크기 변경 감지
		$(window).on('resize', function() {
			updateMarginTop();
		});
	});

	/**
	 * 포인트 창
	 **/
	var win_point = function(href) {
		var new_win = window.open(href, 'win_point', 'left=100,top=100,width=600, height=600, scrollbars=1');
		new_win.focus();
	}

	/**
	 * 쪽지 창
	 **/
	var win_memo = function(href) {
		var new_win = window.open(href, 'win_memo', 'left=100,top=100,width=620,height=500,scrollbars=1');
		new_win.focus();
	}

	/**
	 * 쪽지 창
	 **/
	var check_goto_new = function(href, event) {
		if( !(typeof g5_is_mobile != "undefined" && g5_is_mobile) ){
			if (window.opener && window.opener.document && window.opener.document.getElementById) {
				event.preventDefault ? event.preventDefault() : (event.returnValue = false);
				window.open(href);
				//window.opener.document.location.href = href;
			}
		}
	}

	/**
	 * 메일 창
	 **/
	var win_email = function(href) {
		var new_win = window.open(href, 'win_email', 'left=100,top=100,width=600,height=580,scrollbars=1');
		new_win.focus();
	}

	/**
	 * 자기소개 창
	 **/
	var win_profile = function(href) {
		var new_win = window.open(href, 'win_profile', 'left=100,top=100,width=620,height=510,scrollbars=1');
		new_win.focus();
	}

	/**
	 * 스크랩 창
	 **/
	var win_scrap = function(href) {
		var new_win = window.open(href, 'win_scrap', 'left=100,top=100,width=600,height=600,scrollbars=1');
		new_win.focus();
	}

	/**
	 * 홈페이지 창
	 **/
	var win_homepage = function(href) {
		var new_win = window.open(href, 'win_homepage', '');
		new_win.focus();
	}

	/**
	 * 우편번호 창
	 **/
	var win_zip = function(frm_name, frm_zip, frm_addr1, frm_addr2, frm_addr3, frm_jibeon) {
		if(typeof daum === 'undefined'){
			alert(aslang[20]); //다음 우편번호 postcode.v2.js 파일이 로드되지 않았습니다.
			return false;
		}

		var zip_case = 1;   //0이면 레이어, 1이면 페이지에 끼워 넣기, 2이면 새창

		var complete_fn = function(data){
			// 팝업에서 검색결과 항목을 클릭했을때 실행할 코드를 작성하는 부분.

			// 각 주소의 노출 규칙에 따라 주소를 조합한다.
			// 내려오는 변수가 값이 없는 경우엔 공백('')값을 가지므로, 이를 참고하여 분기 한다.
			var fullAddr = ''; // 최종 주소 변수
			var extraAddr = ''; // 조합형 주소 변수

			// 사용자가 선택한 주소 타입에 따라 해당 주소 값을 가져온다.
			if (data.userSelectedType === 'R') { // 사용자가 도로명 주소를 선택했을 경우
				fullAddr = data.roadAddress;

			} else { // 사용자가 지번 주소를 선택했을 경우(J)
				fullAddr = data.jibunAddress;
			}

			// 사용자가 선택한 주소가 도로명 타입일때 조합한다.
			if(data.userSelectedType === 'R'){
				//법정동명이 있을 경우 추가한다.
				if(data.bname !== ''){
					extraAddr += data.bname;
				}
				// 건물명이 있을 경우 추가한다.
				if(data.buildingName !== ''){
					extraAddr += (extraAddr !== '' ? ', ' + data.buildingName : data.buildingName);
				}
				// 조합형주소의 유무에 따라 양쪽에 괄호를 추가하여 최종 주소를 만든다.
				extraAddr = (extraAddr !== '' ? ' ('+ extraAddr +')' : '');
			}

			// 우편번호와 주소 정보를 해당 필드에 넣고, 커서를 상세주소 필드로 이동한다.
			var of = document[frm_name];

			of[frm_zip].value = data.zonecode;

			of[frm_addr1].value = fullAddr;
			of[frm_addr3].value = extraAddr;

			if(of[frm_jibeon] !== undefined){
				of[frm_jibeon].value = data.userSelectedType;
			}

			setTimeout(function(){
				of[frm_addr2].focus();
			} , 100);
		};

		switch(zip_case) {
			case 1 :    //iframe을 이용하여 페이지에 끼워 넣기
				var daum_pape_id = 'daum_juso_page'+frm_zip,
					element_wrap = document.getElementById(daum_pape_id),
					currentScroll = Math.max(document.body.scrollTop, document.documentElement.scrollTop);
				if (element_wrap == null) {
					element_wrap = document.createElement("div");
					element_wrap.setAttribute("id", daum_pape_id);
					element_wrap.style.cssText = 'display:none;border:1px solid;left:0;width:100%;height:300px;margin:5px 0;position:relative;-webkit-overflow-scrolling:touch;';
					element_wrap.innerHTML = '<img src="//i1.daumcdn.net/localimg/localimages/07/postcode/320/close.png" id="btnFoldWrap" style="cursor:pointer;position:absolute;right:0px;top:-21px;z-index:1" class="close_daum_juso" alt="접기 버튼">';
					jQuery('form[name="'+frm_name+'"]').find('input[name="'+frm_addr1+'"]').before(element_wrap);
					jQuery("#"+daum_pape_id).off("click", ".close_daum_juso").on("click", ".close_daum_juso", function(e){
						e.preventDefault();
						jQuery(this).parent().hide();
					});
				}

				new daum.Postcode({
					oncomplete: function(data) {
						complete_fn(data);
						// iframe을 넣은 element를 안보이게 한다.
						element_wrap.style.display = 'none';
						// 우편번호 찾기 화면이 보이기 이전으로 scroll 위치를 되돌린다.
						document.body.scrollTop = currentScroll;
					},
					// 우편번호 찾기 화면 크기가 조정되었을때 실행할 코드를 작성하는 부분.
					// iframe을 넣은 element의 높이값을 조정한다.
					onresize : function(size) {
						element_wrap.style.height = size.height + "px";
					},
					maxSuggestItems : g5_is_mobile ? 6 : 10,
					width : '100%',
					height : '100%'
				}).embed(element_wrap);

				// iframe을 넣은 element를 보이게 한다.
				element_wrap.style.display = 'block';
				break;
			case 2 :    //새창으로 띄우기
				new daum.Postcode({
					oncomplete: function(data) {
						complete_fn(data);
					}
				}).open();
				break;
			default :   //iframe을 이용하여 레이어 띄우기
				var rayer_id = 'daum_juso_rayer'+frm_zip,
					element_layer = document.getElementById(rayer_id);
				if (element_layer == null) {
					element_layer = document.createElement("div");
					element_layer.setAttribute("id", rayer_id);
					element_layer.style.cssText = 'display:none;border:5px solid;position:fixed;width:300px;height:460px;left:50%;margin-left:-155px;top:50%;margin-top:-235px;overflow:hidden;-webkit-overflow-scrolling:touch;z-index:1000';
					element_layer.innerHTML = '<img src="//i1.daumcdn.net/localimg/localimages/07/postcode/320/close.png" id="btnCloseLayer" style="cursor:pointer;position:absolute;right:-3px;top:-3px;z-index:1" class="close_daum_juso" alt="닫기 버튼">';
					document.body.appendChild(element_layer);
					jQuery("#"+rayer_id).off("click", ".close_daum_juso").on("click", ".close_daum_juso", function(e){
						e.preventDefault();
						jQuery(this).parent().hide();
					});
				}

				new daum.Postcode({
					oncomplete: function(data) {
						complete_fn(data);
						// iframe을 넣은 element를 안보이게 한다.
						element_layer.style.display = 'none';
					},
					maxSuggestItems : g5_is_mobile ? 6 : 10,
					width : '100%',
					height : '100%'
				}).embed(element_layer);

				// iframe을 넣은 element를 보이게 한다.
				element_layer.style.display = 'block';
		}
	}

	/**
	 * 새로운 비밀번호 분실 창 : 101123
	 **/
	win_password_lost = function(href)
	{
		var new_win = window.open(href, 'win_password_lost', 'width=617, height=330, scrollbars=1');
		new_win.focus();
	}

	/**
	 * 설문조사 결과
	 **/
	var win_poll = function(href) {
		var new_win = window.open(href, 'win_poll', 'width=616, height=500, scrollbars=1');
		new_win.focus();
	}

	/**
	 * 쿠폰
	 **/
	var win_coupon = function(href) {
		var new_win = window.open(href, "win_coupon", "left=100,top=100,width=700, height=600, scrollbars=1");
		new_win.focus();
	}

	/**
	 * 스크린리더 미사용자를 위한 스크립트 - 지운아빠 2013-04-22
	 * alt 값만 갖는 그래픽 링크에 마우스오버 시 title 값 부여, 마우스아웃 시 title 값 제거
	 **/
	$(function() {
		$('a img').on('mouseover', function() {
			var $a_img_title = $(this).attr('alt');
			if ($a_img_title) $(this).attr('title', $a_img_title);
		}).on('mouseout', function() {
			$(this).removeAttr('title');
		});

		// 페이지 로딩 후 모든 이미지의 title, alt 속성 제거
		$('img').removeAttr('title').removeAttr('alt');

		// 이미지 로딩 실패 시 기본 이미지로 교체 (/img/no_img.png)
		(function(){
			var NO_IMG = '/img/no_img.png';
			$('img').each(function(){
				var img = this;
				var fallback = function(){
					if (img.getAttribute('data-noimg') === '1') return;
					img.setAttribute('data-noimg','1');
					if (!img.getAttribute('src') || img.getAttribute('src')==='') {
						img.setAttribute('src', NO_IMG);
						return;
					}
					if (img.src.indexOf(NO_IMG) !== -1) return;
					img.setAttribute('src', NO_IMG);
				};
				$(img).on('error', fallback);
				// 이미 오류 상태이거나 src 비어있으면 즉시 대체
				if (!img.getAttribute('src') || (img.complete && typeof img.naturalWidth !== 'undefined' && img.naturalWidth === 0)) {
					fallback();
				}
			});
		})();
	});

	/**
	 * 텍스트 리사이즈
	**/
	function font_resize(id, rmv_class, add_class, othis)
	{
		var $el = $("#"+id);

		if((typeof rmv_class !== "undefined" && rmv_class) || (typeof add_class !== "undefined" && add_class)){
			$el.removeClass(rmv_class).addClass(add_class);

			set_cookie("ck_font_resize_rmv_class", rmv_class, 1, g5_cookie_domain);
			set_cookie("ck_font_resize_add_class", add_class, 1, g5_cookie_domain);
		}

		if(typeof othis !== "undefined"){
			$(othis).addClass('select').siblings().removeClass('select');
		}
	}

	/**
	 * 댓글 수정 토큰
	**/
	function set_comment_token(f)
	{
		if(typeof f.token === "undefined")
			$(f).prepend('<input type="hidden" name="token" value="">');

		$.ajax({
			url: g5_bbs_url+"/ajax.comment_token.php",
			type: "GET",
			dataType: "json",
			async: false,
			cache: false,
		    timeout: 3000, // sets timeout to 3 seconds
			success: function(data, textStatus) {
				f.token.value = data.token;
			}
		});
	}

	$(function(){
		$(".win_point").click(function() {
			win_point(this.href);
			return false;
		});

		$(".win_memo").click(function() {
			win_memo(this.href);
			return false;
		});

		$(".win_email").click(function() {
			win_email(this.href);
			return false;
		});

		$(".win_scrap").click(function() {
			win_scrap(this.href);
			return false;
		});

		$(".win_profile").click(function() {
			win_profile(this.href);
			return false;
		});

		$(".win_homepage").click(function() {
			win_homepage(this.href);
			return false;
		});

		$(".win_password_lost").click(function() {
			win_password_lost(this.href);
			return false;
		});

		/*
		$(".win_poll").click(function() {
			win_poll(this.href);
			return false;
		});
		*/

		$(".win_coupon").click(function() {
			win_coupon(this.href);
			return false;
		});

		// 사이드뷰
		var sv_hide = false;
		$(".sv_member, .sv_guest").click(function() {
			$(".sv").removeClass("sv_on");
			$(this).closest(".sv_wrap").find(".sv").addClass("sv_on");
		});

		$(".sv, .sv_wrap").hover(
			function() {
				sv_hide = false;
			},
			function() {
				sv_hide = true;
			}
		);

		$(".sv_member, .sv_guest").focusin(function() {
			sv_hide = false;
			$(".sv").removeClass("sv_on");
			$(this).closest(".sv_wrap").find(".sv").addClass("sv_on");
		});

		$(".sv a").focusin(function() {
			sv_hide = false;
		});

		$(".sv a").focusout(function() {
			sv_hide = true;
		});

		// 셀렉트 ul
		var sel_hide = false;
		$('.sel_btn').click(function() {
			$('.sel_ul').removeClass('sel_on');
			$(this).siblings('.sel_ul').addClass('sel_on');
		});

		$(".sel_wrap").hover(
			function() {
				sel_hide = false;
			},
			function() {
				sel_hide = true;
			}
		);

		$('.sel_a').focusin(function() {
			sel_hide = false;
		});

		$('.sel_a').focusout(function() {
			sel_hide = true;
		});

		$(document).click(function() {
			if(sv_hide) { // 사이드뷰 해제
				$(".sv").removeClass("sv_on");
			}
			if (sel_hide) { // 셀렉트 ul 해제
				$('.sel_ul').removeClass('sel_on');
			}
		});

		$(document).focusin(function() {
			if(sv_hide) { // 사이드뷰 해제
				$(".sv").removeClass("sv_on");
			}
			if (sel_hide) { // 셀렉트 ul 해제
				$('.sel_ul').removeClass('sel_on');
			}
		});

		$(document).on( "keyup change", "textarea#wr_content[maxlength]", function(){
			var str = $(this).val();
			var mx = parseInt($(this).attr("maxlength"));
			if (str.length > mx) {
				$(this).val(str.substr(0, mx));
				return false;
			}
		});
	});

	function get_write_token(bo_table)
	{
		var token = "";

		$.ajax({
			type: "POST",
			url: g5_bbs_url+"/write_token.php",
			data: { bo_table: bo_table },
			cache: false,
			async: false,
		    timeout: 3000, // sets timeout to 3 seconds
			dataType: "json",
			success: function(data) {
				if(data.error) {
					alert(data.error);
					if(data.url)
						document.location.href = data.url;

					return false;
				}

				token = data.token;
			}
		});

		return token;
	}

	function set_write_token(f)
	{
			var bo_table = f.bo_table.value;
			var token = get_write_token(bo_table);

			if(token) {

				var $f = $(f);

				if(typeof f.token === "undefined")
					$f.prepend('<input type="hidden" name="token" value="">');

				$f.find("input[name=token]").val(token);
			}
	}

	$(function() {
		$(document).on("click", "form[name=fwrite] input:submit, form[name=fwrite] button:submit, form[name=fwrite] input:image", function() {
			var f = this.form;

			if (typeof(f.bo_table) == "undefined") {
				window.__g5_showloading_message = "자료 변환및 저장중입니다";
				return;
			}

			var bo_table = f.bo_table.value;
			var token = get_write_token(bo_table);

			if(!token) {
				alert(aslang[41]); //토큰 정보가 올바르지 않습니다.
				return false;
			}

			var $f = $(f);

			if(typeof f.token === "undefined")
				$f.prepend('<input type="hidden" name="token" value="">');

			$f.find("input[name=token]").val(token);
			window.__g5_showloading_message = "자료 변환및 저장중입니다";

			return true;
		});
	});

	function showloading(message) {
		var loadingMessage = message || window.__g5_showloading_message || '';
		if ($('#dvLoadingWrapper').length==0) {
			$('body').append('<div id="dvLoadingWrapper"><div id="dvLoading"></div><div id="dvLoadingText"></div></div>');
		}

		$('#dvLoadingWrapper').css({
			'position': 'fixed',
			'left': '0',
			'top': '0',
			'width': '100%',
			'height': '100%',
			'z-index': '9999',
			'background': 'rgba(0, 0, 0, 0.75)',
			'display': 'flex',
			'flex-direction': 'column',
			'align-items': 'center',
			'justify-content': 'center'
		});
		$('#dvLoading').css({
			'display': 'block',
			'position': 'static',
			'left': 'auto',
			'top': 'auto',
			'margin': '0 auto',
			'z-index': '10000'
		});
		$('#dvLoadingText').css({
			'display': loadingMessage ? 'block' : 'none',
			'position': 'static',
			'z-index': '10001',
			'transform': 'none',
			'margin': '12px auto 0',
			'padding': '10px 16px',
			'background': 'rgba(0, 0, 0, 0.78)',
			'color': '#fff',
			'font-size': '14px',
			'line-height': '1.4',
			'border-radius': '6px',
			'white-space': 'nowrap',
			'text-align': 'center'
		}).text(loadingMessage);

		$('#dvLoadingWrapper').fadeIn(300);
		$('#dvLoading').fadeIn(300);
		if (loadingMessage) {
			$('#dvLoadingText').fadeIn(300);
		}
	}

	function showloading_elm(objelem,elemname) {

		var leftPos  = $(objelem)[0].getBoundingClientRect().left   + $(window)['scrollLeft']();
		var rightPos = $(objelem)[0].getBoundingClientRect().right  + $(window)['scrollLeft']();
		var topPos   = $(objelem)[0].getBoundingClientRect().top    + $(window)['scrollTop']();
		var bottomPos= $(objelem)[0].getBoundingClientRect().bottom + $(window)['scrollTop']();

		if ($('#dvLoadingWrapper_elem_'+elemname).length==0) {
			$('body').append('<div id="dvLoadingWrapper_elem_'+elemname+'" class="dvLoadingWrapper_elem"><div id="dvLoading_elem'+elemname+'" class="dvLoading_elem"></div></div>');
		}

		$('#dvLoadingWrapper_elem_'+elemname).css('top',topPos+'px');
		$('#dvLoadingWrapper_elem_'+elemname).css('left',leftPos+'px');
		$('#dvLoadingWrapper_elem_'+elemname).css('height',(bottomPos-topPos)+'px');
		$('#dvLoadingWrapper_elem_'+elemname).css('width',(rightPos-leftPos)+'px');

		$('#dvLoadingWrapper_elem_'+elemname).fadeIn(300);
		$('#dvLoading_elem'+elemname).fadeIn(300);

	}

	function hideloading() {
		if ($('#dvLoadingWrapper').length>0) {
			$('#dvLoadingWrapper').fadeOut(300);
			$('#dvLoading').fadeOut(300);
			$('#dvLoadingText').fadeOut(300);
		}
		window.__g5_showloading_message = '';
	}

	$(window).on('pageshow', function() {
		hideloading();
	});

	// ==========================================================
	// 댓글/게시글 신고 (커스텀)
	// - ajax/ajax_reply_singo.php 호출
	// ==========================================================
	function ajax_reply_singo(bo_table, wr_id, mb_id, type) {
		if (typeof bo_table === 'undefined' || typeof wr_id === 'undefined') return false;
		if (typeof mb_id === 'undefined') mb_id = '';
		if (typeof type === 'undefined' || !type) type = 'c';

		swal.fire({
			title: "",
			text: "해당 글을 신고처리하시겠습니까?",
			icon: "info",
			showCancelButton: true,
			confirmButtonText: "예",
			cancelButtonText: "아니오",
			closeOnConfirm: false
		}).then((result) => {
			if (result.isConfirmed) {
				showloading();
				$.ajax({
					url:'/ajax/ajax_reply_singo.php',
					type: 'POST',
					data: 'bo_table='+bo_table+'&wr_id='+wr_id+'&mb_id='+encodeURIComponent(mb_id)+'&type='+encodeURIComponent(type),
					cache:false,
					dataType: "json",
					timeout: 1000 * 5,
					success:  function(result){
						hideloading();
						try {
							if (typeof Swal !== 'undefined' && typeof Swal.close === 'function') Swal.close();
							else if (typeof swal !== 'undefined' && typeof swal.close === 'function') swal.close();
							else if (typeof swal !== 'undefined' && typeof swal.closeModal === 'function') swal.closeModal();
						} catch(e) {}

						if (result && typeof result.success !== 'undefined' && typeof result.msg !== 'undefined') {
							var alertType = result.success ? 'success' : 'error';
							salert(alertType, '', result.msg);

							if (result.success && type === 'c') {
								// 성공 시 댓글 요소 제거
								$("#c_"+wr_id).remove();
								$("#edit_"+wr_id).remove();
								$("#reply_"+wr_id).remove();
								$("#secret_comment_"+wr_id).remove();
								$("#save_comment_"+wr_id).remove();
							}
						} else {
							salert('error', '', '오류가 발생하여 처리하지 못했습니다');
						}
						return false;
					},
					error: function(xhr, status, error){
						hideloading();
						try {
							if (typeof Swal !== 'undefined' && typeof Swal.close === 'function') Swal.close();
							else if (typeof swal !== 'undefined' && typeof swal.close === 'function') swal.close();
							else if (typeof swal !== 'undefined' && typeof swal.closeModal === 'function') swal.closeModal();
						} catch(e) {}

						// JSON 파싱 에러인 경우 응답 텍스트 확인
						try {
							var response = xhr.responseText;
							if (response) {
								var parsed = JSON.parse(response);
								if (parsed && typeof parsed.success !== 'undefined' && typeof parsed.msg !== 'undefined') {
									var alertType = parsed.success ? 'success' : 'error';
									salert(alertType, '', parsed.msg);
									return false;
								}
							}
						} catch(e) {
							// JSON 파싱 실패 시 기본 에러 메시지
						}
						salert('error', '', '오류가 발생하여 처리하지 못했습니다');
						return false;
					}
				});
				return false;
			}
		});

		return false;
	}

	function hideloading_elm(elemname) {
		if ($('#dvLoadingWrapper_elem_'+elemname).length>0) {
			$('#dvLoadingWrapper_elem_'+elemname).fadeOut(300);
			$('#dvLoading_elem'+elemname).fadeOut(300);
		}
	}

	var document_ready=false;

	$( document ).ready(function() {
		document_ready=true;
		console.log('common.js loaded');

		// 월말 카운트다운(명예의 전당 타이틀 등)
		if (typeof window.upsoInitMonthCountdown === 'function') {
			window.upsoInitMonthCountdown(document);
		}
	});

	// ==========================================================
	// 월말 카운트다운 공통 (1초마다 갱신)
	// - data-upso-end: 월말 종료 epoch seconds
	// - data-upso-now: 서버 현재 epoch seconds(오프셋 보정용)
	// ==========================================================
	if (typeof window.upsoInitMonthCountdown !== 'function') {
		window.upsoInitMonthCountdown = (function () {
			function formatRemaining(ms) {
				if (!isFinite(ms) || ms <= 0) return '';
				var totalSec = Math.ceil(ms / 1000);
				var days = Math.floor(totalSec / 86400);
				var hours = Math.floor((totalSec % 86400) / 3600);
				var mins = Math.floor((totalSec % 3600) / 60);
				var secs = totalSec % 60;
				var parts = [];
				if (days > 0) parts.push(days + ' 일');
				if (hours > 0) parts.push(hours + ' 시간');
				if (mins > 0) parts.push(mins + ' 분');
				parts.push(secs + ' 초');
				return parts.length ? '(' + parts.join(' ') + ' 남음)' : '';
			}

			function initOne(el) {
				if (!el || el.getAttribute('data-upso-init') === '1') return;
				var endSec = parseInt(el.getAttribute('data-upso-end') || '0', 10);
				var nowSec = parseInt(el.getAttribute('data-upso-now') || '0', 10);
				if (!endSec || !nowSec) return;

				var endMs = endSec * 1000;
				var serverNowMs = nowSec * 1000;
				var offsetMs = serverNowMs - Date.now();

				function tick() {
					var ms = endMs - (Date.now() + offsetMs);
					var txt = formatRemaining(ms);
					if (!txt) {
						el.style.display = 'none';
						clearInterval(timer);
						return;
					}
					el.style.display = '';
					el.textContent = txt;
				}

				el.setAttribute('data-upso-init', '1');
				tick();
				var timer = setInterval(tick, 1000);
			}

			function init(root) {
				var scope = root && root.querySelectorAll ? root : document;
				var els = scope.querySelectorAll('.upso_month_countdown[data-upso-end][data-upso-now]');
				for (var i = 0; i < els.length; i++) initOne(els[i]);
			}

			return init;
		})();
	}

	var swalwork=false;
	var swalTimer=0;

	function salert(dialogType,title,msgs,pageUrl,executeJavascript) {

		var curTimer=new Date().getTime();

		if (curTimer-swalTimer>=1000) swalwork=false;

		if (swalwork) return false;

		swalwork=true;
		swalTimer=new Date().getTime();

		if (document_ready==false)
			$( document ).ready(function() {
				document_ready=true;
				if (typeof(dialogType)=='undefined') dialogType='success'

				if (typeof(pageUrl)=='undefined' && typeof(executeJavascript)=='undefined')
					Swal.fire({
					  title: title,
					  text: msgs,
					  icon: dialogType,
					  timer: 5000,
					  });
				else
					swal.fire({
						  title:title,
						  text:msgs,
						  timer:5000,
						  icon:dialogType
						 }).then(
							 function() {
								if (typeof(executeJavascript)!='undefined' && executeJavascript!='')
									 eval(executeJavascript);

								if (typeof(pageUrl)!='undefined' && pageUrl!='')
									document.location.href=pageUrl;

								swalwork=false;
						});
			});
		else {
			if (typeof(dialogType)=='undefined')
				dialogType='success';
			else {
				dialogType=dialogType.toLowerCase();
				if (dialogType=='err' || dialogType=='e') dialogType='error';
				if (dialogType=='alert' || dialogType=='a' || dialogType=='warning' || dialogType=='warn' || dialogType=='w') dialogType='warning';
			}

			if (typeof(pageUrl)=='undefined' && typeof(executeJavascript)=='undefined')
				swal.fire({title:title,
					  text:msgs,
					  timer:5000,
					  icon:dialogType
					}).then(function() {
					}, function (dismiss) {
						swalwork=false;
					});
			else
				swal.fire({
					  title:title,
					  text:msgs,
					  timer:5000,
					  icon:dialogType
					 }).then( function() {
						if (typeof(executeJavascript)!='undefined' && executeJavascript!='')
							 eval(executeJavascript);

						if (typeof(pageUrl)!='undefined' && pageUrl!='')
							document.location.href=pageUrl;
						swalwork=false;
					 },function(dismiss) {
						if (typeof(executeJavascript)!='undefined' && executeJavascript!='')
							 eval(executeJavascript);

						if (typeof(pageUrl)!='undefined' && pageUrl!='')
							document.location.href=pageUrl;
						swalwork=false;
					})
		}
	}

	function openPageLogPc(url,mb_id,bo_table,type,shop_id,wr_id) {

		if (url==undefined) {
			console.log('no url : ' + url);
			return false;
		}

		if (url=='LOGINFIRST') {
			loginfirst();
			return false;
		}

		if (mb_id==undefined) mb_id='';
		if (type==undefined) type='';
		if (bo_table==undefined) bo_table='';
		if (shop_id==undefined) shop_id='';
		if (wr_id==undefined) wr_id='';

		if (mb_id=='' && type=='' && bo_table=='' && shop_id=='' && wr_id=='') {
			openPopUp(url);
			return false;
		}

		postdata="mb_id="+mb_id+"&bo_table="+bo_table+"&type="+type+"&shop_id="+shop_id+"&wr_id="+wr_id;

		showloading();

		$.ajax({
			url: "/ajax/pagelog.php",
			type: "POST",
			dataType: "json",
			data: postdata,
			async: false,
			cache: false,
		    timeout: 3000, // sets timeout to 3 seconds
			success: function(data, textStatus) {
				console.log("log created");
			},
			complete: function () {
				hideloading();
				openPopUp(url);
			}
		});
	}

	function openPageLogMobile(url,mb_id,bo_table,type,shop_id,wr_id) {

		if (url==undefined) {
			console.log('no url : ' + url);
			return false;
		}

		if (url=='LOGINFIRST') {
			loginfirst();
			return false;
		}

		if (mb_id==undefined) mb_id='';
		if (type==undefined) type='';
		if (bo_table==undefined) bo_table='';
		if (shop_id==undefined) shop_id='';
		if (wr_id==undefined) wr_id='';

		if (mb_id=='' && type=='' && bo_table=='' && shop_id=='' && wr_id=='') {
			window.open(url, 'newwindow'); 
			return false;
		}

		postdata="mb_id="+mb_id+"&bo_table="+bo_table+"&type="+type+"&shop_id="+shop_id+"&wr_id="+wr_id;
		
		showloading();

		$.ajax({
			url: "/ajax/pagelog.php",
			type: "POST",
			dataType: "json",
			data: postdata,
			async: false,
			cache: false,
		    timeout: 3000, // sets timeout to 3 seconds
			success: function(data, textStatus) {
				console.log("log created");
			},
			complete: function () {
				hideloading();
				window.open(url, 'newwindow'); 
			}
		});
	}

	function openPageMobile(url) {
		window.open(url, 'newwindow'); 
	}

	function opentelegramLogPc(telegramid,mb_id,bo_table,type,shop_id,wr_id) {

		if (telegramid==undefined) {
			console.log('no telegramid : ' + telegramid);
			return false;
		}

		if (mb_id==undefined) mb_id='';
		if (type==undefined) type='';
		if (bo_table==undefined) bo_table='';
		if (shop_id==undefined) shop_id='';
		if (wr_id==undefined) wr_id='';

		if (mb_id=='' && type=='' && bo_table=='' && shop_id=='' && wr_id=='') {
			window.open('https://t.me/'+telegramid, 'telegramwindow');
			return false;
		}

		postdata="mb_id="+mb_id+"&bo_table="+bo_table+"&type="+type+"&shop_id="+shop_id+"&wr_id="+wr_id;

		showloading();

		$.ajax({
			url: "/ajax/pagelog.php",
			type: "POST",
			dataType: "json",
			data: postdata,
			async: false,
			cache: false,
		    timeout: 3000, // sets timeout to 3 seconds
			success: function(data, textStatus) {
				console.log("log created");
			},
			complete: function () {
				hideloading();
				window.open('https://t.me/'+telegramid, 'telegramwindow');
			}
		});
	}

	function opentelegramLogMobile(telegramid,mb_id,bo_table,type,shop_id,wr_id) {

		if (telegramid==undefined) {
			console.log('no telegramid : ' + telegramid);
			return false;
		}

		if (mb_id==undefined) mb_id='';
		if (type==undefined) type='';
		if (bo_table==undefined) bo_table='';
		if (shop_id==undefined) shop_id='';
		if (wr_id==undefined) wr_id='';

		if (mb_id=='' && type=='' && bo_table=='' && shop_id=='' && wr_id=='') {
			window.open('https://t.me/'+telegramid, 'telegramwindow');
			return false;
		}

		postdata="mb_id="+mb_id+"&bo_table="+bo_table+"&type="+type+"&shop_id="+shop_id+"&wr_id="+wr_id;

		showloading();

		$.ajax({
			url: "/ajax/pagelog.php",
			type: "POST",
			dataType: "json",
			data: postdata,
			async: false,
			cache: false,
		    timeout: 3000, // sets timeout to 3 seconds
			success: function(data, textStatus) {
				console.log("log created");
			},
			complete: function () {
				hideloading();
				window.open('https://t.me/'+telegramid, 'telegramwindow');
			}
		});
	}

	function openkakaoLogMobile(kakaoid,mb_id,bo_table,type,shop_id,wr_id) {

		if (kakaoid==undefined) {
			console.log('no kakaoid : ' + kakaoid);
			return false;
		}

		if (mb_id==undefined) mb_id='';
		if (type==undefined) type='';
		if (bo_table==undefined) bo_table='';
		if (shop_id==undefined) shop_id='';
		if (wr_id==undefined) wr_id='';

		if (mb_id=='' && type=='' && bo_table=='' && shop_id=='' && wr_id=='') {
			CopyToClipboard(kakaoid);
			salert('info','','클립보드로 카카오톡 아이디가 복사돼었습니다, 카카오톡이 실행되면 친구추가에 붙여넣기해주시면 됩니다','','','openkakao("'+kakaoid+'")');

			return false;
		}

		postdata="mb_id="+mb_id+"&bo_table="+bo_table+"&type="+type+"&shop_id="+shop_id+"&wr_id="+wr_id;

		showloading();

		$.ajax({
			url: "/ajax/pagelog.php",
			type: "POST",
			dataType: "json",
			data: postdata,
			async: false,
			cache: false,
		    timeout: 3000, // sets timeout to 3 seconds
			success: function(data, textStatus) {
				console.log("log created");
			},
			complete: function () {
				hideloading();
				CopyToClipboard(kakaoid);
				salert('info','','클립보드로 카카오톡 아이디가 복사돼었습니다, 카카오톡이 실행되면 친구추가에 붙여넣기해주시면 됩니다','','','openkakao("'+kakaoid+'")');
			}
		});
	}

	function openkakaoLogPc(kakaoid,mb_id,bo_table,type,shop_id,wr_id) {

		if (kakaoid==undefined) {
			console.log('no kakaoid : ' + kakaoid);
			return false;
		}

		if (mb_id==undefined) mb_id='';
		if (type==undefined) type='';
		if (bo_table==undefined) bo_table='';
		if (shop_id==undefined) shop_id='';
		if (wr_id==undefined) wr_id='';

		if (mb_id=='' && type=='' && bo_table=='' && shop_id=='' && wr_id=='') {
			CopyToClipboard(kakaoid);
			salert('info','','클립보드로 카카오톡 아이디가 복사돼었습니다, 카카오톡이 실행되면 친구추가에 붙여넣기해주시면 됩니다','','','openkakao("'+kakaoid+'")');
			return false;
		}

		postdata="mb_id="+mb_id+"&bo_table="+bo_table+"&type="+type+"&shop_id="+shop_id+"&wr_id="+wr_id;

		showloading();

		$.ajax({
			url: "/ajax/pagelog.php",
			type: "POST",
			dataType: "json",
			data: postdata,
			async: false,
			cache: false,
		    timeout: 3000, // sets timeout to 3 seconds
			success: function(data, textStatus) {
				console.log("log created");
			},
			complete: function () {
				hideloading();
				CopyToClipboard(kakaoid);
				salert('info','','클립보드로 카카오톡 아이디가 복사돼었습니다, 카카오톡이 실행되면 친구추가에 붙여넣기해주시면 됩니다','','','openkakao("'+kakaoid+'")');
			}
		});
	}

	function openkakao(kid) {
		try	{
			document.location.href="kakaotalk://launch";
		}
		catch (ex) {
			salert('error','','오류로인해 카카오톡이 실행할수 없습니다, 카카오톡을 실행후 친구추가에 복사된 아이디를 붙여넣기해주세요');
		}
	}

	function openCallLogMobile(tel,mb_id,bo_table,type,shop_id,wr_id) {

		if (tel==undefined) {
			console.log('no tel : ' + tel);
			return false;
		}

		if (mb_id==undefined) mb_id='';
		if (type==undefined) type='';
		if (bo_table==undefined) bo_table='';
		if (shop_id==undefined) shop_id='';
		if (wr_id==undefined) wr_id='';

		if (mb_id=='' && type=='' && bo_table=='' && shop_id=='' && wr_id=='') {
			try {
				document.location.href='tel:'+tel;
			} catch (ex) {
				console.log('launch failed : ' + ex);
			}

			return false;
		}

		postdata="mb_id="+mb_id+"&bo_table="+bo_table+"&type="+type+"&shop_id="+shop_id+"&wr_id="+wr_id;

		showloading();

		$.ajax({
			url: "/ajax/pagelog.php",
			type: "POST",
			dataType: "json",
			data: postdata,
			async: false,
			cache: false,
		    timeout: 3000, // sets timeout to 3 seconds
			success: function(data, textStatus) {
				console.log("log created");
			},
			complete: function () {
				hideloading();
				try {
					document.location.href='tel:'+tel;
				} catch (ex) {
					console.log('launch failed : ' + ex);
				}
			}
		});
	}

	function CopyToClipboard(text){
		var dummy   = document.createElement("input");
		
		document.body.appendChild(dummy);
		dummy.value = text;
		dummy.select();
		document.execCommand("copy");
		document.body.removeChild(dummy);
	}

	function thumbnail_img_error(_this, shoptype){
		_this.src='/images/upjong/noimg_'+shoptype+'.jpg';
	}

	function openPopUp(url) {
	  $.fancybox({
		'width'				: 800,
		'height'			: '99%',
		'autoScale'			: false,
		'overlayOpacity'	: 0.8, // Set opacity to 0.8
		'overlayColor'		: "#000000", // Set color to Black
		'transitionIn'		: 'none',
		'transitionOut'		: 'none',
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

	function lenh(msg) {
		var nbytes = 0;
		for (tmp_i=0; tmp_i<msg.length; tmp_i++) {
			var ch = msg.charAt(tmp_i);
			if(escape(ch).length > 4) {
				nbytes += 2;
			} else if (ch == '\n') {
				if (msg.charAt(tmp_i-1) != '\r') {
					nbytes += 1;
				}
			} else if (ch == '<' || ch == '>') {
				nbytes += 4;
			} else {
				nbytes += 1;
			}
		}
		return nbytes;
	}

	function lefth(str,len) {
		var s = 0;
		for (var tmp_i=0; tmp_i<str.length; tmp_i++) {
			s += (str.charCodeAt(tmp_i) > 128) ? 2 : 1;
			if (s > len) return str.substring(0,tmp_i) + "...";
		} 
		return str;
	}

	function loginfirst() {
		salert('info','','로그인후 이용할수 있습니다','','open_modal_login()');
		///javascript:alert('로그인후 이용하실수 있습니다.');
		//location.href='/bbs/login.php';
		return false;
	}

	function error_low_level_limit() {
		salert('info','','현재 레벨에서는 접근하실 수 없습니다, 관리자에게 문의해주세요');
		return false;
	}

	// 게시판 읽기 레벨 체크 함수
	// userLevel: 현재 사용자 레벨 (0: 비회원, 1이상: 회원 레벨)
	// readLevel: 게시판 읽기 필요 레벨
	// href: 링크 주소
	// return: 조건에 따라 링크 또는 에러 함수 호출
	function checkReadLevel(userLevel, readLevel, href) {
		// 읽기 레벨이 사용자 레벨보다 높으면
		if (readLevel > userLevel) {
			// 로그인하지 않은 사용자 (비회원)
			if (userLevel === 0) {
				return 'javascript:loginfirst();';
			}
			// 로그인한 사용자이지만 레벨 부족
			else {
				return 'javascript:error_low_level_limit();';
			}
		}
		// 레벨이 충분하면 원래 링크 반환
		return href;
	}

	// 쿠키 설정 함수 (1일짜리)
	function setCookie(name, value) {
		var date = new Date();
		date.setTime(date.getTime() + (1 * 24 * 60 * 60 * 1000)); // 1일 후 만료
		var expires = "expires=" + date.toUTCString();
		document.cookie = name + "=" + value + ";" + expires + ";path=/";
	}

	// 쿠키 가져오기 함수
	function getCookie(name) {
		var nameEQ = name + "=";
		var cookiesArray = document.cookie.split(';');
		for (var i = 0; i < cookiesArray.length; i++) {
			var cookie = cookiesArray[i].trim();
			if (cookie.indexOf(nameEQ) === 0) {
				return cookie.substring(nameEQ.length, cookie.length);
			}
		}
		return null;
	}

	function updateQueryString(key, value) {
		// 사용 예시:
		// 현재 URL이 https://example.com/page?param1=value1 이라고 가정합니다.

		// 'utm_source' 쿼리스트링이 있으면 값을 'new_source'로 변경합니다.
		//updateQueryString('utm_source', 'new_source');
		// 결과: https://example.com/page?param1=value1&utm_source=new_source

		// 'param1' 쿼리스트링이 이미 존재하므로, 값을 'new_value'로 변경합니다.
		//updateQueryString('param1', 'new_value');
		// 결과: https://example.com/page?param1=new_value&utm_source=new_source

		// 현재 URL 객체를 생성합니다.
		const url = new URL(window.location.href);

		// URLSearchParams 객체를 가져옵니다.
		const params = url.searchParams;

		// 쿼리 매개변수 key의 값을 설정합니다.
		// key가 이미 존재하면 값을 변경하고, 없으면 새로 추가합니다.
		params.set(key, value);

	  return url.toString()
	}


	function no_shop_review() {
		salert('info','','이 업소의 후기자료가 아직 없습니다');
	}

	/** fancybox iframe 등에서 호출 시 부모(메인) 창에서 이동 */
	function g5OpenReviewWriteInTopWindow(url) {
		try {
			if (window.top && window.top !== window) {
				window.top.location.href = url;
				return;
			}
		} catch (e) {}
		window.location.href = url;
	}
	window.g5OpenReviewWriteInTopWindow = g5OpenReviewWriteInTopWindow;

	/** 메인 리스트·팝업: 후기 글쓰기 이동 전 SweetAlert 확인 (예/아니오) */
	function g5ConfirmReviewWrite(writeUrl, customText) {
		var text = (typeof customText === 'string' && customText) ? customText : '이 업소의 후기가 없습니다, 최초 후기를 작성하시겠습니까?';
		if (typeof Swal !== 'undefined' && Swal.fire) {
			Swal.fire({
				icon: 'info',
				text: text,
				showCancelButton: true,
				confirmButtonText: '예',
				cancelButtonText: '아니오'
			}).then(function (result) {
				if (result.isConfirmed) {
					g5OpenReviewWriteInTopWindow(writeUrl);
				}
			});
		} else if (window.confirm(text)) {
			g5OpenReviewWriteInTopWindow(writeUrl);
		}
	}
	window.g5ConfirmReviewWrite = g5ConfirmReviewWrite;

	// 지역 선택 3~4단계 모달 (IC_ADDR2 공백 유무에 따라 분기)
	function openRegionSelector(onSelected) {
		var overlayId = 'region_modal_overlay';
		var modalId = 'region_modal_box';
		var $overlay = $('#'+overlayId);
		if ($overlay.length==0) {
			$overlay = $('<div/>').attr('id', overlayId).addClass('modal_overlay');
			$('body').append($overlay);
		}
		var $modal = $('#'+modalId);
		if ($modal.length==0) {
			$modal = $('<div/>').attr('id', modalId).addClass('area_wrap gnb_sub_menu').css({
				position:'fixed', left:'50%', top:'50%', transform:'translate(-50%, -50%)',
				width:'300px', maxWidth:'300px', minWidth:'300px',
				maxHeight:'70vh', overflowY:'auto', zIndex:5, display:'none'
			});
			$modal.append('<div class="area_tit"><span class="tit_text"><i class="fa fa-map-marker" aria-hidden="true"></i> <span id="region_modal_title">지역선택</span></span></div>');
			$modal.append('<div class="region_back_button" id="region_modal_back" style="display:none; padding:10px 15px; border-bottom:1px solid rgba(255,255,255,0.1); margin-bottom:10px;"><a href="#" style="display:flex; align-items:center; color:#fff; text-decoration:none; font-size:14px;"><i class="fa fa-arrow-left" style="margin-right:8px;"></i><span id="region_back_text">이전</span></a></div>');
			$modal.append('<div class="area_cont"><div class="region_category_level" id="region_modal_list" style="padding:10px;"></div></div>');
			$modal.append('<button type="button" class="btn_close" id="region_modal_close"><i class="fa fa-times" aria-hidden="true"></i></button>');
			$('body').append($modal);
		}

		function positionRegionModal() {
			var $trigger = $('#nav_shoparea');
			var isMobile = window.innerWidth <= 768;
			if ($trigger.length && !isMobile) {
				var off = $trigger.offset();
				var tH = $trigger.outerHeight();
				$modal.css({
					position: 'absolute',
					left: off.left,
					top: off.top + tH + 8,
					transform: 'none'
				});
			} else {
				$modal.css({
					position:'fixed', left:'50%', top:'50%', transform:'translate(-50%, -50%)'
				});
			}
		}

		function showOverlay(show) {
			if (show) {
				positionRegionModal();
				$overlay.addClass('show').fadeIn(120);
				$modal.css('display', 'block');
				setTimeout(function(){ $modal.css('opacity', '1'); }, 10);
				document.body.style.overflow = 'hidden';
			} else {
				$overlay.removeClass('show').fadeOut(120);
				$modal.css('opacity', '0');
				setTimeout(function(){ $modal.css('display', 'none'); }, 300);
				document.body.style.overflow = 'auto';
			}
		}

		// 윈도우 리사이즈 시 위치 재계산
		$(window).off('resize.regionModal').on('resize.regionModal', function(){
			if ($modal.is(':visible')) positionRegionModal();
		});

		$('#region_modal_close').off('click').on('click', function(){ showOverlay(false); });
		$overlay.off('click').on('click', function(){ showOverlay(false); });

		var selected = {
			addr1_label: '', addr1_value: '',
			addr2_1_label: '', addr2_1_value: '',
			addr2_2_label: '', addr2_2_value: '',
			addr3_label: '', addr3_value: '',
			addr4_label: '', addr4_value: ''
		};

					var history = [];
					var currentLevel = 1;

					function render(level, addr1, addr2_1, addr2_2, addr3) {
						currentLevel = level;
						var params = { level: level };
						if (addr1) params.addr1 = addr1;
						if (addr2_1) params.addr2_1 = addr2_1;
						if (addr2_2) params.addr2_2 = addr2_2;
						if (addr3) params.addr3 = addr3;

						// 이전 버튼 표시/숨김
						if (level > 1) {
							$('#region_modal_back').show();
							var backLabel = '';
							if (level === 2) backLabel = selected.addr1_label;
							else if (level === 3) {
								if (selected.addr2_2_label) backLabel = selected.addr1_label + ' ' + selected.addr2_1_label;
								else backLabel = selected.addr1_label + ' ' + selected.addr2_1_label;
							}
							else if (level === 4) {
								if (selected.addr2_2_label) backLabel = selected.addr1_label + ' ' + selected.addr2_1_label + ' ' + selected.addr2_2_label;
								else backLabel = selected.addr1_label + ' ' + selected.addr2_1_label + ' ' + selected.addr3_label;
							}
							$('#region_back_text').text(backLabel);
						} else {
							$('#region_modal_back').hide();
						}

			$.getJSON('/ajax/get_area_data.php', params, function(resp){
				$('#region_modal_title').text(resp && resp.title ? resp.title : '지역선택');
				var $list = $('#region_modal_list');
				$list.empty();
				if (!resp || !resp.items) return;

				// 1단계 첫 항목: 전체 지역 빠른 선택 버튼
				if (level === 1) {
					var $firstItem = $('<div class="region_category_item"/>');
					var $firstLink = $('<a href="#" class="region_item_link"/>');
					$firstLink.append('<i class="fa fa-map region_item_icon"/>');
					var $firstLabel = $('<span class="region_item_label"/>');
					$firstLabel.append('<span class="region_item_name">전체 지역</span>');
					$firstLink.append($firstLabel);
					$firstLink.on('click', function(e){
						e.preventDefault();
						e.stopPropagation();
						showOverlay(false);
						var result = { addr1: '', addr2: '', psearch: '' };
						if (typeof onSelected === 'function') onSelected(result);
						return false;
					});
					$firstItem.append($firstLink);
					$list.append($firstItem);
				}
				$.each(resp.items, function(_, it){
					var $item = $('<div class="region_category_item"/>');
					var $a = $('<a href="#" class="region_item_link"/>');
					
					// 아이콘 선택 (레벨에 따라)
					var iconClass = '';
					if (it.value === 'ALL') {
						// 전체 항목: 돋보기 아이콘
						iconClass = 'fa fa-search';
					} else {
						if (level === 1) {
							// 1단계: 시/도 -> bookmark 아이콘
							iconClass = 'fa fa-bookmark';
						} else if (level === 2) {
							// 2단계: 구/시/군 -> 지역 마커 아이콘
							iconClass = 'fa fa-map-marker';
						} else if (level === 3) {
							// 3단계: 구(공백 있는 경우) 또는 동/면/리
							if (resp.has_space) {
								// 구
								iconClass = 'fa fa-map-marker';
							} else {
								// 동/면/리
								iconClass = 'fa fa-map-pin';
							}
						} else if (level === 4) {
							// 4단계: 동/면/리 -> 작은 위치 아이콘
							iconClass = 'fa fa-map-pin';
						}
					}
					
					// 아이콘 추가 (모든 항목에 아이콘 표시)
					if (iconClass) {
						$a.append('<i class="' + iconClass + ' region_item_icon"/>');
					}
					
					// 지역명 표시 영역 (안에 지역명과 전체 버튼 포함)
					var $label = $('<span class="region_item_label"/>');
					$label.append('<span class="region_item_name">' + it.label + '</span>');
					$a.append($label);
					
					// 전체를 제외한 항목이고, 마지막 단계가 아닌 경우에만 "전체" 버튼 추가
					var isLastLevel = false;
					if (level === 4) {
						isLastLevel = true;
					} else if (level === 3 && !resp.has_space) {
						isLastLevel = true;
					}
					
					if (it.value !== 'ALL' && !isLastLevel) {
						var $allBtn = $('<span class="region_item_all_btn" title="전체 선택"/>').text('전체');
						$allBtn.on('click', function(e){
							e.preventDefault();
							e.stopPropagation();
							
							// 해당 레벨에서 전체 선택 처리
							var result = {
								addr1: '',
								addr2: '',
								psearch: ''
							};
							
							if (level === 1) {
								result.addr1 = it.value;
							} else if (level === 2) {
								result.addr1 = selected.addr1_value;
								result.addr2 = it.value;
							} else if (level === 3) {
								result.addr1 = selected.addr1_value;
								if (selected.addr2_1_value) {
									result.addr2 = selected.addr2_1_value;
									if (resp.has_space) {
										result.addr2 += ' ' + it.value;
									}
								}
							}
							
							showOverlay(false);
							if (typeof onSelected === 'function') onSelected(result);
							return false;
						});
						$label.append($allBtn);
					}
					
					// 화살표 앞 공간 확보용 스페이서 추가
					if (it.value !== 'ALL' && !isLastLevel) {
						$a.append('<span class="region_item_spacer"/>');
					} else if (it.value === 'ALL') {
						$a.append('<span class="region_item_spacer"/>');
					}
					
					// 화살표 표시 (다음 단계로 이동 가능한 경우)
					if (it.value !== 'ALL' && !isLastLevel) {
						var showArrow = false;
						if (level === 1) {
							showArrow = true;
						} else if (level === 2) {
							showArrow = true;
						} else if (level === 3) {
							showArrow = (resp.has_space === true);
						}
						if (showArrow) {
							$a.append('<i class="fa fa-chevron-right region_item_arrow"/>');
						}
					}
					$a.on('click', function(e){
						e.preventDefault();
						e.stopPropagation();
						if (it.value==='ALL') {
							// 전체 선택: 모달 닫고 결과 반환
							showOverlay(false);
							var result = {
								addr1: selected.addr1_value,
								addr2: '',
								psearch: ''
							};
							if (level >= 2 && selected.addr2_1_value) {
								result.addr2 = selected.addr2_1_value;
								if (selected.addr2_2_value) result.addr2 += ' ' + selected.addr2_2_value;
							}
							if (level >= 3 && selected.addr3_value) result.psearch = selected.addr3_value;
							if (level >= 4 && selected.addr4_value) result.psearch = selected.addr4_value;
							if (typeof onSelected === 'function') onSelected(result);
							return;
						}

						if (level === 1) {
							if (it.value === 'ALL') {
								showOverlay(false);
								if (typeof onSelected === 'function') onSelected({addr1:'ALL', addr2:'', psearch:''});
								return;
							}
							selected.addr1_label = it.label;
							selected.addr1_value = it.value;
							// 현재 상태를 history에 저장 (1단계 완료 상태)
							history.push({ 
								level: 1,
								addr1: it.value,
								addr2_1: '',
								addr2_2: '',
								addr3: '',
								selected: JSON.parse(JSON.stringify(selected))
							});
							render(2, it.value, '', '', '');
						} else if (level === 2) {
							selected.addr2_1_label = it.label;
							selected.addr2_1_value = it.value;
							var hasSpace = it.has_space || false;
							// 현재 상태를 history에 저장 (2단계 완료 상태)
							history.push({ 
								level: 2,
								addr1: selected.addr1_value,
								addr2_1: it.value,
								addr2_2: '',
								addr3: '',
								selected: JSON.parse(JSON.stringify(selected))
							});
							if (hasSpace) {
								// 공백 있음: 3단계에 IC_ADDR2 뒷부분 표시
								render(3, selected.addr1_value, it.value, '', '');
							} else {
								// 공백 없음: 3단계에 IC_ADDR3 표시
								render(3, selected.addr1_value, it.value, '', '');
							}
						} else if (level === 3) {
							if (resp.has_space) {
								// 공백 있음: IC_ADDR2 뒷부분 선택 → 4단계로 IC_ADDR3 표시
								selected.addr2_2_label = it.label;
								selected.addr2_2_value = it.value;
								// 현재 상태를 history에 저장 (3단계 완료 상태)
								history.push({ 
									level: 3,
									addr1: selected.addr1_value,
									addr2_1: selected.addr2_1_value,
									addr2_2: it.value,
									addr3: '',
									selected: JSON.parse(JSON.stringify(selected))
								});
								render(4, selected.addr1_value, selected.addr2_1_value, it.value, '');
							} else {
								// 공백 없음: IC_ADDR3 선택 완료 → 결과 반환
								selected.addr3_label = it.label;
								selected.addr3_value = it.value;
								showOverlay(false);
								var result = {
									addr1: selected.addr1_value,
									addr2: selected.addr2_1_value,
									psearch: it.value
								};
								if (typeof onSelected === 'function') onSelected(result);
							}
						} else if (level === 4) {
							// 4단계: IC_ADDR3 선택 완료 → 결과 반환
							selected.addr4_label = it.label;
							selected.addr4_value = it.value;
							showOverlay(false);
							var result = {
								addr1: selected.addr1_value,
								addr2: selected.addr2_1_value + ' ' + selected.addr2_2_value,
								psearch: it.value
							};
							if (typeof onSelected === 'function') onSelected(result);
						}
					});
					$item.append($a);
					$list.append($item);
				});
			}).fail(function(){
				$('#region_modal_list').html("<div class='region_modal_list_nodata'>오류가 발생하여 자료를 가져오지 못했습니다</div>");
				console.error('지역 데이터 로드 실패');
			});
		}

				$('#region_modal_back a').off('click').on('click', function(e){
					e.preventDefault();
					
					// 현재 단계의 level 확인
					if (currentLevel === 1) {
						// 1단계에서는 뒤로 갈 곳이 없음
						return;
					}
					
					// history에서 이전 단계 찾기
					var targetLevel = currentLevel - 1;
					var targetHistory = null;
					
					// history의 마지막 항목부터 역순으로 검색
					for (var i = history.length - 1; i >= 0; i--) {
						if (history[i].level <= targetLevel) {
							targetHistory = history[i];
							// 이 이후의 항목들 제거 (현재 단계 이후 항목들)
							if (i < history.length - 1) {
								history = history.slice(0, i + 1);
							}
							break;
						}
					}
					
					if (!targetHistory) {
						// 찾지 못하면 초기 상태로
						selected = {
							addr1_label: '', addr1_value: '',
							addr2_1_label: '', addr2_1_value: '',
							addr2_2_label: '', addr2_2_value: '',
							addr3_label: '', addr3_value: '',
							addr4_label: '', addr4_value: ''
						};
						render(1, '', '', '', '');
						return;
					}
					
					// 이전 단계의 상태 복원
					selected = JSON.parse(JSON.stringify(targetHistory.selected));
					
					// 이전 단계에 맞는 렌더링
					if (targetHistory.level === 1) {
						render(1, '', '', '', '');
					} else if (targetHistory.level === 2) {
						render(2, targetHistory.addr1, targetHistory.addr2_1, '', '');
					} else if (targetHistory.level === 3) {
						// addr2_2가 있으면 공백이 있는 경우
						if (targetHistory.addr2_2) {
							render(3, targetHistory.addr1, targetHistory.addr2_1, targetHistory.addr2_2, '');
						} else {
							render(3, targetHistory.addr1, targetHistory.addr2_1, '', '');
						}
					}
				});

		showOverlay(true);
		history = [];
		render(1, '', '', '', '');
	}

	// 지역선택 모달 오픈 함수는 이미 위에 정의되어 있습니다.
	// 사용법: openRegionSelector(function(selected) { ... })
	// selected 객체: {addr1: '서울특별시', addr2: '강남구', psearch: '역삼동'}

	// 지역선택 오픈 + 선택 후 페이지 이동 (기존 호환성 유지)
	function openRegionAndNavigate() {
		if (typeof openRegionSelector !== 'function') return false;
		openRegionSelector(function(sel){
			// area: 1단계에서 선택한 항목 (IC_ADDR1)
			var area = (sel && sel.addr1 && sel.addr1 !== 'ALL') ? sel.addr1 : '';
			
			// area2: 2단계 이후 선택한 모든 항목들을 합침
			var area2Parts = [];
			if (sel && sel.addr2 && sel.addr2 !== '') {
				area2Parts.push(sel.addr2);
			}
			if (sel && sel.psearch && sel.psearch !== '') {
				area2Parts.push(sel.psearch);
			}
			var area2 = area2Parts.length > 0 ? area2Parts.join(' ') : '';

			var urlParams = new URLSearchParams(window.location.search);
			var type = urlParams.get('type') || '';

			var newUrl = window.location.pathname;
			var params = [];
			if (type) params.push('type=' + encodeURIComponent(type));
			if (area) params.push('area=' + encodeURIComponent(area));
			if (area2) params.push('area2=' + encodeURIComponent(area2));

			if (params.length > 0) newUrl += '?' + params.join('&');
			window.location.href = newUrl;
		});
		return false;
	}

	// 업종선택 모달 오픈 함수 (콜백 함수로 선택값 처리)
	// 사용법: openCategorySelector(function(selected) { ... })
	// selected 객체: {type: '오피'} 또는 {type: ''} (전체 선택 시)
	function openCategorySelector(onSelected) {
		if (typeof onSelected !== 'function') {
			console.warn('openCategorySelector: 콜백 함수가 필요합니다.');
			return false;
		}
		
		var cateMenu = document.getElementById('gnb_cate');
		var overlay = document.getElementById('modal_overlay');
		
		// 다른 페이지에서 모달 요소가 없을 수 있음 → 동적 생성
		if (!overlay) {
			overlay = document.createElement('div');
			overlay.id = 'modal_overlay';
			overlay.className = 'modal_overlay';
			document.body.appendChild(overlay);
		}
		if (!cateMenu) {
			cateMenu = document.createElement('div');
			cateMenu.id = 'gnb_cate';
			cateMenu.className = 'area_wrap gnb_sub_menu';
			cateMenu.style.display = 'none';
			// 타이틀
			cateMenu.innerHTML = ''+
			  '<div class="area_tit">'+
			  '  <span class="tit_text"><i class="fa fa-star" aria-hidden="true"></i> 업종선택</span>'+
			  '</div>'+
			  '<div class="area_cont">'+
			  '  <div class="category_grid" id="gnb_cate_dynamic_list"></div>'+
			  '</div>'+
			  '<button type="button" class="btn_close"><i class="fa fa-times" aria-hidden="true"></i></button>';
			document.body.appendChild(cateMenu);
			// 아이템 구성 (기본 셋)
			var items = [
				{label:'전체', icon:'fa fa-th', type:''},
				{label:'유흥주점', icon:'fa fa-glass', type:'유흥주점'},
				{label:'노래방', icon:'fa fa-microphone', type:'노래방'},
				{label:'북창', icon:'fa fa-beer', type:'북창'},
				{label:'출장마사지', icon:'fa fa-car', type:'출장마사지'},
				{label:'아로마', icon:'fa fa-tint', type:'아로마'},
				{label:'안마', icon:'fa fa-sign-language', type:'안마'},
				{label:'건마', icon:'fa fa-leaf', type:'건마'},
				{label:'립카페', icon:'fa fa-heart', type:'립카페'},
				{label:'휴게텔', icon:'fa fa-bed', type:'휴게텔'},
				{label:'핸플/키스방', icon:'fa fa-heart', type:'핸플,키스방'},
				{label:'스웨디시', icon:'fa fa-leaf', type:'스웨디시'},
				{label:'오피', icon:'fa fa-building', type:'오피'},
				{label:'나이트/바', icon:'fa fa-bolt', type:'나이트/바'},
				{label:'패티쉬', icon:'fa fa-eye', type:'패티쉬'},
				{label:'1인샵', icon:'fa fa-user', type:'1인샵'},
				{label:'트젠샵', icon:'fa fa-mars-double', type:'트젠샵'},
				{label:'기타업종', icon:'fa fa-ellipsis-h', type:'기타업종'}
			];
			var grid = cateMenu.querySelector('#gnb_cate_dynamic_list');
			if (grid) {
				grid.innerHTML = '';
				items.forEach(function(it){
					var item = document.createElement('div');
					item.className = 'category_item';
					var a = document.createElement('a');
					a.href = '#';
					a.setAttribute('data-type', it.type);
					a.innerHTML = '<i class="'+it.icon+'" aria-hidden="true"></i><span>'+it.label+'</span>';
					item.appendChild(a);
					grid.appendChild(item);
				});
			}
		}
		
		// 기존 닫기 핸들러 제거
		$('.btn_close', cateMenu).off('click.categorySelector');
		$(overlay).off('click.categorySelector');
		
		// 선택 핸들러 등록
		$('#gnb_cate .category_item a').off('click.categorySelector').on('click.categorySelector', function(e) {
			e.preventDefault();
			var $this = $(this);
			var selectedType = '';
			// data-type 우선 (동적 생성 케이스)
			var dataType = $this.attr('data-type');
			if (typeof dataType !== 'undefined') {
				selectedType = dataType || '';
			} else {
				// 기존 템플릿: href에서 type 파라미터 추출
				var href = $this.attr('href');
				if (href && href.indexOf('type=') !== -1) {
					var match = href.match(/type=([^&]*)/);
					if (match && match[1]) {
						selectedType = decodeURIComponent(match[1]);
					}
				}
			}
			
			// 모달 닫기
			closeGnbMenu();
			
			// 콜백 호출
			var result = {type: selectedType || ''};
			if (typeof onSelected === 'function') {
				onSelected(result);
			}
		});
		
		// 오버레이 클릭 시 모달 닫기
		$(overlay).on('click.categorySelector', function(e) {
			if (e.target === overlay) {
				closeGnbMenu();
			}
		});
		
		// 닫기 버튼 클릭 시 모달 닫기
		$('.btn_close', cateMenu).on('click.categorySelector', function() {
			closeGnbMenu();
		});
		
		function positionCategoryModal() {
			var $trigger = $('#nav_shoptype');
			var isMobile = window.innerWidth <= 768;
			if ($trigger.length && !isMobile) {
				var off = $trigger.offset();
				var tH = $trigger.outerHeight();
				$(cateMenu).css({
					position: 'absolute',
					left: off.left,
					top: off.top + tH + 8,
					transform: 'none',
					zIndex: 5
				});
			} else {
				$(cateMenu).css({
					position: 'fixed',
					left: '50%',
					top: '50%',
					transform: 'translate(-50%, -50%)',
					zIndex: 5
				});
			}
		}

		// 모달 열기
		if (window.getComputedStyle(cateMenu).display === 'none') {
			positionCategoryModal();
			overlay.style.setProperty('display', 'block');
			overlay.style.setProperty('opacity', '1');
			overlay.style.setProperty('visibility', 'visible');
			cateMenu.style.setProperty('display', 'block');
			
			setTimeout(function() {
				cateMenu.classList.add('show');
			}, 10);
			
			document.body.style.overflow = 'hidden';
		}

		// 리사이즈 시 위치 재계산
		$(window).off('resize.cateModal').on('resize.cateModal', function(){
			if ($(cateMenu).is(':visible')) positionCategoryModal();
		});
		
		return true;
	}
	
	// 업종선택 오픈 + 선택 후 페이지 이동
	function openCategoryAndNavigate() {
		openCategorySelector(function(sel) {
			var type = (sel && sel.type) ? sel.type : '';
			var urlParams = new URLSearchParams(window.location.search);
			var area = urlParams.get('area') || '';
			var area2 = urlParams.get('area2') || '';
			
			var newUrl = window.location.pathname;
			var params = [];
			if (type) params.push('type=' + encodeURIComponent(type));
			if (area) params.push('area=' + encodeURIComponent(area));
			if (area2) params.push('area2=' + encodeURIComponent(area2));
			
			if (params.length > 0) newUrl += '?' + params.join('&');
			window.location.href = newUrl;
		});
		return false;
	}

	// ==========================================================
	// 지역그룹(기존 동맹업체) 모달
	// - 상위 폴더 site__url_link.json을 서버가 읽어 내려주는 AJAX 사용
	// - 표시: 아이콘(이미지) + 사이트명, 클릭 시 해당 URL 이동
	// ==========================================================
	function openSiteGroupModal() {
		//오른쪽 사이드메뉴 열려있으면 닫기
		close_sidebar();
		
		var overlay = document.getElementById('modal_overlay');
		var modal = document.getElementById('gnb_sitegroup');

		// 오버레이가 없으면 생성 (다른 페이지 호환)
		if (!overlay) {
			overlay = document.createElement('div');
			overlay.id = 'modal_overlay';
			overlay.className = 'modal_overlay';
			document.body.appendChild(overlay);
		}

		// 모달이 없으면 동적 생성
		if (!modal) {
			modal = document.createElement('div');
			modal.id = 'gnb_sitegroup';
			modal.className = 'area_wrap gnb_sub_menu';
			modal.style.display = 'none';
			modal.innerHTML = '' +
				'<div class="area_tit">' +
				'  <span class="tit_text"><i class="fa fa-star" aria-hidden="true"></i> 지역그룹</span>' +
				'</div>' +
				'<div class="area_cont">' +
				'  <div class="category_grid" id="gnb_sitegroup_list"></div>' +
				'</div>' +
				'<button type="button" class="btn_close"><i class="fa fa-times" aria-hidden="true"></i></button>';
			document.body.appendChild(modal);
		}

		var $modal = $(modal);
		var $list = $modal.find('#gnb_sitegroup_list');

		function closeSiteGroupModal() {
			// 프로젝트 내 다른 메뉴 닫기 함수가 있으면 함께 사용하되,
			// closeGnbMenu()는 gnb_cate/gnb_area만 처리하므로 gnb_sitegroup는 여기서 직접 닫아준다.
			try {
				modal.classList.remove('show');
				setTimeout(function(){
					modal.style.setProperty('display', 'none');
				}, 300);
			} catch (e) {}

			if (typeof closeGnbMenu === 'function') {
				closeGnbMenu();
				document.body.style.overflow = '';
				return;
			}

			try {
				$(overlay).hide().removeClass('show').css({ opacity: '', visibility: '' });
				document.body.style.overflow = '';
			} catch (e) {}
		}

		function positionSiteGroupModal() {
			// 업종선택 모달과 동일하게 중앙 고정
			$modal.css({
				position: 'fixed',
				left: '50%',
				top: '50%',
				transform: 'translate(-50%, -50%)',
				zIndex: 21
			});
		}

		function renderLoading() {
			$list.html('<div class="sitegroup_state sitegroup_loading">불러오는 중...</div>');
		}
		function renderEmpty(msg) {
			$list.html('<div class="sitegroup_state sitegroup_empty">' + (msg || '등록된 지역그룹이 없습니다.') + '</div>');
		}
		function renderItems(items) {
			$list.empty();
			items.forEach(function(it){
				var name = (it && (it.site_name || it.name || it.label)) ? (it.site_name || it.name || it.label) : '';
				var img = (it && (it.site_img || it.img || it.icon)) ? (it.site_img || it.img || it.icon) : '';
				var url = (it && (it.site_url || it.url || it.href)) ? (it.site_url || it.url || it.href) : '';
				name = String(name || '').trim();
				img = String(img || '').trim();
				url = String(url || '').trim();
				if (!name || !url) return;

				var $item = $('<div class="category_item sitegroup_item"></div>');
				var $a = $('<a></a>');
				$a.attr('href', url);
				$a.attr('target', '_blank');
				$a.attr('rel', 'noopener noreferrer');
				if (img) {
					var $img = $('<img class="sitegroup_icon" alt="">');
					$img.attr('src', img);
					$img.attr('alt', name);
					$a.append($img);
				} else {
					$a.append('<i class="fa fa-link" aria-hidden="true"></i>');
				}
				$a.append('<span>' + $('<div/>').text(name).html() + '</span>');
				$item.append($a);
				$list.append($item);
			});
		}

		// 닫기 핸들러 중복 등록 방지
		$('.btn_close', modal).off('click.sitegroup').on('click.sitegroup', function(){
			closeSiteGroupModal();
		});
		$(overlay).off('click.sitegroup').on('click.sitegroup', function(e){
			if (e.target === overlay) closeSiteGroupModal();
		});
		$modal.off('click.sitegroupItem', '.sitegroup_item a').on('click.sitegroupItem', '.sitegroup_item a', function(){
			// 링크는 기본 동작(새 탭) 유지, 모달만 닫기
			setTimeout(function(){ closeSiteGroupModal(); }, 50);
		});

		// 모달 열기
		if (window.getComputedStyle(modal).display === 'none') {
			positionSiteGroupModal();
			overlay.style.setProperty('display', 'block');
			overlay.style.setProperty('opacity', '1');
			overlay.style.setProperty('visibility', 'visible');
			modal.style.setProperty('display', 'block');
			renderLoading();

			setTimeout(function() {
				modal.classList.add('show');
			}, 10);

			document.body.style.overflow = 'hidden';
		}

		// 데이터 로드
		$.ajax({
			url: '/ajax/get_sitegroup_links.php',
			method: 'GET',
			dataType: 'json',
			cache: false
		}).done(function(res){
			var items = [];
			if (Array.isArray(res)) {
				items = res;
			} else if (res && Array.isArray(res.items)) {
				items = res.items;
			} else if (res && Array.isArray(res.data)) {
				items = res.data;
			}

			// 예상 키: site_name/site_img/site_url
			if (!items || !items.length) {
				renderEmpty('등록된 지역그룹이 없습니다.');
				return;
			}
			renderItems(items);

			// 렌더링 결과가 비어있으면 메시지 표시
			if (!$list.children().length) renderEmpty('등록된 지역그룹이 없습니다.');
		}).fail(function(){
			renderEmpty('지역그룹 정보를 불러오지 못했습니다.');
		});

		// 리사이즈 시 위치 재계산
		$(window).off('resize.sitegroupModal').on('resize.sitegroupModal', function(){
			if ($modal.is(':visible')) positionSiteGroupModal();
		});

		return false;
	}

	function no_shop_comment() {
		salert('info','','이 업소의 댓글자료가 아직 없습니다');
	}

	function calc_second_past(dt) {
		lastdate=new Date(dt);
		curdate=new Date();
 		elapsedMSec = curdate.getTime() - lastdate.getTime(); 

		elapsedSec = elapsedMSec / 1000; // 9004

		//지정한 일자시간에서 현재시간까지의 진행된 초를 돌려주자
		return elapsedSec
	}

	//2024-12-05 setIntervaal 처리용
	document.addEventListener('visibilitychange', function() {
		if (document.hidden) {
			// 탭이 비활성화되면 interval을 정리합니다.
			//console.log('current page hide');
			//clearInterval(intervalId);
			//intervalId = null;
			try {
					if (typeof timer_gps!='undefined' && timer_gps>0) {
						clearInterval(timer_gps); 
						timer_gps=0;
						console.log('stop geolocation timer');
					}
			}
			catch (err) {
				console.log('geolocation exception error : ' + err);
			}

			try {
				if (typeof timer_alarm!='undefined' && timer_alarm>0) {
					clearInterval(timer_alarm); 
					timer_alarm=0;
					console.log('stop alarm timer');
				}
			}
			catch (err) {
				console.log('alarm exception error : ' + err);
			}

			try {
				if (typeof timer_response!='undefined' && timer_response>0) {
					clearInterval(timer_response); 
					timer_response=0;
					console.log('stop response timer');
				}
			}
			catch (err) {
				console.log('response exception error : ' + err);
			}
		} else {
			// 탭이 활성화되면 데이터를 즉시 요청하고 새 interval을 시작합니다.
			//console.log('current page show');
			//fetchData();
			//startFetching();

			try {
				if (typeof timer_gps!='undefined' && typeof call_gps=='function') {
					call_gps();
					console.log('start geolocation timer : ' + timer_gps);
				}
			}
			catch (err) {
				console.log('geolocation exception error : ' + err);
			}

			try {
				if (typeof timer_alarm!='undefined' && typeof call_alarm=='function') {
					call_alarm();
					console.log('start alarm timer : ' + timer_alarm);
				}
			}
			catch (err) {
				console.log('alarm exception error : ' + err);
			}

			try {
				if (typeof timer_response!='undefined' && typeof call_sidebar_response=='function') {
					call_sidebar_response();
					console.log('start response timer : ' + timer_response);
				}
			}
			catch (err) {
				console.log('response exception error : ' + err);
			}

			//점프 시간 다시처리후 표시
			if (typeof jumpcontrol=='function') {
				jumpcontrol();
			}
		}
	});

	function secondtotime(secs) {
		var sec_num = parseInt(secs, 10)
		var hours   = Math.floor(sec_num / 3600)
		var minutes = Math.floor(sec_num / 60) % 60
		var seconds = sec_num % 60

		return [hours,minutes,seconds]
			.map(v => v < 10 ? "0" + v : v)
			.filter((v,i) => v !== "00" || i > 0)
			.join(":")
	}

	function rewriteBoardLinks(tableList, newHref) {
	  $('a[href*="/bbs/board.php?bo_table="]').each(function() {
		var href = $(this).attr('href');
		var pattern = /bo_table=([a-zA-Z0-9_]+)/;
		var match = href.match(pattern);
		if (match && tableList.includes(match[1])) {
		  $(this).attr('href', newHref);
		}
	  });
	}
	
	function rewriteBoardLinksWithWrId(tableList, newHref) {
	  // 모든 a태그 중 href에 /bbs/board.php?bo_table= 가 포함된 것만 대상
	  document.querySelectorAll('a[href*="/bbs/board.php?bo_table="]').forEach(function(link) {
		try {
		  // href이 완전한 URL이 아니더라도 동작하도록 상대경로 대응
		  const absUrl = link.href.startsWith('http') ? link.href : window.location.origin + link.getAttribute('href');
		  const urlObj = new URL(absUrl);
		  const bo_table = urlObj.searchParams.get('bo_table');
		  const wr_id = urlObj.searchParams.get('wr_id');
		  // wr_id가 있는 경우에만 처리
		  if (wr_id && bo_table && tableList.includes(bo_table)) {
			link.href = newHref;
			// 필요시 커스텀 메시지 등 추가 가능
			// link.addEventListener('click', e => { e.preventDefault(); alert('로그인이 필요합니다.'); });
		  }
		} catch (e) {
		  // URL 파싱 에러 무시
		}
	  });
	}	

	//iframe 등에서 다시 읽어들여서 처리하는것을 방지하기 위해서 설정
	window.commonJsLoaded = true;

}

if (typeof window.playSound !== 'function') {
	/**
	 * MP3 재생: body에 <audio>를 붙였다가 끝나면 제거합니다.
	 * @param {string|{file?:string,mp3?:string,filename?:string,url?:string,src?:string}} opts 파일명만 주면 /sound/ 기준, url/src면 그대로 사용
	 */
	window.playSound = function (opts) {
		var o = typeof opts === 'string' ? { file: opts } : (opts || {});
		var url = o.url || o.src;
		var file = o.file || o.mp3 || o.filename;
		if (!url && file) {
			file = String(file).replace(/^[\/\\]+/, '').replace(/^.*[\/\\]/, '');
			if (!/^[a-zA-Z0-9._-]+\.mp3$/i.test(file)) {
				return;
			}
			var root = '';
			if (typeof g5_url !== 'undefined' && g5_url) {
				root = String(g5_url).replace(/\/$/, '');
			} else if (typeof window.g5_url !== 'undefined' && window.g5_url) {
				root = String(window.g5_url).replace(/\/$/, '');
			} else {
				root = (window.location && window.location.origin) ? String(window.location.origin).replace(/\/$/, '') : '';
			}
			url = root + '/sound/' + file;
		}
		if (!url) {
			return;
		}
		var audio = document.createElement('audio');
		audio.setAttribute('playsinline', '');
		audio.setAttribute('webkit-playsinline', '');
		audio.preload = 'auto';
		audio.src = url;
		audio.style.cssText = 'position:absolute;width:0;height:0;opacity:0;pointer-events:none;';
		var rm = function () {
			try {
				audio.pause();
				if (audio.parentNode) {
					audio.parentNode.removeChild(audio);
				}
			} catch (eRm) {}
		};
		audio.addEventListener('ended', rm, { once: true });
		audio.addEventListener('error', rm, { once: true });
		if (!document.body) {
			return;
		}
		document.body.appendChild(audio);
		var p = audio.play();
		if (p && typeof p.then === 'function') {
			p.catch(function () {
				rm();
			});
		}
	};
}

/*
if (typeof callMenu=="undefined") {
	function callMenu(obj) {
		$(".gnb_sub_menu").hide();
		$(".gnb_sch_menu2").hide();
		$("#at-body").css("margin-top","0px");

		if ($("#gnb_" + obj).css("display") == 'none') {
			$("#gnb_" + obj).show();
		}

		updateMarginTop();
	}

	function closeGnbMenu() {
		$(".gnb_sub_menu").hide();
		$(".gnb_sch_menu2").hide();
		$('.modal_overlay').removeClass('show');
		updateMarginTop();
	}

	function callSchMenu(obj) {
		$(".gnb_sch_menu").hide();
		$(".gnb_sch_menu2").hide();
		if ($("#gnb_" + obj).css("display") == 'none') {
			$("#gnb_" + obj).show();
		}

		updateMarginTop();
	}

	function closeSchMenu() {
		$(".gnb_sch_menu").hide();
		$(".gnb_sch_menu2").hide();
		$($(".widget-index")[0]).css('margin-top','0px');
	
		updateMarginTop();
	}
	
	$(window).load(function() {
		if ($('#gnb_cate').length>0) {
/*
			if ($('#gnb_cate').css('display')=='block') {
				callMenu("cate");
			} else if ($('#gnb_area').css('display')=='block') {
				callMenu("area");
			} else if ($('#gnb_cate').css('display')=='none' && $('#gnb_area').css('display')=='none') {
				callMenu("cate");
			} else {
				$($(".widget-index")[0]).css('margin-top','0px');
			}
*/
/*
		} else if ($('#gnb_bbs').length>0) {
			callMenu("bbs");
		}
		updateMarginTop();
	});
}
*/