const translations = {
    ko: {
        nav: { home: '홈', content: '콘텐츠별 여행지', region: '지역별 탐색', routes: '인기 여행 루트', mypage: '마이페이지' },
        btn: { login: '로그인', signup: '회원가입' },
        hero: { title: '한류 콘텐츠와 함께하는<br>특별한 여행', subtitle: '좋아하는 드라마, K-pop, 영화의 촬영지를 직접 방문해보세요', cta: '시작하기' },
        popular: { title: '인기 콘텐츠', subtitle: '국내외 팬들이 가장 많이 찾는 한류 콘텐츠를 만나보세요' },
        recommended: { title: '추천 여행 코스', subtitle: '취향과 가까운 테마별 코스를 추천' },
        personalized: { title: '사용자 맞춤 추천', subtitle: '내 취향 맞춤 코스', loginRequired: '로그인이 필요합니다', loginMessage: '맞춤 여행 추천을 받으시려면 로그인해주세요' },
        footer: { tagline: '한류 콘텐츠와 함께하는 특별한 여행', service: '서비스', contentTravel: '콘텐츠별 여행지', regionExplore: '지역별 탐색', popularRoutes: '인기 루트', support: '고객지원', faq: 'FAQ', contact: '문의하기', terms: '이용약관', social: '소셜미디어' },
        card: { reviews: '리뷰', days: '일', badge: { drama: '드라마', movie: '영화', popular: '인기', recommended: '추천', special: '특가' } }
    },
    en: {
        nav: { home: 'Home', content: 'Content Locations', region: 'Explore Regions', routes: 'Popular Routes', mypage: 'My Page' },
        btn: { login: 'Login', signup: 'Sign Up' },
        hero: { title: 'Special Travel<br>with K-Content', subtitle: 'Visit the filming locations of your favorite K-dramas, K-pop, and movies', cta: 'Get Started' },
        popular: { title: 'Popular Content', subtitle: 'Discover the most visited K-content locations by fans worldwide' },
        recommended: { title: 'Recommended Routes', subtitle: 'Curated themed courses to match your preferences' },
        personalized: { title: 'Personalized Recommendations', subtitle: 'Courses tailored to your taste', loginRequired: 'Login Required', loginMessage: 'Please log in to receive personalized travel recommendations' },
        footer: { tagline: 'Special travel with K-content', service: 'Service', contentTravel: 'Content Locations', regionExplore: 'Explore Regions', popularRoutes: 'Popular Routes', support: 'Support', faq: 'FAQ', contact: 'Contact Us', terms: 'Terms of Service', social: 'Social Media' },
        card: { reviews: 'reviews', days: 'days', badge: { drama: 'Drama', movie: 'Movie', popular: 'Popular', recommended: 'Recommended', special: 'Special' } }
    },
    ja: {
        nav: { home: 'ホーム', content: 'コンテンツ別旅行地', region: '地域別探索', routes: '人気旅行ルート', mypage: 'マイページ' },
        btn: { login: 'ログイン', signup: '会員登録' },
        hero: { title: '韓流コンテンツと一緒に<br>特別な旅行', subtitle: '好きなドラマ、K-pop、映画の撮影地を直接訪問してみてください', cta: 'スタート' },
        popular: { title: '人気コンテンツ', subtitle: '国内外のファンが最も多く訪れる韓流コンテンツをご覧ください' },
        recommended: { title: 'おすすめ旅行コース', subtitle: '好みに近いテーマ別コースを推薦' },
        personalized: { title: 'ユーザーカスタマイズ推薦', subtitle: '私の好みに合わせたコース', loginRequired: 'ログインが必要です', loginMessage: 'カスタマイズ旅行推薦を受けるにはログインしてください' },
        footer: { tagline: '韓流コンテンツと一緒に特別な旅行', service: 'サービス', contentTravel: 'コンテンツ別旅行地', regionExplore: '地域別探索', popularRoutes: '人気ルート', support: 'カスタマーサポート', faq: 'FAQ', contact: 'お問い合わせ', terms: '利用規約', social: 'ソーシャルメディア' },
        card: { reviews: 'レビュー', days: '日', badge: { drama: 'ドラマ', movie: '映画', popular: '人気', recommended: 'おすすめ', special: '特価' } }
    }
};

const popularContents = [
    { id: 1, title: { ko: '도깨비', en: 'Goblin', ja: 'トッケビ' }, location: { ko: '인천 송도, 강릉', en: 'Incheon Songdo, Gangneung', ja: '仁川松島、江陵' }, rating: 4.9, reviews: 2847, badge: 'drama', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop' },
    { id: 2, title: { ko: '사랑의 불시착', en: 'Crash Landing on You', ja: '愛の不時着' }, location: { ko: '스위스, 평창', en: 'Switzerland, Pyeongchang', ja: 'スイス、平昌' }, rating: 4.8, reviews: 3521, badge: 'drama', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop' },
    { id: 3, title: { ko: '기생충', en: 'Parasite', ja: 'パラサイト' }, location: { ko: '서울 광진구', en: 'Gwangjin-gu, Seoul', ja: 'ソウル広津区' }, rating: 4.9, reviews: 1823, badge: 'movie', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop' }
];

const recommendedCourses = [
    { id: 1, title: { ko: '서울 드라마 투어 1박 2일', en: 'Seoul Drama Tour 2 Days', ja: 'ソウルドラマツアー1泊2日' }, subtitle: { ko: '도깨비, 이태원 클라쓰 등 명작의 흔적을', en: 'Traces of masterpieces like Goblin, Itaewon Class', ja: 'トッケビ、梨泰院クラスなどの名作の跡を' }, days: '2', price: '$150', duration: '6-8 hours', badge: 'popular', image: 'https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=400&h=300&fit=crop' },
    { id: 2, title: { ko: '제주도 로맨스 코스', en: 'Jeju Island Romance Course', ja: '済州島ロマンスコース' }, subtitle: { ko: '서귀포 일대, 우도 외 5곳', en: 'Seogwipo area, Udo and 5 more places', ja: '西帰浦一帯、牛島外5ヶ所' }, days: '3', price: '$345', duration: '10+ hours', badge: 'recommended', image: 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=400&h=300&fit=crop' },
    { id: 3, title: { ko: '부산 영화 속 여행', en: 'Busan Movie Tour', ja: '釜山映画の旅' }, subtitle: { ko: '범죄도시, 마약왕과 함께', en: 'With The Outlaws, The Drug King', ja: '犯罪都市、麻薬王と共に' }, days: '2', price: '$280', duration: '6-8 hours', badge: 'special', image: 'https://images.unsplash.com/photo-1529014576110-d5c8a2c0de9c?w=400&h=300&fit=crop' }
];

let currentLang = 'ko';

document.addEventListener('DOMContentLoaded', function() {
    updateLanguage(currentLang);
    renderPopularContent();
    renderRecommendedCourses();
    renderPersonalizedCourses();
    setupEventListeners();
});

function updateLanguage(lang) {
    currentLang = lang;
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const keys = element.getAttribute('data-i18n').split('.');
        let value = translations[lang];
        keys.forEach(k => { value = value[k]; });
        if (value) element.innerHTML = value;
    });
    renderPopularContent();
    renderRecommendedCourses();
    renderPersonalizedCourses();
}

function renderPopularContent() {
    const grid = document.getElementById('popularContent');
    grid.innerHTML = '';
    popularContents.forEach(content => grid.appendChild(createContentCard(content)));
}

function renderRecommendedCourses() {
    const grid = document.getElementById('recommendedCourses');
    grid.innerHTML = '';
    recommendedCourses.forEach(course => grid.appendChild(createCourseCard(course)));
}

function renderPersonalizedCourses() {
    const grid = document.getElementById('personalizedCourses');
    grid.innerHTML = '';
    recommendedCourses.forEach(course => grid.appendChild(createCourseCard(course)));
}

function createContentCard(data) {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
        <span class="card-badge">${translations[currentLang].card.badge[data.badge]}</span>
        <img src="${data.image}" alt="${data.title[currentLang]}" class="card-image">
        <div class="card-content">
            <h4 class="card-title">${data.title[currentLang]}</h4>
            <p class="card-subtitle">📍 ${data.location[currentLang]}</p>
            <div class="card-meta">
                <span class="card-rating">⭐ ${data.rating}</span>
                <span>${data.reviews.toLocaleString()} ${translations[currentLang].card.reviews}</span>
            </div>
        </div>
    `;
    return card;
}

function createCourseCard(data) {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
        <span class="card-badge">${translations[currentLang].card.badge[data.badge]}</span>
        <img src="${data.image}" alt="${data.title[currentLang]}" class="card-image">
        <div class="card-content">
            <h4 class="card-title">${data.title[currentLang]}</h4>
            <p class="card-subtitle">${data.subtitle[currentLang]}</p>
            <div class="card-meta">
                <span>📅 ${data.days}${translations[currentLang].card.days}</span>
                <span>💰 ${data.price}</span>
                <span>⏱️ ${data.duration}</span>
            </div>
        </div>
    `;
    return card;
}

function setupEventListeners() {
    document.getElementById('languageSelector').addEventListener('change', (e) => updateLanguage(e.target.value));
    document.querySelector('.btn-hero').addEventListener('click', () => document.querySelector('#content').scrollIntoView({ behavior: 'smooth' }));
    document.querySelectorAll('.btn-login, .btn-login-large').forEach(btn => btn.addEventListener('click', () => alert(translations[currentLang].btn.login)));
    document.querySelector('.btn-signup').addEventListener('click', () => alert(translations[currentLang].btn.signup));
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.getAttribute('href');
            if (target.startsWith('#')) {
                const element = document.querySelector(target);
                if (element) element.scrollIntoView({ behavior: 'smooth' });
            }
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });
}



















