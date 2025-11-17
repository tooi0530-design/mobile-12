import { GoogleGenAI } from "@google/genai";

export const generateWallpaper = async (prompt: string): Promise<string> => {
  // API를 호출하기 직전에 새 인스턴스를 생성하여 최신 API 키를 사용합니다.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: `${prompt}, phone wallpaper, vertical 9:16, high resolution, stunning, beautiful`,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '9:16',
      },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
      return `data:image/jpeg;base64,${base64ImageBytes}`;
    } else {
      throw new Error("이미지 생성에 실패했습니다. 응답에 이미지가 없습니다.");
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    // 컴포넌트에서 오류를 처리할 수 있도록 원본 오류를 다시 throw합니다.
    throw error;
  }
};