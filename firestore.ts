
import { db } from "./firebase";
import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
  setDoc,
  query, 
  orderBy, 
  doc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp,
  where
} from "firebase/firestore";
import { Transaction, Partner, ImportedRevenue } from './types';

type TransactionData = Omit<Transaction, 'id'>;

function sanitizeFirestoreData<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }
  
  if (Array.isArray(data)) {
    return data.map(sanitizeFirestoreData) as unknown as T;
  }
  
  if (typeof data === "object") {
    const proto = Object.getPrototypeOf(data);
    if (proto !== null && proto !== Object.prototype) {
      return data;
    }
    const cleanObj: any = {};
    for (const [key, val] of Object.entries(data)) {
      if (val === undefined) {
        continue;
      }
      if (typeof val === "number" && isNaN(val)) {
        cleanObj[key] = 0;
        continue;
      }
      cleanObj[key] = sanitizeFirestoreData(val);
    }
    return cleanObj as T;
  }
  
  return data;
}

// --- Transações Manuais ---

export function saveTransaction(data: TransactionData, userId: string) {
  const transactionsCol = collection(db, "transacoes");
  return addDoc(transactionsCol, sanitizeFirestoreData({
    ...data,
    tipoInterno: 'transacao',
    criadoPor: userId,
    criadoEm: serverTimestamp()
  }));
}

export function getTransactions() {
  const transactionsCol = collection(db, "transacoes");
  const q = query(
    transactionsCol,
    where("tipoInterno", "==", "transacao"),
    orderBy("date", "desc")
  );
  return getDocs(q);
}

export function updateTransaction(id: string, data: Partial<TransactionData>) {
    const transactionDoc = doc(db, "transacoes", id);
    return updateDoc(transactionDoc, sanitizeFirestoreData(data));
}

export function deleteTransaction(id: string) {
    const transactionDoc = doc(db, "transacoes", id);
    return deleteDoc(transactionDoc);
}

// --- Parcerias / Sócios ---

export function getPartnership() {
  return getDoc(doc(db, "partnerships", "aci"));
}

export function savePartnership(socios: Partner[]) {
  return setDoc(doc(db, "partnerships", "aci"), { socios });
}

// --- Assessores ---

export function getAdvisors() {
  const advisorsCol = collection(db, "assessores");
  return getDocs(advisorsCol);
}

export function saveAdvisor(data: any) {
  const advisorsCol = collection(db, "assessores");
  return addDoc(advisorsCol, data);
}

export function updateAdvisor(id: string, data: any) {
  const advisorDoc = doc(db, "assessores", id);
  return updateDoc(advisorDoc, data);
}

export function deleteAdvisor(id: string) {
  const advisorDoc = doc(db, "assessores", id);
  return deleteDoc(advisorDoc);
}

// --- Metas ---

export function getGoals() {
  const goalsCol = collection(db, "metas");
  return getDocs(goalsCol);
}

export function saveGoal(data: any) {
  const goalsCol = collection(db, "metas");
  return addDoc(goalsCol, data);
}

export function updateGoal(id: string, data: any) {
  const goalDoc = doc(db, "metas", id);
  return updateDoc(goalDoc, data);
}

export function deleteGoal(id: string) {
  const goalDoc = doc(db, "metas", id);
  return deleteDoc(goalDoc);
}

// --- Configurações Gerais ---

export function getSettings() {
  return getDoc(doc(db, "configuracoes", "geral"));
}

export function saveSettings(data: any) {
  return setDoc(doc(db, "configuracoes", "geral"), data, { merge: true });
}

// --- Receitas Importadas ---

export function saveImportedRevenue(data: any, userId: string) {
  const transactionsCol = collection(db, "transacoes");
  return addDoc(transactionsCol, sanitizeFirestoreData({
    ...data,
    tipoInterno: 'receita_importada',
    criadoPor: userId,
    criadoEm: serverTimestamp()
  }));
}

export function getImportedRevenues() {
    const transactionsCol = collection(db, "transacoes");
    const q = query(
        transactionsCol, 
        where("tipoInterno", "==", "receita_importada"),
        orderBy("date", "desc")
    );
    return getDocs(q);
}

export function deleteImportedRevenue(id: string) {
    const docRef = doc(db, "transacoes", id);
    return deleteDoc(docRef);
}

export function updateImportedRevenue(id: string, data: Partial<ImportedRevenue>) {
    const docRef = doc(db, "transacoes", id);
    return updateDoc(docRef, sanitizeFirestoreData(data));
}

export function getRevenuesByPeriod(startIso: string, endIso: string) {
    const transactionsCol = collection(db, "transacoes");
    const q = query(
        transactionsCol, 
        where("tipoInterno", "==", "receita_importada"),
        where("date", ">=", startIso),
        where("date", "<=", endIso)
    );
    return getDocs(q);
}

export async function deleteAllImportedRevenues() {
    const snap = await getImportedRevenues();
    const batch = snap.docs.map(d => deleteDoc(doc(db, "transacoes", d.id)));
    await Promise.all(batch);
    return snap.docs.length;
}

export async function deduplicateImportedRevenues() {
    const snap = await getImportedRevenues();
    const docs = snap.docs;
    const seen = new Set();
    let deletedCount = 0;
    
    // Deleta registros idênticos (mesma data, cliente, valor e assessor)
    for (const d of docs) {
        const data = d.data();
        const key = `${data.date}-${data.cliente}-${data.revenueAmount}-${data.advisorName}`;
        if (seen.has(key)) {
            await deleteDoc(doc(db, "transacoes", d.id));
            deletedCount++;
        } else {
            seen.add(key);
        }
    }
    return { deletedCount, updatedCount: docs.length - deletedCount };
}
