import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 추천 일정 생성을 위한 시스템/사용자 프롬프트 템플릿
function buildPrompt(body) {
  const {
    places = [],
    startDate = '',
    endDate = '',
    transport = '',
    budgetPerPerson = 0,
    party = { adults: 1, kids: 0, notes: '' },
    placeMeta = []
  } = body;

  return {
    system: `
당신은 서울 로컬 여행 플래너입니다.
- 사용자의 선호 장소 목록과 날짜, 이동수단, 예산, 동행자 정보를 보고 현실적이고 동선이 좋은 일정만 제안합니다.
- 결과는 반드시 JSON으로만 출력하세요(설명 텍스트 금지).
- 통화 단위는 KRW, 시간대는 Asia/Seoul로 가정합니다.
- 대중교통/도보 동선을 우선 고려하고, 이동시간을 30~45분 이내로 설계하세요.
- 음식점은 가능한 사용자 장소 주변에서 추천하세요.
- 예산은 1인 기준 총액을 참고해 식사/입장료/교통/기타로 대략 분배하세요.
JSON 스키마:
{
  "summary": "한 줄 요약",
  "dateRange": {"start":"YYYY-MM-DD","end":"YYYY-MM-DD","nights": number},
  "days": [
    {
      "date": "YYYY-MM-DD",
      "title": "테마",
      "blocks": [
        {"time":"HH:mm","name":"장소/활동","why":"선정 이유","tip":"현지 팁","cost": "예상비용(원)"},
        ...
      ],
      "meals": {
        "lunch": {"name":"식당명","near":"가까운 장소","menu":"추천 메뉴","cost":"1인"},
        "dinner": {"name":"식당명","near":"가까운 장소","menu":"추천 메뉴","cost":"1인"}
      },
      "transitNote": "이동 요약(지하철/버스/도보/택시)"
    }
  ],
  "budgetBreakdown": {"meals": number, "entry": number, "transport": number, "etc": number},
  "notes": "아이동반/휠체어/반려동물 등 특이사항 반영 메모"
}
    `.trim(),
    user: `
입력:
- 선호 장소: ${places.join(', ') || '미지정'}
- 날짜: ${startDate || '미지정'} ~ ${endDate || '미지정'}
- 이동수단: ${transport || '미지정'}
- 예산(1인): ${budgetPerPerson || 0}원
- 동행자: 성인 ${party.adults||1}명, 아동 ${party.kids||0}명${party.notes ? `, 특이사항:${party.notes}` : ''}

참고(장소 메타):
${JSON.stringify(placeMeta, null, 2)}
    `.trim()
  };
}

app.post('/api/itinerary', async (req, res) => {
  try {
    const { system, user } = buildPrompt(req.body);

    // Responses API 호출 (Node SDK)
    // 모델명은 조직 정책/비용에 맞춰 선택. (아래는 예시)
    const response = await openai.responses.create({
      model: 'gpt-5-mini', // 빠르고 저렴한 추천용 예시. 고품질이 필요하면 상위 모델 사용.
      input: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ],
      // JSON만 받도록 지시
      response_format: { type: 'json_object' }
    });

    // SDK 결과에서 텍스트(JSON) 꺼내기
    const text = response.output_text || (response.output?.[0]?.content?.[0]?.text) || '{}';
    const plan = JSON.parse(text);

    res.json({ plan });
  } catch (err) {
    console.error(err);
    res.status(500).send(err?.message || 'Failed to create itinerary');
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log('Server listening on ' + port));
