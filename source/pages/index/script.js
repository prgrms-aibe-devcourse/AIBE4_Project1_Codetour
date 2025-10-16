const translations = {
  ko: {
    nav: {
      home: "홈",
      content: "콘텐츠별 여행지",
      ai: "AI 코스 추천",
      region: "K-콘텐츠 여행 지도",
      routes: "인기 여행 루트",
      mypage: "마이페이지",
    },
    btn: { login: "로그인", signup: "회원가입" },
    hero: {
      title: "한류 콘텐츠와 함께하는<br>특별한 여행",
      subtitle: "좋아하는 드라마, K-pop, 영화의 촬영지를 직접 방문해보세요",
      cta: "시작하기",
    },
    popular: {
      title: "인기 콘텐츠",
      subtitle: "국내외 팬들이 가장 많이 찾는 한류 콘텐츠를 만나보세요",
    },
    recommended: {
      title: "추천 여행 코스",
      subtitle: "취향과 가까운 테마별 코스를 추천",
    },
    personalized: {
      title: "사용자 맞춤 추천",
      subtitle: "내 취향 맞춤 코스",
      loginRequired: "로그인이 필요합니다",
      loginMessage: "맞춤 여행 추천을 받으시려면 로그인해주세요",
    },
    footer: {
      tagline: "한류 콘텐츠와 함께하는 특별한 여행",
      service: "서비스",
      contentTravel: "콘텐츠별 여행지",
      regionExplore: "지역별 탐색",
      popularRoutes: "인기 루트",
      support: "고객지원",
      faq: "FAQ",
      contact: "문의하기",
      terms: "이용약관",
      social: "소셜미디어",
    },
    card: {
      reviews: "리뷰",
      days: "일",
      badge: {
        drama: "드라마",
        movie: "영화",
        popular: "인기",
        recommended: "추천",
        special: "특가",
      },
    },
  },
  en: {
    nav: {
      home: "Home",
      content: "By Content",
      ai: "AI Course Picks",
      region: "By Region",
      routes: "Popular Routes",
      mypage: "My Page",
    },
    btn: { login: "Login", signup: "Sign Up" },
    hero: {
      title: "Special Travel<br>with K-Content",
      subtitle:
        "Visit the filming locations of your favorite K-dramas, K-pop, and movies",
      cta: "Get Started",
    },
    popular: {
      title: "Popular Content",
      subtitle:
        "Discover the most visited K-content locations by fans worldwide",
    },
    recommended: {
      title: "Recommended Routes",
      subtitle: "Curated themed courses to match your preferences",
    },
    personalized: {
      title: "Personalized Recommendations",
      subtitle: "Courses tailored to your taste",
      loginRequired: "Login Required",
      loginMessage:
        "Please log in to receive personalized travel recommendations",
    },
    footer: {
      tagline: "Special travel with K-content",
      service: "Service",
      contentTravel: "Content Locations",
      regionExplore: "Explore Regions",
      popularRoutes: "Popular Routes",
      support: "Support",
      faq: "FAQ",
      contact: "Contact Us",
      terms: "Terms of Service",
      social: "Social Media",
    },
    card: {
      reviews: "reviews",
      days: "days",
      badge: {
        drama: "Drama",
        movie: "Movie",
        popular: "Popular",
        recommended: "Recommended",
        special: "Special",
      },
    },
  },
  ja: {
    nav: {
      home: "ホーム",
      content: "コンテンツ別旅行地",
      ai: "AIコース推薦",
      region: "地域別探索",
      routes: "人気旅行ルート",
      mypage: "マイページ",
    },
    btn: { login: "ログイン", signup: "会員登録" },
    hero: {
      title: "韓流コンテンツと一緒に<br>特別な旅行",
      subtitle: "好きなドラマ、K-pop、映画の撮影地を直接訪問してみてください",
      cta: "スタート",
    },
    popular: {
      title: "人気コンテンツ",
      subtitle: "国内外のファンが最も多く訪れる韓流コンテンツをご覧ください",
    },
    recommended: {
      title: "おすすめ旅行コース",
      subtitle: "好みに近いテーマ別コースを推薦",
    },
    personalized: {
      title: "ユーザーカスタマイズ推薦",
      subtitle: "私の好みに合わせたコース",
      loginRequired: "ログインが必要です",
      loginMessage: "カスタマイズ旅行推薦を受けるにはログインしてください",
    },
    footer: {
      tagline: "韓流コンテンツと一緒に特別な旅行",
      service: "サービス",
      contentTravel: "コンテンツ別旅行地",
      regionExplore: "地域別探索",
      popularRoutes: "人気ルート",
      support: "カスタマーサポート",
      faq: "FAQ",
      contact: "お問い合わせ",
      terms: "利用規約",
      social: "ソーシャルメディア",
    },
    card: {
      reviews: "レビュー",
      days: "日",
      badge: {
        drama: "ドラマ",
        movie: "映画",
        popular: "人気",
        recommended: "おすすめ",
        special: "特価",
      },
    },
  },
};

const popularContents = [
  {
    id: 1,
    title: { ko: "도깨비", en: "Goblin", ja: "トッケビ" },
    location: {
      ko: "인천 송도, 강릉",
      en: "Incheon Songdo, Gangneung",
      ja: "仁川松島、江陵",
    },
    rating: 4.9,
    reviews: 2847,
    badge: "drama",
    image:
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop",
  },
  {
    id: 2,
    title: {
      ko: "사랑의 불시착",
      en: "Crash Landing on You",
      ja: "愛の不時着",
    },
    location: {
      ko: "스위스, 평창",
      en: "Switzerland, Pyeongchang",
      ja: "スイス、平昌",
    },
    rating: 4.8,
    reviews: 3521,
    badge: "drama",
    image:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop",
  },
  {
    id: 3,
    title: { ko: "기생충", en: "Parasite", ja: "パラサイト" },
    location: {
      ko: "서울 광진구",
      en: "Gwangjin-gu, Seoul",
      ja: "ソウル広津区",
    },
    rating: 4.9,
    reviews: 1823,
    badge: "movie",
    image:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop",
  },
  {
    id: 4,
    title: { ko: "이태원 클라쓰", en: "Itaewon Class", ja: "梨泰院クラス" },
    location: { ko: "서울 이태원", en: "Itaewon, Seoul", ja: "ソウル梨泰院" },
    rating: 4.7,
    reviews: 2156,
    badge: "drama",
    image:
      "https://images.unsplash.com/photo-1555992336-fb0d29498b13?w=400&h=300&fit=crop",
  },
  {
    id: 5,
    title: { ko: "오징어 게임", en: "Squid Game", ja: "イカゲーム" },
    location: {
      ko: "서울 강북구, 대부도",
      en: "Gangbuk-gu Seoul, Daebudo",
      ja: "ソウル江北区、大阜島",
    },
    rating: 4.8,
    reviews: 4283,
    badge: "drama",
    image:
      "https://images.unsplash.com/photo-1579621970795-87facc2f976d?w=400&h=300&fit=crop",
  },
  {
    id: 6,
    title: { ko: "부산행", en: "Train to Busan", ja: "新感染" },
    location: {
      ko: "대전역, 동대구역",
      en: "Daejeon Station, Dongdaegu Station",
      ja: "大田駅、東大邱駅",
    },
    rating: 4.9,
    reviews: 3892,
    badge: "movie",
    image:
      "https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=400&h=300&fit=crop",
  },
  {
    id: 7,
    title: { ko: "나의 아저씨", en: "My Mister", ja: "私のおじさん" },
    location: {
      ko: "서울 종로구, 광화문",
      en: "Jongno-gu, Gwanghwamun",
      ja: "ソウル鍾路区、光化門",
    },
    rating: 4.9,
    reviews: 2647,
    badge: "drama",
    image:
      "https://images.unsplash.com/photo-1551622657-7a90d37c89fa?w=400&h=300&fit=crop",
  },
  {
    id: 8,
    title: {
      ko: "스물다섯 스물하나",
      en: "Twenty-Five Twenty-One",
      ja: "二十五、二十一",
    },
    location: {
      ko: "서울 강남구, 서초구",
      en: "Gangnam-gu, Seocho-gu",
      ja: "ソウル江南区、瑞草区",
    },
    rating: 4.7,
    reviews: 1985,
    badge: "drama",
    image:
      "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400&h=300&fit=crop",
  },
];

const recommendedCourses = [
  {
    id: 1,
    title: {
      ko: "서울 드라마 투어 1박 2일",
      en: "Seoul Drama Tour 2 Days",
      ja: "ソウルドラマツアー1泊2日",
    },
    subtitle: {
      ko: "도깨비, 이태원 클라쓰 등 명작의 흔적을",
      en: "Traces of masterpieces like Goblin, Itaewon Class",
      ja: "トッケビ、梨泰院クラスなどの名作の跡を",
    },
    days: "2",
    price: "$150",
    duration: "6-8 hours",
    badge: "popular",
    image:
      "https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=400&h=300&fit=crop",
  },
  {
    id: 2,
    title: {
      ko: "제주도 로맨스 코스",
      en: "Jeju Island Romance Course",
      ja: "済州島ロマンスコース",
    },
    subtitle: {
      ko: "서귀포 일대, 우도 외 5곳",
      en: "Seogwipo area, Udo and 5 more places",
      ja: "西帰浦一帯、牛島外5ヶ所",
    },
    days: "3",
    price: "$345",
    duration: "10+ hours",
    badge: "recommended",
    image:
      "https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=400&h=300&fit=crop",
  },
  {
    id: 3,
    title: {
      ko: "부산 영화 속 여행",
      en: "Busan Movie Tour",
      ja: "釜山映画の旅",
    },
    subtitle: {
      ko: "범죄도시, 마약왕과 함께",
      en: "With The Outlaws, The Drug King",
      ja: "犯罪都市、麻薬王と共に",
    },
    days: "2",
    price: "$280",
    duration: "6-8 hours",
    badge: "special",
    image:
      "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=300&fit=crop",
  },
  {
    id: 4,
    title: {
      ko: "강릉 감성 여행",
      en: "Gangneung Emotional Tour",
      ja: "江陵感性旅行",
    },
    subtitle: {
      ko: "도깨비 메밀밭과 해변",
      en: "Goblin buckwheat field and beach",
      ja: "トッケビそば畑と海辺",
    },
    days: "1",
    price: "$120",
    duration: "4-6 hours",
    badge: "popular",
    image:
      "https://images.unsplash.com/photo-1528127269322-539801943592?w=400&h=300&fit=crop",
  },
  {
    id: 5,
    title: {
      ko: "경주 역사 드라마 투어",
      en: "Gyeongju Historical Drama Tour",
      ja: "慶州歴史ドラマツアー",
    },
    subtitle: {
      ko: "선덕여왕, 화랑 촬영지",
      en: "Queen Seondeok, Hwarang locations",
      ja: "善徳女王、花郎撮影地",
    },
    days: "2",
    price: "$195",
    duration: "8-10 hours",
    badge: "recommended",
    image:
      "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=400&h=300&fit=crop",
  },
  {
    id: 6,
    title: {
      ko: "평창 겨울 드라마 코스",
      en: "Pyeongchang Winter Drama Course",
      ja: "平昌冬ドラマコース",
    },
    subtitle: {
      ko: "사랑의 불시착 명장면 속으로",
      en: "Into famous scenes of CLOY",
      ja: "愛の不時着名場面の中へ",
    },
    days: "2",
    price: "$310",
    duration: "6-8 hours",
    badge: "special",
    image:
      "https://images.unsplash.com/photo-1548273572-89c91eec3cab?w=400&h=300&fit=crop",
  },
  {
    id: 7,
    title: {
      ko: "인천 송도 모던 투어",
      en: "Incheon Songdo Modern Tour",
      ja: "仁川松島モダンツアー",
    },
    subtitle: {
      ko: "도깨비 랜드마크 완전 정복",
      en: "Complete conquest of Goblin landmarks",
      ja: "トッケビランドマーク完全征服",
    },
    days: "1",
    price: "$95",
    duration: "4-5 hours",
    badge: "popular",
    image:
      "https://images.unsplash.com/photo-1535639818669-c059d2f038e6?w=400&h=300&fit=crop",
  },
];

let currentLang = localStorage.getItem("preferredLang") || "ko";

document.addEventListener("DOMContentLoaded", function () {
  renderPopularContent();
  renderRecommendedCourses();
  renderPersonalizedCourses();
  setupEventListeners();
  setupCarouselDots();
});

function renderPopularContent() {
  const grid = document.getElementById("popularContent");
  grid.innerHTML = "";
  popularContents.forEach((content) =>
    grid.appendChild(createContentCard(content))
  );
}

function renderRecommendedCourses() {
  const grid = document.getElementById("recommendedCourses");
  grid.innerHTML = "";
  recommendedCourses.forEach((course) =>
    grid.appendChild(createCourseCard(course))
  );
}

function renderPersonalizedCourses() {
  const grid = document.getElementById("personalizedCourses");
  grid.innerHTML = "";
  recommendedCourses.forEach((course) =>
    grid.appendChild(createCourseCard(course))
  );
}

function createContentCard(data) {
  const card = document.createElement("div");
  card.className = "card";
  const badgeClass = "";
  card.innerHTML = `<span class="card-badge ${badgeClass}">${
    translations[currentLang].card.badge[data.badge]
  }</span><img src="${data.image}" alt="${
    data.title[currentLang]
  }" class="card-image"><div class="card-content"><h4 class="card-title">${
    data.title[currentLang]
  }</h4><p class="card-subtitle">📍 ${
    data.location[currentLang]
  }</p><div class="card-meta"><span class="card-rating">⭐ ${
    data.rating
  }</span><span>${data.reviews.toLocaleString()} ${
    translations[currentLang].card.reviews
  }</span></div></div>`;
  return card;
}

function createCourseCard(data) {
  const card = document.createElement("div");
  card.className = "card";
  let badgeClass = "";
  card.innerHTML = `<span class="card-badge ${badgeClass}">${
    translations[currentLang].card.badge[data.badge]
  }</span><img src="${data.image}" alt="${
    data.title[currentLang]
  }" class="card-image"><div class="card-content"><h4 class="card-title">${
    data.title[currentLang]
  }</h4><p class="card-subtitle">${
    data.subtitle[currentLang]
  }</p><div class="card-meta"><span>📅 ${data.days}${
    translations[currentLang].card.days
  }</span><span>💰 ${data.price}</span><span>⏱️ ${
    data.duration
  }</span></div></div>`;
  return card;
}

// 캐러셀 스크롤 함수
function scrollCarousel(carouselId, direction) {
  const carousel = document.getElementById(carouselId);
  const scrollAmount = 360; // 카드 너비 + 갭
  const targetScroll = carousel.scrollLeft + scrollAmount * direction;
  carousel.scrollTo({
    left: targetScroll,
    behavior: "smooth",
  });
}

// 캐러셀 도트 설정
function setupCarouselDots() {
  const carousels = [
    {
      id: "popularContent",
      dotsId: "popularContentDots",
      itemCount: popularContents.length,
    },
    {
      id: "recommendedCourses",
      dotsId: "recommendedCoursesDots",
      itemCount: recommendedCourses.length,
    },
    {
      id: "personalizedCourses",
      dotsId: "personalizedCoursesDots",
      itemCount: recommendedCourses.length,
    },
  ];

  carousels.forEach(({ id, dotsId, itemCount }) => {
    const carousel = document.getElementById(id);
    const dotsContainer = document.getElementById(dotsId);

    // 도트 개수 계산 (보통 3개씩 보이므로)
    const visibleCards = 3;
    const dotCount = Math.ceil(itemCount / visibleCards);

    // 도트 생성
    dotsContainer.innerHTML = "";
    for (let i = 0; i < dotCount; i++) {
      const dot = document.createElement("button");
      dot.className = "carousel-dot";
      if (i === 0) dot.classList.add("active");
      dot.addEventListener("click", () => {
        const scrollAmount = carousel.scrollWidth / dotCount;
        carousel.scrollTo({
          left: scrollAmount * i,
          behavior: "smooth",
        });
      });
      dotsContainer.appendChild(dot);
    }

    // 스크롤 이벤트로 활성 도트 업데이트
    carousel.addEventListener("scroll", () => {
      const scrollPercentage =
        carousel.scrollLeft / (carousel.scrollWidth - carousel.clientWidth);
      const activeDotIndex = Math.round(scrollPercentage * (dotCount - 1));

      dotsContainer.querySelectorAll(".carousel-dot").forEach((dot, index) => {
        if (index === activeDotIndex) {
          dot.classList.add("active");
        } else {
          dot.classList.remove("active");
        }
      });
    });
  });
}

function setupEventListeners() {
  document
    .querySelector(".btn-hero")
    .addEventListener("click", () =>
      document.querySelector("#content").scrollIntoView({ behavior: "smooth" })
    );
}
