$(document).ready(function () {
	// 슬라이크 전체 크기(width 구하기)
	const slide = document.querySelector(".mini_slide");
	let slideWidth = slide.clientWidth;
	window.slide_stop = false;
	window.slide_ready = false;

	// 버튼 엘리먼트 선택하기
	const prevBtn = document.querySelector(".mini_slide_prev_button");
	const nextBtn = document.querySelector(".mini_slide_next_button");

	// 슬라이드 전체를 선택해 값을 변경해주기 위해 슬라이드 전체 선택하기
	let slideItems = document.querySelectorAll(".mini_slide_item");
	// 현재 슬라이드 위치가 슬라이드 개수를 넘기지 않게 하기 위한 변수
	const maxSlide = slideItems.length;

	// 버튼 클릭할 때 마다 현재 슬라이드가 어디인지 알려주기 위한 변수
	let currSlide = 1;

	// 페이지네이션 생성
	const pagination = document.querySelector(".mini_slide_pagination");

	for (let i = 0; i < maxSlide; i++) {
	  if (i === 0) pagination.innerHTML += `<li class="active">•</li>`;
	  else pagination.innerHTML += `<li>•</li>`;
	}

	const paginationItems = document.querySelectorAll(".mini_slide_pagination > li");

	// 무한 슬라이드를 위해 start, end 슬라이드 복사하기
	const startSlide = slideItems[0];
	const endSlide = slideItems[slideItems.length - 1];
	const startElem = document.createElement("div");
	const endElem = document.createElement("div");

	endSlide.classList.forEach((c) => endElem.classList.add(c));
	endElem.innerHTML = endSlide.innerHTML;

	startSlide.classList.forEach((c) => startElem.classList.add(c));
	startElem.innerHTML = startSlide.innerHTML;

	// 각 복제한 엘리먼트 추가하기
	slideItems[0].before(endElem);
	slideItems[slideItems.length - 1].after(startElem);

	// 슬라이드 전체를 선택해 값을 변경해주기 위해 슬라이드 전체 선택하기
	slideItems = document.querySelectorAll(".mini_slide_item");
	//
	let offset = slideWidth; // + currSlide;
	slideItems.forEach((i) => {
	  i.setAttribute("style", `left: ${-offset}px`);
	});

	function getScrollBarWidth() {
	  let el = document.createElement("div");
	  el.style.cssText = "overflow:scroll; visibility:hidden; position:absolute;";
	  document.body.appendChild(el);
	  let width = el.offsetWidth - el.clientWidth;
	  el.remove();
	  return width;
	}

	function nextMove() {
	  currSlide++;
	  // 마지막 슬라이드 이상으로 넘어가지 않게 하기 위해서
	  if (currSlide <= maxSlide) {
		// 슬라이드를 이동시키기 위한 offset 계산
		const offset = slideWidth * currSlide;
		// 각 슬라이드 아이템의 left에 offset 적용
		slideItems.forEach((i) => {
		  i.setAttribute("style", `left: ${-offset}px`);
		});

		if (paginationItems.length>0) {
			// 슬라이드 이동 시 현재 활성화된 pagination 변경
			paginationItems.forEach((i) => i.classList.remove("active"));
			paginationItems[currSlide - 1].classList.add("active");
		}
	  } else {

		get_premium_random_banner();

		// 무한 슬라이드 기능 - currSlide 값만 변경해줘도 되지만 시각적으로 자연스럽게 하기 위해 아래 코드 작성
		currSlide = 0;
		let offset = slideWidth * currSlide;
		slideItems.forEach((i) => {
		  i.setAttribute("style", `transition: ${0}s; left: ${-offset}px`);
		});
		currSlide++;
		offset = slideWidth * currSlide;
		// 각 슬라이드 아이템의 left에 offset 적용
		setTimeout(() => {
		  // 각 슬라이드 아이템의 left에 offset 적용
		  slideItems.forEach((i) => {
			// i.setAttribute("style", `transition: ${0}s; left: ${-offset}px`);
			i.setAttribute("style", `transition: ${0.15}s; left: ${-offset}px`);
		  });
		}, 0);
		if (paginationItems.length>0) {
			// // 슬라이드 이동 시 현재 활성화된 pagination 변경
			paginationItems.forEach((i) => i.classList.remove("active"));
			paginationItems[currSlide - 1].classList.add("active");
		}
	  }
	}
	function prevMove() {
	  currSlide--;
	  // 1번째 슬라이드 이하로 넘어가지 않게 하기 위해서
	  if (currSlide > 0) {
		// 슬라이드를 이동시키기 위한 offset 계산
		const offset = slideWidth * currSlide;
		// 각 슬라이드 아이템의 left에 offset 적용
		slideItems.forEach((i) => {
		  i.setAttribute("style", `left: ${-offset}px`);
		});
		if (paginationItems.length>0) {
			// 슬라이드 이동 시 현재 활성화된 pagination 변경
			paginationItems.forEach((i) => i.classList.remove("active"));
			paginationItems[currSlide - 1].classList.add("active");
		}
	  } else {
		// 무한 슬라이드 기능 - currSlide 값만 변경해줘도 되지만 시각적으로 자연스럽게 하기 위해 아래 코드 작성
		currSlide = maxSlide + 1;
		let offset = slideWidth * currSlide;
		// 각 슬라이드 아이템의 left에 offset 적용
		slideItems.forEach((i) => {
		  i.setAttribute("style", `transition: ${0}s; left: ${-offset}px`);
		});
		currSlide--;
		offset = slideWidth * currSlide;
		setTimeout(() => {
		  // 각 슬라이드 아이템의 left에 offset 적용
		  slideItems.forEach((i) => {
			// i.setAttribute("style", `transition: ${0}s; left: ${-offset}px`);
			i.setAttribute("style", `transition: ${0.15}s; left: ${-offset}px`);
		  });
		}, 0);
		if (paginationItems.length>0) {
			// 슬라이드 이동 시 현재 활성화된 pagination 변경
			paginationItems.forEach((i) => i.classList.remove("active"));
			paginationItems[currSlide - 1].classList.add("active");
		}
	  }
	}

	// 버튼 엘리먼트에 클릭 이벤트 추가하기
	nextBtn.addEventListener("click", () => {
	  // 이후 버튼 누를 경우 현재 슬라이드를 변경
	  nextMove();
	});
	// 버튼 엘리먼트에 클릭 이벤트 추가하기
	prevBtn.addEventListener("click", () => {
	  // 이전 버튼 누를 경우 현재 슬라이드를 변경
	  prevMove();
	});

	// 브라우저 화면이 조정될 때 마다 slideWidth를 변경하기 위해
	window.addEventListener("resize", () => {
	  slideWidth = slide.clientWidth;
	});

	// 각 페이지네이션 클릭 시 해당 슬라이드로 이동하기
	for (let i = 0; i < maxSlide; i++) {
		if (paginationItems.length>0) {
		  // 각 페이지네이션마다 클릭 이벤트 추가하기
		  paginationItems[i].addEventListener("click", () => {
			// 클릭한 페이지네이션에 따라 현재 슬라이드 변경해주기(currSlide는 시작 위치가 1이기 때문에 + 1)
			currSlide = i + 1;
			// 슬라이드를 이동시키기 위한 offset 계산
			const offset = slideWidth * currSlide;
			// 각 슬라이드 아이템의 left에 offset 적용
			slideItems.forEach((i) => {
			  i.setAttribute("style", `left: ${-offset}px`);
			});
			// 슬라이드 이동 시 현재 활성화된 pagination 변경
			paginationItems.forEach((i) => i.classList.remove("active"));
			paginationItems[currSlide - 1].classList.add("active");
		  });
		}
	}

	// 드래그(스와이프) 이벤트를 위한 변수 초기화
	let startPoint = 0;
	let endPoint = 0;

	// PC 클릭 이벤트 (드래그)
	slide.addEventListener("mousedown", (e) => {
	  startPoint = e.pageX; // 마우스 드래그 시작 위치 저장
	});

	slide.addEventListener("mouseup", (e) => {
	  endPoint = e.pageX; // 마우스 드래그 끝 위치 저장
	  if (startPoint < endPoint) {
		// 마우스가 오른쪽으로 드래그 된 경우
		prevMove();
	  } else if (startPoint > endPoint) {
		// 마우스가 왼쪽으로 드래그 된 경우
		nextMove();
	  }
	});

	// 모바일 터치 이벤트 (스와이프)
	slide.addEventListener("touchstart", (e) => {
	  startPoint = e.touches[0].pageX; // 터치가 시작되는 위치 저장
	});
	slide.addEventListener("touchend", (e) => {
	  endPoint = e.changedTouches[0].pageX; // 터치가 끝나는 위치 저장
	  if (startPoint < endPoint) {
		// 오른쪽으로 스와이프 된 경우
		prevMove();
	  } else if (startPoint > endPoint) {
		// 왼쪽으로 스와이프 된 경우
		nextMove();
	  }
	});

	// 기본적으로 슬라이드 루프 시작하기
	let loopInterval = setInterval(() => {
		if (window.slide_stop || !window.slide_ready) return;
		nextMove();
	}, 3000);

	// 슬라이드에 마우스가 올라간 경우 루프 멈추기
	slide.addEventListener("mouseover", () => {
		if (window.slide_stop || !window.slide_ready) return;
		clearInterval(loopInterval);
	});

	// 슬라이드에서 마우스가 나온 경우 루프 재시작하기
	slide.addEventListener("mouseout", () => {
		if (window.slide_stop || !window.slide_ready) return;
		loopInterval = setInterval(() => {
			if (window.slide_stop || !window.slide_ready) return;
			nextMove();
	  }, 3000);
	});

	get_premium_random_banner();
})

var premium_random_banner_tmpl="\
			<div class='mini_slide_iteminfo_wrap' idx='[IDX]'>\n\
				<div class='mini_slide_shopinfo_img_wrap'>\n\
					<a href='javascript:openPageLogPc(\"[SHOPLINK]\",\"[MB_ID]\",\"[BOARD]\",\"click\",\"[SHOPID]\",\"[IDX]\")'><img src='[IMGLINK]' class='mini_slide_thumbnail_img' onerror='javascript:thumbnail_img_error(this, \"[SHOPTYPE]\")'></img></a>\n\
				</div>\n\
				<div class='mini_slide_shopinfo_wrap'>\n\
					<ul>\n\
						<li><span class='itemlbl'>업소명</span><a href='javascript:openPageLogPc(\"[SHOPLINK]\",\"[MB_ID]\",\"[BOARD]\",\"click\",\"[SHOPID]\",\"[IDX]\")'><span class='shopname itemdata'>[SHOPNAME]</span></a></li>\n\
						<li style='margin-top: 5px;'><span class='itemlbl'>영업시간</span><span class='itemdata'>[SHOPTIME]</span></li>\n\
						<li style='display:inline-block'><span class='itemlbl'>지역</span><span class='itemdata'>[SHOPAREA]</span></li>\n\
						<li style='display:inline-block'><span class='itemlbl'>업종</span><span class='itemdata'>[SHOPTYPE]</span></li>\n\
						<p style='display: block;line-height: 0px;height: 0px;margin: -2px;'></p>\n\
						<li style='display:inline-block'><span class='itemlbl'>조회</span><span class='itemdata'>[HIT]</span></li>\n\
						<li style='display:inline-block'><span class='itemlbl'>댓글</span><span class='itemdata'>[COMMENT]</span></li>\n\
					</ul>\n\
				</div>\n\
			</div>\n";

function thumbnail_img_error(_this, shoptype){
	_this.src='/images/upjong/noimg_'+shoptype+'.jpg';
}

function get_premium_random_banner(){
	if (window.slide_stop) return;
	var idxArray = [];
	
	// 모든 .listbox 요소를 순회합니다.
	$('.mini_slide_iteminfo_wrap').each(function() {
		// 현재 요소의 idx 속성 값을 가져옵니다.
		var idx = $(this).attr('idx');
		// 배열에 idx 값을 추가합니다.
		if (idx!='') idxArray.push(idx);
	});
	
	// 배열을 쉼표로 구분된 문자열로 변환합니다.
	var idxlist = idxArray.join(',');
	$.ajax
	(
		{
			type: "GET",
			url: "/ajax/ajax_premium_banner.php?device=pc&idxlist=" + idxlist,
			async:false,
			cache:false,
			dataType: 'json',
			success: function(data)
			{
				try {
					cnt=0;
					if (data.length<=0) {
						$('.mini_slide_item').addClass('premium_banner_nodata').html('<div class="premium_random_banner_nodata">죄송합니다, 해당하는 업소가 없습니다<div class="add_premium_banner1">프리미엄에 가입하시면 이곳에 표시됩니다</div></div>');
						window.slide_stop = true;
					} else {
						window.slide_ready = true;
						for (i=0;i<data.length;i=i+2) {
							tmpstr=premium_random_banner_tmpl;
							tmpstr=tmpstr.replaceAll('[IDX]'		,data[i].wr_id);
							tmpstr=tmpstr.replaceAll('[BOARD]'		,g5_bo_table);
							tmpstr=tmpstr.replaceAll('[SHOPID]'		,data[i].mb_id);
							tmpstr=tmpstr.replaceAll('[MB_ID]'		,g5_member_id);
							tmpstr=tmpstr.replaceAll('[SHOPLINK]'	,data[i].shoplink);
							tmpstr=tmpstr.replaceAll('[IMGLINK]'	,data[i].thumbnail);
							tmpstr=tmpstr.replaceAll('[SHOPNAME]'	,data[i].shopname);
							tmpstr=tmpstr.replaceAll('[SHOPTIME]'	,data[i].shoptime);
							tmpstr=tmpstr.replaceAll('[SHOPAREA]'	,data[i].shoparea);
							tmpstr=tmpstr.replaceAll('[SHOPTYPE]'	,data[i].shoptype);
							tmpstr=tmpstr.replaceAll('[COMMENT]'	,numberWithCommas(data[i].comment));
							tmpstr=tmpstr.replaceAll('[HIT]'		,numberWithCommas(data[i].hit));

							tmpstr2='';
							if (typeof data[i+1] !== 'undefined' && data[i+1] !== null) {
								tmpstr2=premium_random_banner_tmpl;
								tmpstr2=tmpstr2.replaceAll('[IDX]'		,data[i+1].wr_id);
								tmpstr2=tmpstr2.replaceAll('[BOARD]'	,g5_bo_table);
								tmpstr2=tmpstr2.replaceAll('[SHOPID]'	,data[i+1].mb_id);
								tmpstr2=tmpstr2.replaceAll('[MB_ID]'	,g5_member_id);
								tmpstr2=tmpstr2.replaceAll('[SHOPLINK]'	,data[i+1].shoplink);
								tmpstr2=tmpstr2.replaceAll('[IMGLINK]'	,data[i+1].thumbnail);
								tmpstr2=tmpstr2.replaceAll('[SHOPNAME]'	,data[i+1].shopname);
								tmpstr2=tmpstr2.replaceAll('[SHOPTIME]'	,data[i+1].shoptime);
								tmpstr2=tmpstr2.replaceAll('[SHOPAREA]'	,data[i+1].shoparea);
								tmpstr2=tmpstr2.replaceAll('[SHOPTYPE]'	,data[i+1].shoptype);
								tmpstr2=tmpstr2.replaceAll('[COMMENT]'	,numberWithCommas(data[i+1].comment));
								tmpstr2=tmpstr2.replaceAll('[HIT]'		,numberWithCommas(data[i+1].hit));
							}

							//if (idxArray.length==0) {
								$('.mini_slide_item.item'+(++cnt)).each(function () {
									$(this).html(tmpstr+tmpstr2);
								})
						//} else {
							
						//}
						//console.log(tmpstr);
						}
					}

					$(".iframe").fancybox({
						'width'				: 800,
						'height'			: '99%',
						'autoScale'			: false,
						'transitionIn'		: 'none',
						'transitionOut'		: 'none',
						'overlayOpacity'	: 0.8, // Set opacity to 0.8
						'overlayColor'		: "#000000", // Set color to Black
						'type'				: 'iframe',
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
				} catch (err) {
					console.log("cannot parse received data");
				}
			},
			error:function (xhr, textStatus, thrownError)
			{
				ret_val=xhr.readyState;
				console.log(ret_val + " , " + textStatus);
				$('.mini_slide_item').each(function () { $(this).html('<div class="premium_random_banner_error">오류가 발생하여 표시할수 없습니다</div>'); });
			},
			complete:function () {
			}
		}
	);
}

function numberWithCommas(x) {
	x = x.toString();
	var pattern = /(-?\d+)(\d{3})/;
	while (pattern.test(x))
		x = x.replace(pattern, "$1,$2");
	return x;
}