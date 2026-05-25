import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, updateDoc, deleteDoc, setDoc, serverTimestamp, onSnapshot, orderBy, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile, AuthorizedEmail, SecurityLog } from '../types';
import { Shield, User, Trash2, Clock, Search, Plus, Ban, CheckCircle, AlertTriangle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface AdminDashboardProps {
  currentUserEmail: string | null;
  onBack: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUserEmail, onBack }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'authorized' | 'logs'>('dashboard');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [authorizedEmails, setAuthorizedEmails] = useState<AuthorizedEmail[]>([]);
  const [logs, setLogs] = useState<SecurityLog[]>([]);

  useEffect(() => {
    // Fetch users
    const usersUnsub = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile)));
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'users');
    });
    
    // Fetch authorized emails
    const authUnsub = onSnapshot(collection(db, 'authorized_emails'), (snapshot) => {
      setAuthorizedEmails(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuthorizedEmail)));
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'authorized_emails');
    });

    // Fetch logs
    const logsUnsub = onSnapshot(query(collection(db, 'security_logs'), orderBy('timestamp', 'desc')), (snapshot) => {
      setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SecurityLog)));
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'security_logs');
    });

    return () => { usersUnsub(); authUnsub(); logsUnsub(); };
  }, []);

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-8">
      <button onClick={onBack} className="mb-6 flex items-center space-x-2 text-gray-400 hover:text-white">
        <ArrowLeft className="h-5 w-5" />
        <span>Voltar para Atlas</span>
      </button>
      <h1 className="text-4xl font-bold mb-8">Painel Administrativo ATLAS</h1>
      
      <div className="flex space-x-4 mb-8">
        {['dashboard', 'users', 'authorized', 'logs'].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-6 py-2 rounded-none font-semibold ${activeTab === tab ? 'bg-blue-600' : 'bg-gray-800'}`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gray-800 p-6 rounded-none">
            <h3 className="text-gray-400">Total Usuários</h3>
            <p className="text-3xl font-bold">{users.length}</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-none">
            <h3 className="text-gray-400">Usuários Ativos</h3>
            <p className="text-3xl font-bold">{users.filter(u => u.status === 'active').length}</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-none">
            <h3 className="text-gray-400">Bloqueados</h3>
            <p className="text-3xl font-bold">{users.filter(u => u.status === 'blocked').length}</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-none">
            <h3 className="text-gray-400">Tentativas Negadas</h3>
            <p className="text-3xl font-bold">{logs.filter(l => l.action === 'login_denied').length}</p>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-gray-800 p-6 rounded-none">
          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-400">
                <th className="p-4">Nome</th>
                <th className="p-4">Email</th>
                <th className="p-4">Status</th>
                <th className="p-4">Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.uid} className="border-t border-gray-700">
                  <td className="p-4">{user.name}</td>
                  <td className="p-4">{user.email}</td>
                  <td className="p-4">{user.status}</td>
                  <td className="p-4 space-x-2">
                    <button onClick={async () => {
                      const userPath = `users/${user.uid}`;
                      try {
                        await updateDoc(doc(db, 'users', user.uid), { status: user.status === 'active' ? 'blocked' : 'active' });
                      } catch (err) {
                        handleFirestoreError(err, OperationType.UPDATE, userPath);
                      }
                    }} className="text-blue-400">
                      {user.status === 'active' ? 'Bloquear' : 'Desbloquear'}
                    </button>
                    <button onClick={async () => {
                      const userPath = `users/${user.uid}`;
                      try {
                        await deleteDoc(doc(db, 'users', user.uid));
                      } catch (err) {
                        handleFirestoreError(err, OperationType.DELETE, userPath);
                      }
                    }} className="text-red-400">Remover</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'authorized' && (
        <div className="bg-gray-800 p-6 rounded-none">
          <h2 className="text-2xl font-bold mb-4">Gmails Autorizados</h2>
          <div className="flex space-x-2 mb-4">
            <input id="newEmail" type="email" placeholder="Novo Gmail" className="bg-gray-700 p-2 rounded-none" />
            <button onClick={async () => {
              const email = (document.getElementById('newEmail') as HTMLInputElement).value;
              console.log("Tentando adicionar e-mail:", email);
              if (email) {
                try {
                  await setDoc(doc(db, 'authorized_emails', email), { status: 'active', addedAt: serverTimestamp(), addedBy: 'admin' }, { merge: true });
                  (document.getElementById('newEmail') as HTMLInputElement).value = '';
                  toast.success(`E-mail ${email} autorizado com sucesso!`);
                  console.log("E-mail adicionado com sucesso!");
                } catch (e) {
                  console.error("Erro ao adicionar e-mail:", e);
                  handleFirestoreError(e, OperationType.WRITE, 'authorized_emails');
                  toast.error(`Erro ao autorizar e-mail ${email}. Verifique o console.`);
                }
              } else {
                console.warn("E-mail vazio");
              }
            }} className="bg-blue-600 p-2 rounded-none">Adicionar</button>
          </div>
          <ul>
            {authorizedEmails.map(auth => (
              <li key={auth.id} className="flex justify-between p-2 border-b border-gray-700">
                {auth.id} - {auth.status}
                <div className="space-x-2">
                  <button onClick={async () => {
                    const authPath = `authorized_emails/${auth.id}`;
                    try {
                      await updateDoc(doc(db, 'authorized_emails', auth.id), { status: auth.status === 'active' ? 'blocked' : 'active' });
                    } catch (err) {
                      handleFirestoreError(err, OperationType.UPDATE, authPath);
                    }
                  }} className="text-yellow-400">
                    {auth.status === 'active' ? 'Bloquear' : 'Desbloquear'}
                  </button>
                  <button onClick={async () => {
                    const authPath = `authorized_emails/${auth.id}`;
                    try {
                      await deleteDoc(doc(db, 'authorized_emails', auth.id));
                    } catch (err) {
                      handleFirestoreError(err, OperationType.DELETE, authPath);
                    }
                  }} className="text-red-400">Remover</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="bg-gray-800 p-6 rounded-none">
          <h2 className="text-2xl font-bold mb-4">Logs de Segurança</h2>
          <ul>
            {logs.map(log => (
              <li key={log.id} className="p-2 border-b border-gray-700">
                {new Date(log.timestamp).toLocaleString()} - {log.email} - {log.action} - {log.status}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
