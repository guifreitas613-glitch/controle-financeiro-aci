
import { GoogleGenAI } from "@google/genai";
import { AspectRatio } from "../types";

// FIX: Aligned with coding guidelines.
// Removed API_KEY constant and checks, assuming process.env.API_KEY is always available.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateImage = async (prompt: string, aspectRatio: AspectRatio): Promise<string> => {
  // FIX: Removed API key availability check as per guidelines.
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: aspectRatio,
      },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      const base64ImageBytes = response.generatedImages[0].image.imageBytes;
      return `data:image/jpeg;base64,${base64ImageBytes}`;
    } else {
      throw new Error("Nenhuma imagem foi gerada.");
    }
  } catch (error) {
    console.error("Erro ao gerar imagem:", error);
    throw new Error("Falha ao gerar a imagem. Por favor, verifique o console para mais detalhes.");
  }
};


export const generateFinancialInsights = async (summary: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Você é um consultor financeiro experiente para escritórios de investimento. Com base nos seguintes dados financeiros de uma empresa, forneça 3 recomendações acionáveis e específicas para melhorar a saúde financeira. Seja conciso, profissional e direto. Formate a saída em tópicos (usando markdown). \n\nDados:\n${summary}`
    });
    return response.text;
  } catch (error) {
    console.error("Erro ao gerar insights:", error);
    throw new Error("Falha ao gerar insights financeiros. Por favor, tente novamente.");
  }
};

export const getChatResponse = async (question: string, transactionData: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Você é um assistente de IA especialista em finanças. Sua tarefa é responder à pergunta do usuário baseando-se estritamente nos dados de transação fornecidos. Analise os dados para encontrar a resposta. Se a resposta não puder ser encontrada nos dados, informe que a informação não está disponível. Não invente informações. \n\n**Dados de Transação (Data, Tipo, Valor, Categoria, Descrição, Cliente/Fornecedor):**\n${transactionData}\n\n**Pergunta do Usuário:** "${question}"`
    });
    return response.text;
  } catch (error) {
    console.error("Erro na resposta do chat:", error);
    throw new Error("Falha ao obter resposta do chat. Por favor, tente novamente.");
  }
};
