
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
import { Transaction, Partner } from './types';

type TransactionData = Omit<Transaction, 'id'>;

// --- Transações Manuais ---

export function saveTransaction(data: TransactionData, userId: string) {
  const transactionsCol = collection(db, "transacoes");
  return addDoc(transactionsCol, {
    ...data,
    tipoInterno: 'transacao',
    criadoPor: userId,
    criadoEm: serverTimestamp()
  });
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
    return updateDoc(transactionDoc, data);
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

// --- Receitas Importadas ---

export function saveImportedRevenue(data: any, userId: string) {
  const transactionsCol = collection(db, "transacoes");
  return addDoc(transactionsCol, {
    ...data,
    tipoInterno: 'receita_importada',
    criadoPor: userId,
    criadoEm: serverTimestamp()
  });
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

export async function deduplicateImportedRevenues() {
    const snap = await getImportedRevenues();
    const docs = snap.docs;
    const seen = new Set();
    let deletedCount = 0;
    
    // Deleta registros idênticos (mesma data, cliente, valor e assessor)
    for (const d of docs) {
        const data = d.data();
        const key = `${data.date}-${data.cliente}-${data.receitaLiquidaEQI}-${data.assessorPrincipal}`;
        if (seen.has(key)) {
            await deleteDoc(doc(db, "transacoes", d.id));
            deletedCount++;
        } else {
            seen.add(key);
        }
    }
    return { deletedCount, updatedCount: docs.length - deletedCount };
}
