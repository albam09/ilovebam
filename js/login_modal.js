// 로그인 모달 관리 JavaScript

let loginModal = null;
var SEARCH_MIN_LENGTH = 2;

// 모바일 감지 함수 (기존 그누보드 변수와 충돌 방지)
function isMobileDevice() {
    try {
        // 기존 그누보드 변수들을 우선적으로 사용
        if (typeof window.isMobile !== 'undefined' && window.isMobile !== null) {
            return Boolean(window.isMobile);
        }
        
        // G5_IS_MOBILE 상수가 있으면 사용
        if (typeof G5_IS_MOBILE !== 'undefined') {
            return Boolean(G5_IS_MOBILE);
        }
    } catch (e) {
        // 변수 접근 오류 시 무시하고 직접 감지
    }
    
    // 직접 감지 (기존 그누보드 변수와 완전히 분리)
    return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// 모바일에서 기존 슬라이드 방지
function preventDefaultSidebar() {
    // 기존 슬라이드 함수들을 임시로 비활성화
    if (typeof sidebar_open === 'function') {
        const originalSidebarOpen = sidebar_open;
        sidebar_open = function(name) {
            // 로그인 모달이 열려있으면 슬라이드 방지
            if (loginModal) {
                return false;
            }
            return originalSidebarOpen.call(this, name);
        };
    }
}

// 로그인 모달 열기
function openLoginModal(tab = 'login') {
    // 이미 모달이 열려있으면 닫기
    if (loginModal || document.getElementById('login-modal-overlay')) {
        closeLoginModal();
    }
    
    // 모바일에서는 body 스크롤 방지 및 기존 슬라이드 방지
    if (isMobileDevice()) {
        document.body.style.overflow = 'hidden';
        preventDefaultSidebar();
    }
    
    // 모달 오버레이 생성
    const overlay = document.createElement('div');
    overlay.className = 'login-modal-overlay';
    overlay.id = 'login-modal-overlay';
    
    // 모달 컨테이너 생성
    const container = document.createElement('div');
    container.className = 'login-modal-container';
    container.innerHTML = getModalHTML();
    
    overlay.appendChild(container);
    document.body.appendChild(overlay);
    
    // 애니메이션을 위해 약간의 지연 후 show 클래스 추가
    setTimeout(() => {
        overlay.classList.add('show');
    }, 10);
    
    // 모달 참조 저장
    loginModal = overlay;
    
    // 탭 전환
    if (tab === 'signup') {
        setTimeout(() => {
            switchTab('signup');
        }, 100);
    }
    
    // ESC 키 이벤트 리스너 추가
    document.addEventListener('keydown', handleEscapeKey);
    
    // 텔레그램 고객센터 링크 설정
    setupTelegramSupport();
    
    // 오버레이 클릭 시 모달 닫기
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            closeLoginModal();
        }
    });
    
    // 폼 이벤트 리스너 추가 (한 번만 등록)
    if (!document.querySelector('#loginForm').hasAttribute('data-listeners-added')) {
        setupFormEventListeners();
        document.querySelector('#loginForm').setAttribute('data-listeners-added', 'true');
    }
    
    // 중복 검사 이벤트 리스너 등록 (항상 등록)
    setupDuplicateCheckListeners();
    
    // 실시간 유효성 검사 이벤트 리스너 등록
    setupRealTimeValidation();
}

// 로그인 모달 닫기
function closeLoginModal() {
    const overlay = loginModal || document.getElementById('login-modal-overlay');
    
    if (overlay) {
        overlay.classList.remove('show');
        setTimeout(() => {
            if (overlay && overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
            loginModal = null;
            
            // 모바일에서 body 스크롤 복원
            if (isMobileDevice()) {
                document.body.style.overflow = '';
            }
        }, 300);
        
        // ESC 키 이벤트 리스너 제거
        document.removeEventListener('keydown', handleEscapeKey);
    }
}

// ESC 키 처리
function handleEscapeKey(e) {
    if (e.key === 'Escape') {
        closeLoginModal();
    }
}

// 모달 HTML 생성
function getModalHTML() {
    return `
        <div class="modal-header">
            <div class="header-left">
                <div class="header-icon"><i class="fa fa-user"></i></div>
                <div class="header-title">로그인</div>
            </div>
            <button class="close-btn" onclick="closeLoginModal()"><i class="fa fa-times"></i></button>
        </div>

        <div class="tab-navigation">
            <button class="tab active" onclick="switchTab('login')">
                <span class="tab-icon"><i class="fa fa-sign-in"></i></span>
                로그인
            </button>
            <button class="tab" onclick="switchTab('signup')">
                <span class="tab-icon"><i class="fa fa-user-plus"></i></span>
                회원가입
            </button>
        </div>

        <div class="form-container">
            <!-- 로그인 폼 -->
            <div id="login-form" class="tab-content active">
                <form id="loginForm">
                    <div class="form-group">
                        <label class="form-label">아이디</label>
                        <input type="text" class="form-input" name="mb_id" id="login_mb_id" placeholder="아이디를 입력하세요" required>
                        <div class="error-message" id="login-id-error"></div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">비밀번호</label>
                        <input type="password" class="form-input" name="mb_password" id="login_mb_password" placeholder="비밀번호를 입력하세요" required>
                        <div class="error-message" id="login-password-error"></div>
                    </div>
                    <div class="form-options">
                        <div class="checkbox-group">
                            <div class="checkbox" id="auto-login-checkbox" onclick="toggleCheckbox(this)"></div>
                            <label class="checkbox-label" for="auto-login-checkbox">자동로그인</label>
                        </div>
                        <a href="#" class="find-link">아이디/비밀번호 찾기</a>
                    </div>
                    <button type="submit" class="login-btn" id="login-submit-btn">
                        <i class="fa fa-sign-in"></i>
                        로그인
                    </button>
                    <div class="loading" id="login-loading"><i class="fa fa-spinner fa-spin"></i> 처리 중...</div>
                    <div class="error-message" id="login-general-error"></div>
                    <div class="success-message" id="login-success"></div>
                </form>
                
                <!-- 텔레그램 고객센터 링크 -->
                <div class="telegram-support" id="telegram-support" style="display: none;">
                    <a href="#" class="telegram-link">
                        <div class="msn2_wrapper" style="display: block;">
                            <div class="msn2_img"><img src="/img/telegram.png" alt="텔레그램"></div>
                            <div class="msn2_text">텔레그램 고객센터</div>
                            <div class="msn2_text1">클릭시 오픈</div>
                        </div>
                    </a>
                </div>
            </div>

            <!-- 회원가입 폼 -->
            <div id="signup-form" class="tab-content">
                <form id="signupForm">
                    <div class="form-group">
                        <label class="form-label">아이디</label>
                        <input type="text" class="form-input" name="mb_id" id="register_mb_id" placeholder="아이디를 입력하세요" required>
                        <div class="error-message" id="signup-id-error"></div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">비밀번호</label>
                        <input type="password" class="form-input" name="mb_password" id="register_mb_password" placeholder="비밀번호를 입력하세요" required>
                        <div class="error-message" id="signup-password-error"></div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">비밀번호 확인</label>
                        <input type="password" class="form-input" name="mb_password_confirm" id="register_mb_password_confirm" placeholder="비밀번호를 다시 입력하세요" required>
                        <div class="error-message" id="signup-password-confirm-error"></div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">이름</label>
                        <input type="text" class="form-input" name="mb_name" id="register_mb_name" placeholder="이름을 입력하세요" required>
                        <div class="error-message" id="signup-name-error"></div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">닉네임</label>
                        <input type="text" class="form-input" name="mb_nick" id="register_mb_nick" placeholder="닉네임을 입력하세요" required>
                        <div class="error-message" id="signup-nick-error"></div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">이메일 <span style="color: #999; font-size: 12px;">(선택사항)</span></label>
                        <input type="email" class="form-input" name="mb_email" placeholder="이메일을 입력하세요 (선택사항)">
                        <div class="error-message" id="signup-email-error"></div>
                    </div>
                    <button type="submit" class="login-btn" id="signup-submit-btn">
                        <i class="fa fa-user-plus"></i>
                        회원가입
                    </button>
                    <div class="loading" id="signup-loading"><i class="fa fa-spinner fa-spin"></i> 처리 중...</div>
                    <div class="error-message" id="signup-general-error"></div>
                    <div class="success-message" id="signup-success"></div>
                </form>
            </div>
        </div>

        <div class="modal-footer">
            <button class="close-footer-btn" onclick="closeLoginModal()">닫기</button>
        </div>
    `;
}

// 탭 전환
function switchTab(tabName) {
    // 모든 탭과 콘텐츠 비활성화
    const tabs = document.querySelectorAll('.tab');
    const contents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => tab.classList.remove('active'));
    contents.forEach(content => content.classList.remove('active'));
    
    // 선택된 탭과 콘텐츠 활성화
    if (tabName === 'login') {
        tabs[0].classList.add('active');
        document.getElementById('login-form').classList.add('active');
        document.querySelector('.header-title').textContent = '로그인';
        
        // 로그인 탭으로 전환 시 로그인 폼 초기화
        clearLoginForm();
        
    } else {
        tabs[1].classList.add('active');
        document.getElementById('signup-form').classList.add('active');
        document.querySelector('.header-title').textContent = '회원가입';
        
        // 회원가입 탭으로 전환 시 회원가입 폼 초기화
        clearSignupForm();
    }
    
    // 에러 메시지 숨기기
    hideAllMessages();
    
    // 중복 검사 결과 메시지 제거
    clearDuplicateResults();
    
    // 회원가입 탭으로 전환할 때만 검증 이벤트 설정
    if (tabName === 'signup') {
        // 검증 카운터 초기화
        resetSignupValidationCount();
        setTimeout(() => {
            setupDuplicateCheckListeners();
        }, 100);
    }
}

// 로그인 폼 초기화
function clearLoginForm() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.reset();
        // 자동로그인 체크박스 초기화
        const autoLoginCheckbox = document.getElementById('auto-login-checkbox');
        if (autoLoginCheckbox) {
            autoLoginCheckbox.classList.remove('checked');
        }
    }
}

// 회원가입 폼 초기화
function clearSignupForm() {
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.reset();
    }
}

// 실시간 유효성 검사 이벤트 리스너 설정
function setupRealTimeValidation() {
    // 로그인 폼 실시간 검증
    const loginIdInput = document.getElementById('login_mb_id');
    const loginPasswordInput = document.getElementById('login_mb_password');
    
    if (loginIdInput) {
        loginIdInput.addEventListener('blur', function() {
            const value = this.value.trim();
            if (value) {
                if (value.length < 4) {
                    showFieldMessage('login_mb_id', 'error', '아이디는 4글자 이상이어야 합니다.');
                } else if (value.length > 20) {
                    showFieldMessage('login_mb_id', 'error', '아이디는 20글자 이하여야 합니다.');
                } else {
                    showFieldMessage('login_mb_id', 'success', '');
                }
            }
        });
    }
    
    if (loginPasswordInput) {
        loginPasswordInput.addEventListener('blur', function() {
            const value = this.value.trim();
            if (value) {
                if (value.length < 4) {
                    showFieldMessage('login_mb_password', 'error', '비밀번호는 4글자 이상이어야 합니다.');
                } else if (value.length > 20) {
                    showFieldMessage('login_mb_password', 'error', '비밀번호는 20글자 이하여야 합니다.');
                } else {
                    showFieldMessage('login_mb_password', 'success', '');
                }
            }
        });
    }
    
    // 회원가입 폼 실시간 검증
    const signupPasswordConfirmInput = document.getElementById('register_mb_password_confirm');
    
    if (signupPasswordConfirmInput) {
        signupPasswordConfirmInput.addEventListener('blur', function() {
            const password = document.getElementById('register_mb_password').value.trim();
            const confirmPassword = this.value.trim();
            
            if (confirmPassword) {
                if (password !== confirmPassword) {
                    showFieldMessage('register_mb_password_confirm', 'error', '비밀번호가 일치하지 않습니다.');
                } else {
                    showFieldMessage('register_mb_password_confirm', 'success', '비밀번호가 일치합니다.');
                }
            }
        });
    }
    
    // 이메일 실시간 검증
    const emailInput = document.querySelector('input[name="mb_email"]');
    if (emailInput) {
        emailInput.addEventListener('blur', function() {
            const value = this.value.trim();
            if (value) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    showFieldMessage('register_mb_email', 'error', '올바른 이메일 형식을 입력해주세요.');
                } else {
                    showFieldMessage('register_mb_email', 'success', '올바른 이메일 형식입니다.');
                }
            }
        });
    }
}

// 체크박스 토글
function toggleCheckbox(checkbox) {
    checkbox.classList.toggle('checked');
}

// 모든 에러/성공 메시지 숨기기
function hideAllMessages() {
    const messages = document.querySelectorAll('.error-message, .success-message');
    messages.forEach(msg => {
        msg.style.display = 'none';
    });
}

// 모든 필드 메시지 제거
function clearDuplicateResults() {
    const fieldMessages = document.querySelectorAll('.field-message');
    fieldMessages.forEach(message => {
        message.remove();
    });
}

// 필드 메시지 제거 (clearFieldMessages 별칭)
function clearFieldMessages() {
    clearDuplicateResults();
}

// 비밀번호 확인 함수
function checkPasswordMatch() {
    const password = document.getElementById('register_mb_id').closest('form').querySelector('[name="mb_password"]').value;
    const passwordConfirm = document.getElementById('register_mb_password_confirm').value;
    
    console.log('비밀번호 확인:', password, passwordConfirm);
    
    if (password && passwordConfirm) {
        if (password === passwordConfirm) {
            showPasswordResult('success', '비밀번호입력 확인 성공');
        } else {
            showPasswordResult('error', '비밀번호 입력이 틀립니다');
        }
    }
}

// 비밀번호 확인 결과 표시
function showPasswordResult(type, message) {
    showFieldMessage('register_mb_password_confirm', type, message);
}

// 입력 검증 함수들
function validateId(value) {
    const regex = /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{}|\\:";'<>?,./]{4,20}$/;
    const forbiddenChars = /[`';:~]/;
    
    if (!value || value.trim() === '') return { valid: false, message: '아이디를 입력해주세요.' };
    if (forbiddenChars.test(value)) return { valid: false, message: '아이디에 사용할 수 없는 문자(`\';:~)가 포함되어 있습니다.' };
    if (value.length < 4) return { valid: false, message: '아이디는 4글자 이상이어야 합니다.' };
    if (value.length > 20) return { valid: false, message: '아이디는 20글자 이하여야 합니다.' };
    if (!regex.test(value)) return { valid: false, message: '아이디는 영문, 숫자, 특수기호만 사용 가능합니다.' };
    
    // 검증 통과 시 중복 검사
    checkDuplicate('id', value, function(data) {
        showDuplicateResult('mb_id', data);
    });
    
    return { valid: true, message: '사용 가능한 아이디입니다.' };
}

function validatePassword(value) {
    const regex = /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{}|\\:";'<>?,./]{4,20}$/;
    const forbiddenChars = /[`';:~]/;
    
    if (!value || value.trim() === '') return { valid: false, message: '비밀번호를 입력해주세요.' };
    if (forbiddenChars.test(value)) return { valid: false, message: '비밀번호에 사용할 수 없는 문자(`\';:~)가 포함되어 있습니다.' };
    if (value.length < 4) return { valid: false, message: '비밀번호는 4글자 이상이어야 합니다.' };
    if (value.length > 20) return { valid: false, message: '비밀번호는 20글자 이하여야 합니다.' };
    if (!regex.test(value)) return { valid: false, message: '비밀번호는 영문, 숫자, 특수기호만 사용 가능합니다.' };
    
    return { valid: true, message: '사용 가능한 비밀번호입니다.' };
}

// 입력 검증 함수들
function validateLoginId(value) {
    const regex = /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{}|\\:";'<>?,./]{4,20}$/;
    const forbiddenChars = /[`';:~]/;
    
    if (!value || value.trim() === '') return { valid: false, message: '아이디를 입력해주세요.' };
    if (forbiddenChars.test(value)) return { valid: false, message: '아이디에 사용할 수 없는 문자(`\';:~)가 포함되어 있습니다.' };
    if (value.length < 4) return { valid: false, message: '아이디는 4글자 이상이어야 합니다.' };
    if (value.length > 20) return { valid: false, message: '아이디는 20글자 이하여야 합니다.' };
    if (!regex.test(value)) return { valid: false, message: '아이디는 영문, 숫자, 특수기호만 사용 가능합니다.' };
    
    return { valid: true, message: '' };
}

function validateLoginPassword(value) {
    const regex = /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{}|\\:";'<>?,./]{4,20}$/;
    const forbiddenChars = /[`';:~]/;
    
    if (!value || value.trim() === '') return { valid: false, message: '비밀번호를 입력해주세요.' };
    if (forbiddenChars.test(value)) return { valid: false, message: '비밀번호에 사용할 수 없는 문자(`\';:~)가 포함되어 있습니다.' };
    if (value.length < 4) return { valid: false, message: '비밀번호는 4글자 이상이어야 합니다.' };
    if (value.length > 20) return { valid: false, message: '비밀번호는 20글자 이하여야 합니다.' };
    if (!regex.test(value)) return { valid: false, message: '비밀번호는 영문, 숫자, 특수기호만 사용 가능합니다.' };
    
    return { valid: true, message: '' };
}

function validateName(value) {
    const regex = /^[가-힣a-zA-Z0-9!@#$%^&*()_+\-=\[\]{}|\\:";'<>?,./]{2,10}$/;
    const forbiddenChars = /[`';:~]/;
    
    if (!value || value.trim() === '') return { valid: false, message: '이름을 입력해주세요.' };
    if (forbiddenChars.test(value)) return { valid: false, message: '이름에 사용할 수 없는 문자(`\';:~)가 포함되어 있습니다.' };
    if (value.length < 2) return { valid: false, message: '이름은 2글자 이상이어야 합니다.' };
    if (value.length > 10) return { valid: false, message: '이름은 10글자 이하여야 합니다.' };
    if (!regex.test(value)) return { valid: false, message: '이름은 한글, 영문, 숫자, 특수기호만 사용 가능합니다.' };
    
    return { valid: true, message: '사용 가능한 이름입니다.' };
}

function validateNick(value) {
    const regex = /^[가-힣a-zA-Z0-9!@#$%^&*()_+\-=\[\]{}|\\:";'<>?,./]{2,10}$/;
    const forbiddenChars = /[`';:~]/;
    
    if (!value || value.trim() === '') return { valid: false, message: '닉네임을 입력해주세요.' };
    if (forbiddenChars.test(value)) return { valid: false, message: '닉네임에 사용할 수 없는 문자(`\';:~)가 포함되어 있습니다.' };
    if (value.length < 2) return { valid: false, message: '닉네임은 2글자 이상이어야 합니다.' };
    if (value.length > 10) return { valid: false, message: '닉네임은 10글자 이하여야 합니다.' };
    if (!regex.test(value)) return { valid: false, message: '닉네임은 한글, 영문, 숫자, 특수기호만 사용 가능합니다.' };
    
    // 검증 통과 시 중복 검사
    checkDuplicate('nick', value, function(data) {
        showDuplicateResult('mb_nick', data);
    });
    
    return { valid: true, message: '사용 가능한 닉네임입니다.' };
}

// 통합 메시지 표시 함수
function showFieldMessage(inputId, type, message) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    const formGroup = input.closest('.form-group');
    if (!formGroup) return;
    
    // 기존 메시지 제거
    const existingMessage = formGroup.querySelector('.field-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    if (message) {
        // 새 메시지 생성
        const messageDiv = document.createElement('div');
        messageDiv.className = 'field-message';
        
        if (type === 'success') {
            messageDiv.classList.add('success');
            messageDiv.innerHTML = '<i class="fa fa-check-circle"></i> ' + message;
        } else {
            messageDiv.classList.add('error');
            messageDiv.innerHTML = '<i class="fa fa-times-circle"></i> ' + message;
        }
        
        formGroup.appendChild(messageDiv);
    }
}

function hideFieldMessage(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    const formGroup = input.closest('.form-group');
    if (!formGroup) return;
    
    // 기존 메시지 제거
    const existingMessage = formGroup.querySelector('.field-message');
    if (existingMessage) {
        existingMessage.remove();
    }
}

// 검증 결과 표시
function showValidationResult(inputId, result) {
    showFieldMessage(inputId, result.valid ? 'success' : 'error', result.message);
}

// 에러 메시지 표시
function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

// 성공 메시지 표시
function showSuccess(elementId, message) {
    const successElement = document.getElementById(elementId);
    if (successElement) {
        successElement.textContent = message;
        successElement.style.display = 'block';
    }
}

// 로딩 표시
function showLoading(formType) {
    const loadingElement = document.getElementById(formType + '-loading');
    const submitBtn = document.getElementById(formType + '-submit-btn');
    
    if (loadingElement) loadingElement.classList.add('show');
    if (submitBtn) submitBtn.disabled = true;
}

// 로딩 숨기기
function hideLoading(formType) {
    const loadingElement = document.getElementById(formType + '-loading');
    const submitBtn = document.getElementById(formType + '-submit-btn');
    
    if (loadingElement) loadingElement.classList.remove('show');
    if (submitBtn) submitBtn.disabled = false;
}

// 실시간 중복 검사 함수
function checkDuplicate(type, value, callback) {

	//회원가입탭 아니면 종료
	if (get_current_modal_tab()!='signup') return;

	if (!value || value.length < (type === 'id' ? 3 : 2)) {
        return;
    }
    
    const formData = new FormData();
    formData.append('type', type);
    formData.append('value', value);
    
    fetch('/ajax/ajax_register_check.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (callback) {
            callback(data);
        }
    })
    .catch(error => {
        console.error('중복 검사 오류:', error);
    });
}

// 중복 검사 결과 표시
function showDuplicateResult(inputName, data) {
    let inputId;
    if (inputName === 'mb_id') {
        inputId = 'register_mb_id';
    } else if (inputName === 'mb_nick') {
        inputId = 'register_mb_nick';
    } else {
        return;
    }
    
    showFieldMessage(inputId, data.success ? 'success' : 'error', data.message);
    
    // 중복 검사 결과에 따라 카운터 업데이트
    if (data.success) {
        incrementValidationCount();
    } else {
        decrementValidationCount();
    }
}

// 중복 검사 이벤트 리스너 설정 (간소화)
function setupDuplicateCheckListeners() {
    // 이미 설정된 경우 중복 실행 방지
    if (document.querySelector('#signup-form[data-listeners-added="true"]')) {
        return;
    }
    
    // 이제 validateId, validateNick 함수에서 직접 중복 검사를 처리하므로
    // 별도의 이벤트 리스너가 필요 없음
    
    // 비밀번호 확인 이벤트만 별도 처리
    $(document).off('blur', '#register_mb_password_confirm').on('blur', '#register_mb_password_confirm', function() {
        const password = $('#register_mb_password').val();
        const passwordConfirm = $(this).val();
        
        if (passwordConfirm.length > 0) {
            if (password === passwordConfirm) {
                showPasswordResult('success', '비밀번호입력 확인 성공');
                incrementValidationCount();
            } else {
                showPasswordResult('error', '비밀번호 입력이 틀립니다');
                decrementValidationCount();
            }
        } else {
            clearFieldMessages();
            decrementValidationCount();
        }
    });
    
    // 입력 검증 이벤트 리스너들
    setupValidationListeners();
    
    // 설정 완료 표시
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.setAttribute('data-listeners-added', 'true');
    }
}

// 회원가입 검증 카운터 (전역 변수)
let signupValidationCount = 0;

// 로그인 검증 카운터 (전역 변수)
let loginValidationCount = 0;

const requiredFields = ['mb_id', 'mb_password', 'mb_name', 'mb_nick', 'mb_password_confirm'];

// 로그인 검증 카운터 초기화
function resetLoginValidationCount() {
    LoginValidationCount = 0;
}

// 로그인 검증 카운터 증가
function incrementLoginValidationCount() {
    signupValidationCount++;
}

// 로그인 검증 카운터 감소
function decrementValidationCount() {
    if (LoginValidationCount > 0) {
        LoginValidationCount--;
    }
}

// 회원가입 검증 카운터 초기화
function resetSignupValidationCount() {
    signupValidationCount = 0;
}

// 회원가입 검증 카운터 증가
function incrementValidationCount() {
    signupValidationCount++;
}

// 회원가입 검증 카운터 감소
function decrementValidationCount() {
    if (signupValidationCount > 0) {
        signupValidationCount--;
    }
}

// 텔레그램 고객센터 링크 설정
function setupTelegramSupport() {
    // PHP에서 전달된 TELEGRAM 상수 확인
    if (typeof window.TELEGRAM !== 'undefined' && window.TELEGRAM) {
        const telegramSupport = document.getElementById('telegram-support');
        const telegramLink = telegramSupport.querySelector('.telegram-link');
        
        if (telegramSupport && telegramLink) {
            telegramLink.href = window.TELEGRAM;
            telegramSupport.style.display = 'block';
        }
    }
}

// 입력 검증 이벤트 리스너 설정
function setupValidationListeners() {
    // jQuery 이벤트 위임으로 동적 생성된 요소에 이벤트 바인딩
    $(document).off('blur', '#register_mb_id').on('blur', '#register_mb_id', function() {
        const value = $(this).val().trim();
        if (value.length > 0) {
            const result = validateId(value);
            showValidationResult('register_mb_id', result);
            if (result.valid) {
                incrementValidationCount();
            } else {
                decrementValidationCount();
            }
        } else {
            showValidationResult('register_mb_id', { valid: false, message: '아이디를 정확하게 입력해주세요' });
            decrementValidationCount();
        }
    });
    
    $(document).off('blur', '#register_mb_password').on('blur', '#register_mb_password', function() {
        const value = $(this).val().trim();
        if (value.length > 0) {
            const result = validatePassword(value);
            showValidationResult('register_mb_password', result);
            if (result.valid) {
                incrementValidationCount();
            } else {
                decrementValidationCount();
            }
        } else {
            showValidationResult('register_mb_password', { valid: false, message: '비밀번호를 정확하게 입력해주세요' });
            decrementValidationCount();
        }
    });
    
    $(document).off('blur', '#register_mb_name').on('blur', '#register_mb_name', function() {
        const value = $(this).val().trim();
        if (value.length > 0) {
            const result = validateName(value);
            showValidationResult('register_mb_name', result);
            if (result.valid) {
                incrementValidationCount();
            } else {
                decrementValidationCount();
            }
        } else {
            showValidationResult('register_mb_name', { valid: false, message: '이름을 정확하게 입력해주세요' });
            decrementValidationCount();
        }
    });
    
    $(document).off('blur', '#register_mb_nick').on('blur', '#register_mb_nick', function() {
        const value = $(this).val().trim();
        if (value.length > 0) {
            const result = validateNick(value);
            showValidationResult('register_mb_nick', result);
            if (result.valid) {
                incrementValidationCount();
            } else {
                decrementValidationCount();
            }
        } else {
            showValidationResult('register_mb_nick', { valid: false, message: '닉네임을 정확하게 입력해주세요' });
            decrementValidationCount();
        }
    });
    
    // 로그인 폼 검증 이벤트 리스너
    $(document).off('blur', '#login_mb_id').on('blur', '#login_mb_id', function() {
        const value = $(this).val().trim();
        if (value.length > 0) {
            const result = validateLoginId(value);
            if(result.valid) {
                incrementLoginValidationCount();
            } else {
                decrementLoginValidationCount();
            }
            showValidationResult('login_mb_id', result);
        } else {
            showValidationResult('login_mb_id', { valid: false, message: '아이디를 정확하게 입력해주세요' });
        }
    });
    
    $(document).off('blur', '#login_mb_password').on('blur', '#login_mb_password', function() {
        const value = $(this).val().trim();
        if (value.length > 0) {
            const result = validateLoginPassword(value);
            if (result.valid) {
                incrementLoginValidationCount();
            } else {
                decrementLoginValidationCount();
            }

            showValidationResult('login_mb_password', result);
        } else {
            showValidationResult('login_mb_password', { valid: false, message: '비밀번호를 정확하게 입력해주세요' });
        }
    });
}

// 폼 이벤트 리스너 설정
function setupFormEventListeners() {
    // 로그인 폼 제출
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            hideAllMessages();
            
            // 로그인 폼 유효성 검사
            const mb_id = document.getElementById('login_mb_id').value.trim();
            const mb_password = document.getElementById('login_mb_password').value.trim();
            
            let hasError = false;
            
            // 아이디 검증
            if (!mb_id) {
                showFieldMessage('login_mb_id', 'error', '아이디를 입력해주세요.');
                hasError = true;
            } else if (mb_id.length < 4) {
                showFieldMessage('login_mb_id', 'error', '아이디는 4글자 이상이어야 합니다.');
                hasError = true;
            } else if (mb_id.length > 20) {
                showFieldMessage('login_mb_id', 'error', '아이디는 20글자 이하여야 합니다.');
                hasError = true;
            }
            
            // 비밀번호 검증
            if (!mb_password) {
                showFieldMessage('login_mb_password', 'error', '비밀번호를 입력해주세요.');
                hasError = true;
            } else if (mb_password.length < 4) {
                showFieldMessage('login_mb_password', 'error', '비밀번호는 4글자 이상이어야 합니다.');
                hasError = true;
            } else if (mb_password.length > 20) {
                showFieldMessage('login_mb_password', 'error', '비밀번호는 20글자 이하여야 합니다.');
                hasError = true;
            }
            
            // 유효성 검사 실패 시 서버 전송 중단
            if (hasError) {
                return;
            }
            
            showLoading('login');
            
            const formData = new FormData(this);
            const autoLogin = document.getElementById('auto-login-checkbox').classList.contains('checked');
            formData.append('auto_login', autoLogin ? '1' : '0');
            
            fetch('/ajax/ajax_login_check.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                hideLoading('login');
                if (data.success) {
                    const userId = data.member ? data.member.mb_id : '회원';
                    if (typeof salert === 'function') {
                        salert('success', '', `반갑습니다 ${userId} 님`, '', 'document.location.reload()');
                    } else {
                        alert(`반갑습니다 ${userId} 님`);
                        document.location.reload();
                    }
                } else {
                    if (data.errors) {
                        Object.keys(data.errors).forEach(field => {
                            showError(`login-${field}-error`, data.errors[field]);
                        });
                    } else {
                        if (typeof salert === 'function') {
                            salert('error', '', data.message || '아이디/암호를 정확히 입력해주세요');
                        } else {
                            alert(data.message || '아이디/암호를 정확히 입력해주세요');
                        }
                    }
                }
            })
            .catch(error => {
                hideLoading('login');
                if (typeof salert === 'function') {
                    salert('error', '', '오류가 발생하여 처리하지 못했습니다, 잠시후 다시 시도해주세요');
                } else {
                    alert('오류가 발생하여 처리하지 못했습니다, 잠시후 다시 시도해주세요');
                }
            });
        });
    }

    // 회원가입 폼 제출
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', function(e) {
            e.preventDefault();
            hideAllMessages();
            
            // 모든 필수 필드 검증
            const mb_id = document.getElementById('register_mb_id').value.trim();
            const mb_password = document.getElementById('register_mb_password').value.trim();
            const mb_name = document.getElementById('register_mb_name').value.trim();
            const mb_nick = document.getElementById('register_mb_nick').value.trim();
            
            let hasError = false;
            
            // 아이디 검증
            if (!mb_id) {
                showFieldMessage('register_mb_id', 'error', '아이디를 입력해주세요.');
                hasError = true;
            } else {
                const idValidation = validateId(mb_id);
                if (!idValidation.valid) {
                    showFieldMessage('register_mb_id', 'error', idValidation.message);
                    hasError = true;
                }
            }
            
            // 비밀번호 검증
            if (!mb_password) {
                showFieldMessage('register_mb_password', 'error', '비밀번호를 입력해주세요.');
                hasError = true;
            } else {
                const passwordValidation = validatePassword(mb_password);
                if (!passwordValidation.valid) {
                    showFieldMessage('register_mb_password', 'error', passwordValidation.message);
                    hasError = true;
                }
            }
            
            // 이름 검증
            if (!mb_name) {
                showFieldMessage('register_mb_name', 'error', '이름을 입력해주세요.');
                hasError = true;
            } else {
                const nameValidation = validateName(mb_name);
                if (!nameValidation.valid) {
                    showFieldMessage('register_mb_name', 'error', nameValidation.message);
                    hasError = true;
                }
            }
            
            // 닉네임 검증
            if (!mb_nick) {
                showFieldMessage('register_mb_nick', 'error', '닉네임을 입력해주세요.');
                hasError = true;
            } else {
                const nickValidation = validateNick(mb_nick);
                if (!nickValidation.valid) {
                    showFieldMessage('register_mb_nick', 'error', nickValidation.message);
                    hasError = true;
                }
            }
            
            // 비밀번호 확인 검증
            const mb_password_confirm = document.getElementById('register_mb_password_confirm').value.trim();
            if (!mb_password_confirm) {
                showFieldMessage('register_mb_password_confirm', 'error', '비밀번호 확인을 입력해주세요.');
                hasError = true;
            } else if (mb_password !== mb_password_confirm) {
                showFieldMessage('register_mb_password_confirm', 'error', '비밀번호가 일치하지 않습니다.');
                hasError = true;
            }
            
            // 이메일 검증 (선택사항이지만 입력된 경우)
            const mb_email = document.querySelector('input[name="mb_email"]').value.trim();
            if (mb_email) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(mb_email)) {
                    showFieldMessage('register_mb_email', 'error', '올바른 이메일 형식을 입력해주세요.');
                    hasError = true;
                }
            }
            
            // 검증 카운터 확인 (필수 필드 5개 모두 통과해야 함)
            if (signupValidationCount < 5) {
                if (typeof salert === 'function') {
                    salert('error', '', '가입정보를 정확히 입력해주세요');
                } else {
                    alert('가입정보를 정확히 입력해주세요');
                }
                return;
            }
            
            if (hasError) {
                if (typeof salert === 'function') {
                    salert('info', '', '정보를 정확히 입력해주세요');
                } else {
                    alert('정보를 정확히 입력해주세요');
                }
                return;
            }
            
            showLoading('signup');
            
            const formData = new FormData(this);
            formData.append('action', 'signup');
            
            fetch('/ajax/ajax_register_check.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                hideLoading('signup');
                if (data.success) {
                    if (data.auto_login) {
                        // 자동 로그인 성공
                        if (typeof salert === 'function') {
                            salert('success', '', '회원가입을 축하합니다! 자동으로 로그인되었습니다.', '', 'document.location.reload()');
                        } else {
                            alert('회원가입을 축하합니다! 자동으로 로그인되었습니다.');
                            document.location.reload();
                        }
                    } else {
                        // 일반 회원가입 성공
                        if (typeof salert === 'function') {
                            salert('success', '', '회원가입을 축하합니다', '', 'document.location.reload()');
                        } else {
                            alert('회원가입을 축하합니다');
                            document.location.reload();
                        }
                    }
                } else {
                    if (typeof salert === 'function') {
                        salert('info', '', data.message || '오류가 발생하여 처리하지 못했습니다, 잠시후 다시 시도해주세요');
                    } else {
                        alert(data.message || '오류가 발생하여 처리하지 못했습니다, 잠시후 다시 시도해주세요');
                    }
                }
            })
            .catch(error => {
                hideLoading('signup');
                if (typeof salert === 'function') {
                    salert('error', '', '오류가 발생하여 처리하지 못했습니다, 잠시후 다시 시도해주세요');
                } else {
                    alert('오류가 발생하여 처리하지 못했습니다, 잠시후 다시 시도해주세요');
                }
            });
        });
        
    }
}

// 페이지 새로고침
function refreshPage() {
    location.reload();
}

// ===== modal_functions.js 통합 =====

/**
 * 로그인 모달을 바로 표시하는 함수
 */
function open_modal_login() {
    if (loginModal || document.getElementById('login-modal-overlay')) {
        closeLoginModal();
    }
    openLoginModal('login');
}

/**
 * 회원가입 모달을 바로 표시하는 함수
 */
function open_modal_register() {
    if (loginModal || document.getElementById('login-modal-overlay')) {
        closeLoginModal();
    }
    openLoginModal('signup');
}

/**
 * 모달을 닫는 함수
 */
function close_modal() {
    closeLoginModal();
}

/**
 * 모달 상태 확인 함수
 */
function is_modal_open() {
    return loginModal !== null || document.getElementById('login-modal-overlay') !== null;
}

/**
 * 현재 모달 탭 확인 함수
 */
function get_current_modal_tab() {
    if (!loginModal && !document.getElementById('login-modal-overlay')) return null;
    
    const activeTab = document.querySelector('.tab.active');
    if (activeTab) {
        return activeTab.textContent.trim().includes('로그인') ? 'login' : 'signup';
    }
    return null;
}

/**
 * 모달 탭 전환 함수
 */
function switch_modal_tab(tab) {
    if ((loginModal || document.getElementById('login-modal-overlay')) && typeof switchTab === 'function') {
        switchTab(tab);
    }
}

/**
 * 로그인 모달로 전환
 */
function switch_to_login() {
    switch_modal_tab('login');
}

/**
 * 회원가입 모달로 전환
 */
function switch_to_register() {
    switch_modal_tab('signup');
}

/**
 * 모달에 메시지 표시 (성공/에러)
 */
function show_modal_message(type, message) {
    if (!loginModal && !document.getElementById('login-modal-overlay')) return;
    
    const messageElement = document.getElementById(type === 'success' ? 'login-success' : 'login-general-error');
    if (messageElement) {
        messageElement.innerHTML = message;
        messageElement.style.display = 'block';
        
        setTimeout(() => {
            messageElement.style.display = 'none';
        }, 3000);
    }
}

/**
 * 모달 폼 리셋
 */
function reset_modal_form() {
    if (!loginModal && !document.getElementById('login-modal-overlay')) return;
    
    const forms = document.querySelectorAll('#loginForm, #signupForm');
    forms.forEach(form => {
        if (form) {
            form.reset();
        }
    });
    
    const messages = document.querySelectorAll('.error-message, .success-message');
    messages.forEach(msg => {
        msg.style.display = 'none';
    });
    
    const checkbox = document.getElementById('auto-login-checkbox');
    if (checkbox) {
        checkbox.classList.remove('checked');
    }
}

/**
 * 모달 폼 데이터 가져오기
 */
function get_modal_form_data() {
    if (!loginModal && !document.getElementById('login-modal-overlay')) return null;
    
    const activeForm = document.querySelector('.tab-content.active form');
    if (!activeForm) return null;
    
    const formData = new FormData(activeForm);
    const data = {};
    
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }
    
    return data;
}

/**
 * 모달 폼 데이터 설정
 */
function set_modal_form_data(data) {
    if (!loginModal && !document.getElementById('login-modal-overlay')) return;
    
    const activeForm = document.querySelector('.tab-content.active form');
    if (!activeForm) return;
    
    Object.keys(data).forEach(key => {
        const input = activeForm.querySelector(`[name="${key}"]`);
        if (input) {
            input.value = data[key];
        }
    });
}

/**
 * 중복 검사 실행
 */
function check_duplicate(type, value) {
    if (typeof checkDuplicate === 'function') {
        checkDuplicate(type, value, function(data) {
            if (typeof showDuplicateResult === 'function') {
                showDuplicateResult(type === 'id' ? 'mb_id' : 'mb_nick', data);
            }
        });
    }
}

/**
 * 아이디 중복 검사 실행
 */
function check_id_duplicate() {
    const idInput = document.getElementById('register_mb_id');
    if (idInput) {
        const value = idInput.value.trim();
        if (value.length >= 3) {
            checkDuplicate('id', value, function(data) {
                showDuplicateResult('mb_id', data);
            });
        }
    }
}

/**
 * 닉네임 중복 검사 실행
 */
function check_nick_duplicate() {
    const nickInput = document.getElementById('register_mb_nick');
    if (nickInput) {
        const value = nickInput.value.trim();
        if (value.length >= 2) {
            checkDuplicate('nick', value, function(data) {
                showDuplicateResult('mb_nick', data);
            });
        }
    }
}

/**
 * 중복 검사 결과 초기화
 */
function clear_duplicate_results() {
    if (typeof clearDuplicateResults === 'function') {
        clearDuplicateResults();
    }
}

/**
 * 비밀번호 확인 실행
 */
function check_password_match() {
    if (typeof checkPasswordMatch === 'function') {
        checkPasswordMatch();
    }
}

/**
 * 입력 검증 실행 함수들
 */
function validate_id_input() {
    const idInput = document.getElementById('register_mb_id');
    if (idInput && typeof validateId === 'function') {
        const result = validateId(idInput.value.trim());
        if (typeof showValidationResult === 'function') {
            showValidationResult('register_mb_id', result);
        }
    }
}

function validate_password_input() {
    const passwordInput = document.getElementById('register_mb_password');
    if (passwordInput && typeof validatePassword === 'function') {
        const result = validatePassword(passwordInput.value.trim());
        if (typeof showValidationResult === 'function') {
            showValidationResult('register_mb_password', result);
        }
    }
}

function validate_name_input() {
    const nameInput = document.getElementById('register_mb_name');
    if (nameInput && typeof validateName === 'function') {
        const result = validateName(nameInput.value.trim());
        if (typeof showValidationResult === 'function') {
            showValidationResult('register_mb_name', result);
        }
    }
}

function validate_nick_input() {
    const nickInput = document.getElementById('register_mb_nick');
    if (nickInput && typeof validateNick === 'function') {
        const result = validateNick(nickInput.value.trim());
        if (typeof showValidationResult === 'function') {
            showValidationResult('register_mb_nick', result);
        }
    }
}

/**
 * 모달 완전 초기화
 */
function reset_modal_completely() {
    if (loginModal || document.getElementById('login-modal-overlay')) {
        closeLoginModal();
    }
    
    document.removeEventListener('keydown', handleEscapeKey);
    
    if (typeof isMobileDevice === 'function' && isMobileDevice()) {
        document.body.style.overflow = '';
    }
}

// ===== 검색 모달 기능 =====
//한글,영어 코드에 맞는 길이 가져오기
function hlen(str) {
  let length = 0;
  for (let i = 0; i < str.length; i++) {
    // 유니코드 값이 128을 초과하면(한글 등) 2를 더하고, 아니면 1을 더함
    length += (str.charCodeAt(i) > 128) ? 2 : 1;
  }
  return length;
}

// 검색 모달 열기
function openSearchModal() {
	qryString = window.location.search;
	urlParams = new URLSearchParams(qryString);

	psearch = urlParams.get('psearch');

	// 기존 검색 모달이 있으면 제거
    const existingModal = document.getElementById('search-modal-overlay');
    if (existingModal) {
        existingModal.remove();
    }
    
    // 검색 모달 HTML 생성 (로그인 모달과 같은 스타일)
    const searchModalHTML = `
        <div class="search-modal-overlay" id="search-modal-overlay">
            <div class="search-modal-container">
                <div class="search-modal-header">
                    <h3 class="search-modal-title"><i class="fa fa-search"></i> 업체검색</h3>
                    <button class="search-close-btn" onclick="closeSearchModal()">
                        <i class="fa fa-times"></i>
                    </button>
                </div>
                
                <div class="search-modal-content">
                    <form id="searchForm" class="search-form" onsubmit="javascript:doSearch(this);">
                        <div class="search-description">
                            검색하고자 하는 단어나, 업종을 입력해 주세요
                        </div>
                        <div class="form-group">
                            <input type="text" id="search-input" name="searchinput" class="form-input" placeholder="단어를 입력해주세요" value='`+psearch+`' autocomplete="off">
                        </div>
                        
                        
                        <button type="submit" class="search-submit-btn">
                            <i class="fa fa-search"></i>
                            검색
                        </button>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    // 모달을 body에 추가
    document.body.insertAdjacentHTML('beforeend', searchModalHTML);
    
    // 검색 폼 이벤트 리스너 설정
    setupSearchModalEvents();
    
    // 검색 입력창에 포커스
    setTimeout(() => {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.focus();
        }
    }, 100);
}

// 검색 모달 닫기
function closeSearchModal() {
    const searchModal = document.getElementById('search-modal-overlay');
    if (searchModal) {
        searchModal.remove();
    }
}

function doSearch() {
    const searchForm = document.getElementById('searchForm');
    const searchInput = document.getElementById('search-input');
	const searchTerm = searchInput.value.trim();

	if (hlen(searchTerm) < SEARCH_MIN_LENGTH) {
		if (typeof salert === 'function') {
			salert('info', '', '검색어는 두글자 이상 입력해주세요');
		} else {
			alert('검색어는 두글자 이상 입력해주세요');
		}
		searchInput.focus();
		return false;
	}
	
	// 검색 실행
	executeSearch(searchTerm, 'all');
}

// 검색 모달 이벤트 설정
function setupSearchModalEvents() {
    const searchForm = document.getElementById('searchForm');
    const searchInput = document.getElementById('search-input');
    
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
          	const searchTerm = searchInput.value.trim();

          	if (hlen(searchTerm) < SEARCH_MIN_LENGTH) {
          		if (typeof salert === 'function') {
          			salert('info', '', '검색어는 두글자 이상 입력해주세요');
          		} else {
          			alert('검색어는 두글자 이상 입력해주세요');
          		}
          		searchInput.focus();
          		return false;
          	}
	
          	// 검색 실행
          	executeSearch(searchTerm, 'all');
        });
    }
    
    // ESC 키로 모달 닫기
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeSearchModal();
        }
    });
    
    // 오버레이 클릭으로 모달 닫기
    const overlay = document.getElementById('search-modal-overlay');
    if (overlay) {
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                closeSearchModal();
            }
        });
    }
}

// 검색 실행
function executeSearch(searchTerm, searchType) {

    let searchUrl = '/?psearch=' + encodeURIComponent(searchTerm);
    
    // 검색 모달 닫기
    closeSearchModal();
    
    // 검색 페이지로 이동
    window.location.href = searchUrl;
}

// 비밀댓글 모달 관련 함수들
function openSecretCommentModal(commentId) {
    console.log('openSecretCommentModal 호출됨, commentId:', commentId);
    
    // 기존 모달이 있으면 제거
    const existingModal = document.getElementById('secret-comment-modal-overlay');
    if (existingModal) {
        existingModal.remove();
    }
    
    // 비밀댓글 모달 HTML 생성
    const secretModalHTML = `
        <div class="secret-comment-modal-overlay" id="secret-comment-modal-overlay">
            <div class="secret-comment-modal-container">
                <input type="hidden" id="secret-comment-id" value="${commentId}">
                <div class="secret-comment-modal-header">
                    <h3 class="secret-comment-modal-title">
                        <i class="fa fa-lock"></i> 비밀댓글 확인
                    </h3>
                    <button class="secret-comment-close-btn" onclick="closeSecretCommentModal()">
                        <i class="fa fa-times"></i>
                    </button>
                </div>
                
                <div class="secret-comment-form-group">
                    <label class="secret-comment-form-label">비밀번호</label>
                    <input type="password" id="secret-password" class="secret-comment-form-input" placeholder="비밀번호를 입력하세요">
                </div>
                
                <div class="secret-comment-button-group">
                    <button onclick="checkSecretPassword()" class="secret-comment-btn confirm">
                        <i class="fa fa-check"></i> 확인
                    </button>
                    <button onclick="closeSecretCommentModal()" class="secret-comment-btn cancel">
                        <i class="fa fa-times"></i> 취소
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // 모달을 body에 추가
    document.body.insertAdjacentHTML('beforeend', secretModalHTML);
    
    // 모달 표시
    const modal = document.getElementById('secret-comment-modal-overlay');
    modal.style.display = 'block';
    
    // 비밀번호 입력창에 포커스
    setTimeout(() => {
        const passwordInput = document.getElementById('secret-password');
        if (passwordInput) {
            passwordInput.focus();
        }
    }, 100);
    
    // ESC 키 이벤트 리스너 추가
    document.addEventListener('keydown', handleSecretModalEscape);
    
    // 비밀번호 입력 필드 이벤트 리스너 추가
    const passwordInput = document.getElementById('secret-password');
    if (passwordInput) {
        passwordInput.addEventListener('keypress', handleSecretPasswordEnter);
        passwordInput.addEventListener('focus', handleSecretPasswordFocus);
        passwordInput.addEventListener('blur', handleSecretPasswordBlur);
    }
}

function closeSecretCommentModal() {
    const modal = document.getElementById('secret-comment-modal-overlay');
    if (modal) {
        modal.style.display = 'none';
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
    
    // 이벤트 리스너 제거
    document.removeEventListener('keydown', handleSecretModalEscape);
}

function checkSecretPassword() {
    console.log('checkSecretPassword 호출됨');
    const commentId = document.getElementById('secret-comment-id').value;
    console.log('hidden input에서 가져온 commentId:', commentId);
    
    if (!commentId) {
        console.log('commentId가 없음');
        if (typeof salert === 'function') {
            salert('error', '', '댓글 정보를 찾을 수 없습니다. 다시 시도해주세요.');
        } else {
            alert('댓글 정보를 찾을 수 없습니다. 다시 시도해주세요.');
        }
        closeSecretCommentModal();
        return;
    }
    
    const password = document.getElementById('secret-password').value.trim();
    console.log('입력된 비밀번호:', password);
    
    if (!password) {
        if (typeof salert === 'function') {
            salert('info', '', '비밀번호를 입력해주세요');
        } else {
            alert('비밀번호를 입력해주세요');
        }
        document.getElementById('secret-password').focus();
        return;
    }
    
    console.log('AJAX 요청 시작');
    
    // AJAX 요청
    fetch('/ajax/ajax_check_secret.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `comment_id=${encodeURIComponent(commentId)}&password=${encodeURIComponent(password)}`
    })
    .then(response => response.json())
    .then(data => {
        console.log('AJAX 응답:', data);
        if (data.success) {
            // 비밀번호가 맞으면 댓글 내용 표시
            const commentElement = document.querySelector(`.s_cmt[onclick*="${commentId}"]`);
            if (commentElement && commentElement.parentNode) {
                commentElement.parentNode.innerHTML = data.content;
            }
            closeSecretCommentModal();
        } else {
            // 비밀번호가 틀리면 에러 메시지
            if (typeof salert === 'function') {
                salert('error', '', data.message || '비밀번호가 잘못되었습니다, 정확히 입력해주세요');
            } else {
                alert(data.message || '비밀번호가 잘못되었습니다, 정확히 입력해주세요');
            }
            document.getElementById('secret-password').value = '';
            document.getElementById('secret-password').focus();
        }
    })
    .catch(error => {
        console.log('AJAX 오류:', error);
        if (typeof salert === 'function') {
            salert('error', '', '댓글 확인 중 오류가 발생했습니다.');
        } else {
            alert('댓글 확인 중 오류가 발생했습니다.');
        }
    });
}

// 비밀댓글 모달 이벤트 핸들러들
function handleSecretModalEscape(e) {
    if (e.key === 'Escape') {
        closeSecretCommentModal();
    }
}

function handleSecretPasswordEnter(e) {
    if (e.key === 'Enter') {
        checkSecretPassword();
    }
}

function handleSecretPasswordFocus(e) {
    e.target.style.borderColor = 'var(--group_color_61)';
}

function handleSecretPasswordBlur(e) {
    e.target.style.borderColor = '#444';
}

// 전역 함수로 등록 (기존 코드와의 호환성을 위해)
window.openSecretCommentModal = openSecretCommentModal;
window.closeSecretCommentModal = closeSecretCommentModal;
window.checkSecretPassword = checkSecretPassword;

// 댓글 삭제 함수
function comment_delete(proctype, bo_table, wr_id, token, mb_id)
{
	var strtext = '';
	if (proctype == 'd') {
		strtext = '해당 댓글을 삭제하시겠습니까?';
	} else {
		strtext = '해당 댓글삭제 및 회원강퇴처리 하시겠습니까?';
	}
	
	swal.fire({
		title: "",
		text: strtext,
		icon: "warning",
		showCancelButton: true,
		confirmButtonText: "예",
		cancelButtonText: "아니오",
		closeOnConfirm: false
	}).then((result) => {
		if (result.isConfirmed) {
			showloading();
			$.ajax({
				url:'/ajax/ajax_reply_reject.php',
				type: 'POST',
				data: 'proctype='+proctype+'&bo_table='+bo_table+'&wr_id='+wr_id+'&mb_id='+(mb_id || ''),
				cache:false,
				dataType: "json",
				timeout: 1000 * 60 * 5,
				success:  function(result){
					hideloading();
					swal.closeModal();
					
					if (result && typeof result.success !== 'undefined' && typeof result.msg !== 'undefined') {
						var alertType = result.success ? 'success' : 'error';
						salert(alertType, '', result.msg);
						
						if (result.success) {
							// 성공 시 댓글 요소 제거
							$("#c_"+wr_id).remove();
							$("#edit_"+wr_id).remove();
							$("#reply_"+wr_id).remove();
							$("#secret_comment_"+wr_id).remove();
							$("#save_comment_"+wr_id).remove();
/*							
							// 페이지 새로고침 또는 댓글 목록 갱신
							if(typeof apms_page == 'function') {
								var comment_url = './view_comment.page.php?bo_table='+bo_table+'&wr_id='+(typeof wr_id !== 'undefined' ? wr_id : '')+'&crows='+(typeof crows !== 'undefined' ? crows : '');
								apms_page('viewcomment', comment_url);
							} else {
								location.reload();
							}
*/							
						}
					} else {
						salert('error', '', '오류가 발생하여 처리하지 못했습니다');
					}
					return false;
				},
				error: function(xhr, status, error){
					hideloading();
					swal.closeModal();
					
					// JSON 파싱 에러인 경우 응답 텍스트 확인
					try {
						var response = xhr.responseText;
						if (response) {
							var parsed = JSON.parse(response);
							if (parsed && typeof parsed.success !== 'undefined' && typeof parsed.msg !== 'undefined') {
								var alertType = parsed.success ? 'success' : 'error';
								salert(alertType, '', parsed.msg);
								if (parsed.success) {
									$("#c_"+wr_id).remove();
									$("#edit_"+wr_id).remove();
									$("#reply_"+wr_id).remove();
									$("#secret_comment_"+wr_id).remove();
									$("#save_comment_"+wr_id).remove();
									if(typeof apms_page == 'function') {
										var comment_url = './view_comment.page.php?bo_table='+bo_table+'&wr_id='+(typeof wr_id !== 'undefined' ? wr_id : '')+'&crows='+(typeof crows !== 'undefined' ? crows : '');
										apms_page('viewcomment', comment_url);
									} else {
										location.reload();
									}
								}
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

// 전역 함수로 등록
window.comment_delete = comment_delete;