import { db, collection, query, where, getDocs, doc, updateDoc, increment } from '../firebase';

export const getFinancialSummary = async (userId: string) => {
    try {
        const accountsSnapshot = await getDocs(query(collection(db, 'focuflow_accounts'), where('uid', '==', userId)));
        let balance = 0;
        accountsSnapshot.forEach(doc => {
            balance += doc.data().balance || 0;
        });
        return { balance };
    } catch (e) {
        console.error("Error fetching financial summary:", e);
        return { balance: 0 };
    }
};

export const getFocoFlowData = async (userId: string, collName: string, limitCount?: number) => {
    try {
        const q = query(collection(db, collName), where('uid', '==', userId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
        console.error(`Error fetching FocoFlow data from ${collName}:`, e);
        return [];
    }
};

export const toggleReminderCompleted = async (reminderId: string) => {
    try {
        const docRef = doc(db, 'focuflow_items', reminderId);
        await updateDoc(docRef, { status: 'done' });
    } catch (e) {
        console.error("Error toggling reminder status:", e);
    }
};
