import React, { useState, useEffect } from 'react';
import { 
    collection, 
    query, 
    getDocs, 
    doc, 
    updateDoc, 
    deleteDoc, 
    orderBy,
    limit,
    onSnapshot
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile } from '../types';
import { X, Search, Shield, User, Trash2, CheckCircle, Clock } from 'lucide-react';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail: string | null;
}

const UserManagementModal: React.FC<UserManagementModalProps> = ({ isOpen, onClose, currentUserEmail }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'user'>('all');

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedUsers: UserProfile[] = [];
      snapshot.forEach((doc) => {
        fetchedUsers.push({ uid: doc.id, ...doc.data() } as UserProfile);
      });
      setUsers(fetchedUsers);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isOpen]);

  const handleToggleRole = async (userId: string, currentRole: string | undefined) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (userEmail === currentUserEmail) {
      alert("Você não pode excluir sua própria conta administrativa.");
      return;
    }
    
    if (window.confirm(`Tem certeza que deseja excluir o usuário ${userEmail}? Esta ação é irreversível.`)) {
      try {
        await deleteDoc(doc(db, 'users', userId));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `users/${userId}`);
      }
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = (user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          user.email?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[var(--bg-secondary)] rounded-none shadow-2xl overflow-hidden text-[var(--text-primary)] border border-[var(--border-color)] max-w-4xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-6 border-b border-[var(--border-color)]">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600/20 rounded-none">
              <Shield className="h-6 w-6 text-blue-500" />
            </div>
            <h2 className="text-2xl font-bold">Gerenciamento de Usuários</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[var(--bg-tertiary)] rounded-full transition-colors">
            <X className="h-6 w-6 text-[var(--text-secondary)]" />
          </button>
        </div>

        <div className="p-6 border-b border-[var(--border-color)] bg-[var(--bg-primary)]/50 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-secondary)]" />
              <input 
                type="text" 
                placeholder="Buscar por nome ou email..." 
                className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-none py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-[var(--text-secondary)]">Filtrar:</span>
              <select 
                className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-none py-2 px-3 text-sm focus:outline-none"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value as any)}
              >
                <option value="all">Todos</option>
                <option value="admin">Administradores</option>
                <option value="user">Usuários</option>
              </select>
            </div>
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1 text-[var(--text-secondary)]">
              <User className="h-4 w-4" />
              <span>Total: {users.length}</span>
            </div>
            <div className="flex items-center space-x-1 text-blue-500">
              <Shield className="h-4 w-4" />
              <span>Admins: {users.filter(u => u.role === 'admin').length}</span>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[var(--bg-tertiary)] sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Usuário</th>
                <th className="px-6 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Status/Role</th>
                <th className="px-6 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Último Acesso</th>
                <th className="px-6 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center space-y-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
                      <span className="text-[var(--text-secondary)]">Carregando usuários...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-[var(--text-secondary)]">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.uid} className="hover:bg-[var(--bg-tertiary)]/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-[var(--accent-primary)] flex items-center justify-center text-white font-bold overflow-hidden">
                          {user.profilePicUrl ? (
                            <img src={user.profilePicUrl} alt={user.name} className="w-full h-full object-cover" />
                          ) : (
                            user.name ? user.name[0].toUpperCase() : 'U'
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-[var(--text-primary)]">{user.name || 'Sem nome'}</div>
                          <div className="text-xs text-[var(--text-secondary)]">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col space-y-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium w-fit ${
                          user.role === 'admin' ? 'bg-blue-600/20 text-blue-400' : 'bg-gray-600/20 text-gray-400'
                        }`}>
                          {user.role === 'admin' ? 'Administrador' : 'Usuário'}
                        </span>
                        {user.subscriptionStatus && (
                          <span className="text-[10px] text-[var(--text-secondary)] uppercase">
                            Assinatura: {user.subscriptionStatus}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1 text-xs text-[var(--text-secondary)]">
                        <Clock className="h-3 w-3" />
                        <span>
                          {user.lastSeen 
                            ? new Date(user.lastSeen).toLocaleString('pt-BR') 
                            : 'Nunca'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => handleToggleRole(user.uid!, user.role)}
                          className={`p-2 rounded-none transition-colors ${
                            user.role === 'admin' 
                            ? 'bg-blue-600/10 text-blue-500 hover:bg-blue-600/20' 
                            : 'bg-gray-600/10 text-gray-500 hover:bg-gray-600/20'
                          }`}
                          title={user.role === 'admin' ? "Remover Admin" : "Tornar Admin"}
                        >
                          <Shield className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(user.uid!, user.email!)}
                          className="p-2 bg-red-600/10 text-red-500 hover:bg-red-600/20 rounded-none transition-colors"
                          title="Excluir Usuário"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 bg-[var(--bg-tertiary)] border-t border-[var(--border-color)] text-center">
          <p className="text-xs text-[var(--text-secondary)]">
            Apenas administradores podem gerenciar permissões e usuários.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserManagementModal;
