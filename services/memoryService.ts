
import { 
  db, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit, 
  serverTimestamp,
  handleFirestoreError,
  OperationType
} from '../firebase';

export interface AtlasMemoryItem {
  id?: string;
  uid: string;
  role: 'user' | 'atlas' | 'system';
  message: string;
  timestamp: any;
  category: 'conversation' | 'reminder' | 'preference' | 'system' | 'important_memory';
}

/**
 * Saves a message to the persistent Atlas memory.
 */
export const saveToMemory = async (
  uid: string, 
  role: 'user' | 'atlas' | 'system', 
  message: string, 
  category: 'conversation' | 'reminder' | 'preference' | 'system' | 'important_memory' = 'conversation'
) => {
  try {
    const memoryData = {
      uid,
      role,
      message,
      timestamp: serverTimestamp(),
      category
    };
    await addDoc(collection(db, 'atlas_memory'), memoryData);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'atlas_memory');
  }
};

/**
 * Searches the persistent Atlas memory for relevant information.
 */
export const searchMemory = async (uid: string, queryStr: string, limitCount: number = 10): Promise<string> => {
  try {
    const q = query(
      collection(db, 'atlas_memory'),
      where('uid', '==', uid),
      orderBy('timestamp', 'desc'),
      limit(200) // Fetch more to search locally for better context
    );

    const querySnapshot = await getDocs(q);
    const memories: AtlasMemoryItem[] = [];
    querySnapshot.forEach((doc) => {
      memories.push({ id: doc.id, ...doc.data() } as AtlasMemoryItem);
    });

    // Simple keyword search with scoring
    const searchTerms = queryStr.toLowerCase().split(' ').filter(t => t.length > 2);
    const results = memories.map(m => {
      const msgLower = m.message.toLowerCase();
      let score = 0;
      if (msgLower.includes(queryStr.toLowerCase())) score += 10;
      searchTerms.forEach(term => {
        if (msgLower.includes(term)) score += 2;
      });
      return { ...m, score };
    })
    .filter(m => m.score > 0)
    .sort((a, b) => b.score - a.score);

    if (results.length === 0) return "Nenhuma memória relevante encontrada.";

    return results.slice(0, limitCount).map(m => {
      const date = m.timestamp?.toDate ? m.timestamp.toDate().toLocaleString() : 'Data desconhecida';
      return `[${date}] ${m.role === 'user' ? 'Usuário' : (m.role === 'atlas' ? 'Atlas' : 'Sistema')}: ${m.message}`;
    }).join('\n---\n');
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'atlas_memory');
    return "Erro ao acessar a memória.";
  }
};

/**
 * Specifically saves important information to memory.
 */
export const saveImportantMemory = async (uid: string, info: string) => {
  return saveToMemory(uid, 'system', info, 'important_memory');
};
