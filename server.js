const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { createClient } = require("@supabase/supabase-js");
const { GoogleGenAI } = require("@google/genai");
const { Groq } = require("groq-sdk");
const multer = require("multer");

dotenv.config();
const { SUPABASE_KEY: supabaseKey, SUPABASE_URL: supabaseUrl } = process.env;
console.log("supabaseKey", supabaseKey);
console.log("supabaseUrl", supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseKey);
// 파일 처리
const storage = multer.memoryStorage(); // 메모리 -> 실행할 때 임시로 파일 관리
const upload = multer({ storage }); // 업로드를 처리해주는 미들웨어

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("bye");
});

app.get("/plans", async (req, res) => {
  const { data, error } = await supabase.from("tour_plan").select("*");
  if (error) {
    return res.status(400).json({ error: error.message });
  }
  res.json(data);
});

// npm install groq-sdk
// upload.single("image") -> form 데이터 중에 image라는 속성(네임)을 req.file -> req.body
app.post("/plans", upload.single("image"), async (req, res) => {
  const plan = req.body; // 여기서부턴 이미지 존재 여부로 분기
  console.log(req.file);
  if (req.file) {
    console.log("이미지 파일이 존재");
    //  Date.now() -> 파일 중복을 막기 위해 시간을 나타내는 숫자를 앞에 접두사로 작성
    const filename = `${Date.now()}_${req.file.originalname}`;
    const { error: uploadError } = await supabase.storage
      .from("tour-images") // 버켓명
      // buffer : 텍스트 형태로 나타낸 파일. mimtype : 파일의 속성. 형태
      .upload(filename, req.file.buffer, {
        contentType: req.file.mimetype,
      });
    if (uploadError) {
      console.error("이미지 업로드 실패", uploadError);
      return res.status(400).json({ error: uploadError.message });
    }
    // 여기까지 진행되면 server에 파일이 업로드 됨
    const { data: urlData } = supabase.storage
      .from("tour-images") // 버킷명
      .getPublicUrl(filename); // 생성파일 이름 -> 공개 URL
    plan.image_url = urlData.publicUrl; // 내가 업로드한 파일의 접속 링크 -> DB

    // 이미지 분석
    const analysis = await analyzeImage(req.file.buffer, req.file.mimetype);
    console.log(analysis);
    const { gemini, groq } = analysis;
    plan.purpose += `\n뒤는 목적과 관련된 사진에 대한 설명입니다. ${gemini}`;
    plan.purpose += `\n뒤는 목적과 관련된 사진에 대한 설명입니다. ${groq}`;
  } else {
    // 이미지가 없을 때
    console.log("감지된 이미지 파일이 없습니다");
    const genImage = await generateImage(plan);
    plan.image_url = genImage;
    console.log("생성된 이미지 주소", genImage);
  }
  const result = await chaining(plan);
  plan.ai_suggestion = result;
  // 최종적으로 작성된 계획 -> 최소/최대 budget이 얼마나 나올까?
  const { minBudget, maxBudget } = await ensemble(result);
  plan.ai_min_budget = minBudget;
  plan.ai_max_budget = maxBudget;

  const { error } = await supabase.from("tour_plan").insert(plan);
  if (error) {
    return res.status(400).json({ error: error.message });
  }
  res.status(201).json();
});

app.delete("/plans", async (req, res) => {
  const { planId } = req.body;
  // 데이터를 한 번 불러오기
  const { data } = await supabase
    .from("tour_plan")
    .select("image_url")
    .eq("id", planId)
    .single(); // 한 개의 객체
  // 삭제
  const { error } = await supabase.from("tour_plan").delete().eq("id", planId);
  if (error) {
    return res.status(400).json({ error: error.message });
  }
  // 삭제 성공 시에 이미지도 삭제
  if (data.image_url) {
    // url -> filename
    const filename = data.image_url.split("/").pop(); // .../파일명.확장자 -> pop() 가장 마지막 요소를 return
    await supabase.storage.from("tour-images").remove(filename);
  }

  res.status(204).json();
});

const https = require("https");
const convert = require("xml-js");

app.get("/culture-api", (req, res) => {
  // 🚨 IMPORTANT: You need to provide a valid service key.
  const serviceKey = "9f726c22-9789-4405-bf3c-afb895117896"; // 🚨 Replace with your actual service key.
  const pageNo = req.query.pageNo || "1";
  const numOfRows = req.query.numOfRows || "10";

  const apiUrl = `https://api.kcisa.kr/openapi/API_TOU_048/request?serviceKey=${serviceKey}&pageNo=${pageNo}&numOfRows=${numOfRows}`;

  https
    .get(apiUrl, (apiRes) => {
      let data = "";
      apiRes.on("data", (chunk) => {
        data += chunk;
      });
      apiRes.on("end", () => {
        try {
          // Convert XML to JSON
          const jsonResult = convert.xml2json(data, {
            compact: true,
            spaces: 2,
          });
          res.setHeader("Content-Type", "application/json");
          res.send(jsonResult);
        } catch (e) {
          console.error("Error converting XML to JSON: ", e.message);
          // If conversion fails, it might not be XML. Send original data.
          res.setHeader("Content-Type", "text/plain");
          res.status(500).send(data);
        }
      });
    })
    .on("error", (err) => {
      console.error("Error fetching from API: ", err.message);
      res.status(500).json({ error: "Failed to fetch data from the API" });
    });
});

app.get("/api/config", (req, res) => {
  res.json({
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_KEY,
  });
});

app.listen(port, () => {
  console.log(`서버가 ${port}번 포트로 실행 중입니다.`);
});

async function chaining(plan) {
  const ai = new GoogleGenAI({}); // GEMINI_API_KEY 알아서 인식해줌
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `
    [장소] ${plan.destination}
    [목적] ${plan.purpose}
    [인원수] ${plan.people_count}
    [시작일] ${plan.start_date}
    [종료일] ${plan.end_date}`,
    config: {
      // 형식을 구조화
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          prompt: {
            type: "string",
          },
        },
        required: ["prompt"],
      },
      systemInstruction: [
        // { text: "제공받은 정보를 바탕으로 여행 계획을 짜되, 300자 이내로." },
        {
          text: `제공받은 정보를 바탕으로 최적의 여행 계획을 세우기 위한 프롬프트를 작성해줘. 응답은 JSON 형식으로 {"prompt": "프롬프트 내용"} 형식으로 작성해줘.`,
        },
      ],
      // structured output
    },
  });
  const { prompt } = JSON.parse(response.text);
  console.log("prompt", prompt);
  const response2 = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite", // 모델을 상대적으로 약한 모델로...
    contents: prompt,
    config: {
      systemInstruction: [
        {
          text: "프롬프트에 따라 작성하되, 300자 이내 plain text(no markdown or rich text)로.",
        },
      ],
    },
  });
  return response2.text;
}

async function ensemble(result) {
  const groq = new Groq(); // api key -> GROQ_API_KEY -> 환경변수가 알아서 인식
  const models = [
    "moonshotai/kimi-k2-instruct-0905",
    "openai/gpt-oss-120b",
    "meta-llama/llama-4-maverick-17b-128e-instruct",
  ];
  const responses = await Promise.all(
    models.map(async (model) => {
      // https://console.groq.com/docs/structured-outputs
      const response = await groq.chat.completions.create({
        response_format: {
          type: "json_object",
        },
        messages: [
          {
            role: "system",
            content: `여행 경비 산출 전문가로, 주어진 여행 계획을 바탕으로 '원화 기준'의 숫자로만 작성된 예산을 작성하기. 응답은 JSON 형식으로 {"min_budget":"최소 예산", "max_budget": "최대 예산"}`,
          },
          {
            role: "user",
            content: result,
          },
        ],
        model,
      });
      console.log(response.choices[0].message.content);
      const { min_budget, max_budget } = JSON.parse(
        response.choices[0].message.content
      );
      return {
        min_budget: Number(min_budget),
        max_budget: Number(max_budget),
      };
    })
  );
  console.log(responses);
  return {
    // rest 연산자로 해체해서 넣어줘야함 (배열의 경우)
    minBudget: Math.min(...responses.map((v) => v.min_budget)),
    maxBudget: Math.max(...responses.map((v) => v.max_budget)),
  };
}

async function analyzeImage(buffer, mimeType) {
  // Gemini 호출
  const ai = new GoogleGenAI({});
  const visionPrompt =
    "제공 받은 여행 관련 이미지를 분석하여, 어떠한 장소인지 어떠한 목적을 기대할 수 있는지를 한국어로 200자 이내로 적어주세요.";
  const b64 = buffer.toString("base64");
  const geminiResponse = await ai.models.generateContent({
    // https://ai.google.dev/gemini-api/docs/models?hl=ko
    model: "gemini-2.5-flash", // "gemini-2.5-flash-lite",
    contents: [
      {
        parts: [
          { text: visionPrompt },
          {
            inlineData: {
              data: b64,
              mimeType,
            },
          },
        ],
      },
    ],
  });
  // Groq 호출
  const groq = new Groq();
  const groqResponse = await groq.chat.completions.create({
    // https://console.groq.com/docs/vision
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    // meta-llama/llama-4-maverick-17b-128e-instruct
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: visionPrompt,
          },
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${b64}`,
            },
          },
        ],
      },
    ],
  });

  return {
    gemini: geminiResponse.text,
    groq: groqResponse.choices[0].message.content,
  };
}

async function generateImage(plan) {
  const ai = new GoogleGenAI({});
  const imagePrompt = `${plan.destination}의 아름다운 풍경 사진, ${plan.purpose}를 목적로 한 여행. ${plan.people_count}명의 여행.사실적인 사진 스타일`;
  console.log(imagePrompt);
  const response = await ai.models.generateContent({
    // https://ai.google.dev/gemini-api/docs/models?hl=ko#gemini-2.0-flash-image
    model: "gemini-2.0-flash-preview-image-generation",
    contents: imagePrompt,
    config: {
      responseModalities: ["TEXT", "IMAGE"],
    },
  });
  // console.log(response.candidates[0].content.parts);
  // const imageData = response.candidates[0].content.parts[0].inlineData.data;
  const parts = response.candidates[0].content.parts;
  const p0 = parts[0]?.inlineData?.data;
  const p1 = parts[1]?.inlineData?.data;
  const imageData = p0 || p1;
  const imageBuffer = Buffer.from(imageData, "base64");

  const filename = `gen_${Date.now()}.jpg`;
  const { error: uploadError } = await supabase.storage
    .from("tour-images")
    .upload(filename, imageBuffer, {
      contentType: "image/jpeg",
    });

  if (uploadError) {
    console.error("업로드 실패");
    return;
  }
  const { data: urlData } = supabase.storage
    .from("tour-images") // 버킷명
    .getPublicUrl(filename); // 생성파일 이름 -> 공개 URL
  return urlData.publicUrl; // 내가 업로드한 파일의 접속 링크 -> DB
}
