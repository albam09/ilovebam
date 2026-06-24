function toggle(post_id){
  var obj = xGetElementById(post_id);
   	if(!obj) return;
 	if(obj.style.display=="block"){
    obj.style.display='none';
  }else{
    obj.style.display="block";
  }
}
function attendMonth(dateYm) {
    var q = (typeof dateYm !== "undefined" && dateYm !== null) ? ("?date=" + dateYm) : "";

    $("#ajax_navi").load("ajax_navi.php" + q, function () {
	});

	showloading_elm("#ajax_calendar","calendar");
	$("#ajax_calendar").load("ajax_calendar.php" + q, function () {
		hideloading_elm("calendar");
	});

	showloading_elm("#ajax_list","list");
	$("#ajax_list").load("ajax_more.php" + q, function( response, status, xhr ) {
		hideloading_elm("list");
		if ( status == "error" ) {
			$( "#ajax_list" ).html("<div class='error'>오류가 발생하여 불러오지 못했습니다, 잠시후 다시 시도해주세요</div>");
		}
	});
}

// 전역 노출(캐시/스코프 이슈 방어)
if (typeof window !== "undefined") {
  window.attendMonth = attendMonth;
}

$(document).ready(function () {
	$("#ajax_navi").load("ajax_navi.php", function () {
	});

	showloading_elm("#ajax_calendar","calendar");
	$("#ajax_calendar").load("ajax_calendar.php", function () {
		hideloading_elm("calendar");
	});

	showloading_elm("#ajax_list","list");
	$("#ajax_list").load("ajax_more.php", function( response, status, xhr ) {
		hideloading_elm("list");
		if ( status == "error" ) {
			$( "#ajax_list" ).html("<div class='error'>오류가 발생하여 불러오지 못했습니다, 잠시후 다시 시도해주세요</div>");
		}
	});

  window.setInterval(function(){
    autoTimer();
  },1000);
  autoTimer();
});
var autoTimer = function() {

	if(rest_time < 0) {
		$("#at-timer").html("00:00:00");
		return false;
	}

	hh = Math.floor(rest_time/3600);
	mm = Math.floor((rest_time%3600)/60);
	ss = Math.floor(((rest_time%3600)%60));
	if(hh<10) hh = "0"+hh;
	if(mm<10) mm = "0"+mm;
	if(ss<10) ss = "0"+ss;
	$("#at-timer").html(hh+":"+mm+":"+ss);

	rest_time--;
}