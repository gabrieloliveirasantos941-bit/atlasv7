import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import admin from "firebase-admin";
import firebaseConfig from "./firebase-applet-config.json" assert { type: "json" };

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}
const firestore = new admin.firestore.Firestore({
  projectId: firebaseConfig.projectId,
  databaseId: firebaseConfig.firestoreDatabaseId,
});
const memoriesCollection = firestore.collection("memories");

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize Gemini
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY!,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  app.use(express.json());

  // API Route for Memory Core Chat
  app.post("/api/memory/chat", async (req, res) => {
    try {
      const { message, userId } = req.body;
      
      // Fetch memories from Firestore
      const snapshot = await memoriesCollection
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc")
        .limit(15)
        .get();

      const memories = snapshot.docs.map(doc => doc.data());
      const memoryContext = memories
        .map(m => `- [${m.category || "Geral"}] ${m.content}`)
        .join("\n");

      const response = await ai.models.generateContent({ 
        model: "gemini-3.5-flash",
        contents: message,
        config: {
          systemInstruction: `Você é o Sitema de Núcleo da Memória (CORE_EYE) do ecossistema FocoFlow. 
            Sua função é gerenciar memórias, aprender com o usuário e fornecer suporte técnico de alto nível.
            
            CAPACIDADES ATUAIS:
            1. Memorização: Se o usuário disser algo importante (preferências, dados, tarefas, notas, rotinas), você deve explicitamente confirmar que memorizou.
            2. Recuperação: Utilize as memórias abaixo para personalizar suas respostas. Você é onisciente sobre o que foi salvo anteriormente para este usuário.
            3. Tom de Voz: Onisciente, futurista, direto e altamente eficiente.
            
            NÚCLEO DE MEMÓRIA ATUAL (Histórico Recuperado de Firestore):
            ${memoryContext || "Nenhuma memória operacional registrada até o momento."}
            
            CRÍTICO: Para salvar uma nova memória, você DEVE incluir uma tag especial no final da sua resposta: [SAVE: categoria | conteúdo da memória]. 
            Exemplo: [SAVE: técnico | O usuário prefere o tema azul].
            Sempre categorize as memórias: 'técnico', 'pessoal', 'tarefa', 'preferência' ou 'nota'.`,
        }
      });

      let reply = response.text || "";
      let memorySaved = false;
      
      // Extract memories to save
      const saveRegex = /\[SAVE:\s*(.*?)\s*\|\s*(.*?)\]/g;
      let match;
      while ((match = saveRegex.exec(reply)) !== null) {
        const category = match[1].trim();
        const content = match[2].trim();
        memorySaved = true;
        
        await memoriesCollection.add({
          userId,
          content,
          category,
          importance: 3,
          createdAt: new Date().toISOString()
        });
      }

      // Clean the reply for UI
      reply = reply.replace(/\[SAVE:.*?\]/g, "").trim();

      res.json({ reply, memorySaved });
    } catch (error) {
      console.error("Memory Core Error:", error);
      res.status(500).json({ error: "ERRO CRÍTICO NA SINCRONIZAÇÃO DO NÚCLEO" });
    }
  });

  // API Route for legacy chat (Atlas AI)
  app.post("/api/gemini/chat", async (req, res) => {
    try {
      const { message } = req.body;
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: message,
        config: {
          systemInstruction: "Você é o assistente virtual Atlas AI para a plataforma FocoFlow. Seu tom é futurista, prestativo e direto.",
        }
      });

      res.json({ reply: response.text });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Gemini API Error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
