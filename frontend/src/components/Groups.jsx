import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Check, X, Plus, Users, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const Groups = () => {
  const [groups, setGroups] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [newGroupName, setNewGroupName] = useState('');

  const fetchGroups = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/groups');
      setGroups(res.data.groups);
      setPendingInvites(res.data.pendingInvites);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/groups', { name: newGroupName });
      setNewGroupName('');
      fetchGroups();
    } catch (error) {
      console.error(error);
    }
  };

  const handleAcceptInvite = async (groupId) => {
    try {
      await axios.post(`http://localhost:5000/api/groups/${groupId}/accept`);
      fetchGroups();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8 font-sans">
      <header className="flex items-center gap-4 mb-8">
        <Link to="/" className="p-2 glass-panel rounded-full hover:bg-white/10 transition">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold">Groups & Invites</h1>
      </header>

      {/* Pending Invites */}
      {pendingInvites.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold mb-4 text-emerald-400 uppercase tracking-wider">Pending Invitations</h2>
          <div className="flex flex-col gap-3">
            {pendingInvites.map(invite => (
              <div key={invite._id} className="glass-panel p-4 rounded-2xl flex justify-between items-center border border-emerald-500/30">
                <div>
                  <h3 className="font-bold">{invite.name}</h3>
                  <p className="text-xs text-gray-400">{invite.members.length} members</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleAcceptInvite(invite._id)}
                    className="p-2 bg-emerald-500 hover:bg-emerald-600 rounded-full text-white transition"
                  >
                    <Check size={20} />
                  </button>
                  {/* Assuming reject route exists or just visual for now */}
                  <button className="p-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-full transition">
                    <X size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Group */}
      <form onSubmit={handleCreateGroup} className="glass-panel p-5 rounded-3xl mb-8 flex gap-3">
        <input 
          type="text" 
          placeholder="New Group Name"
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-emerald-500 transition"
          required
        />
        <button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white p-3 rounded-xl transition flex items-center justify-center">
          <Plus size={24} />
        </button>
      </form>

      {/* My Groups */}
      <div>
        <h2 className="text-sm font-semibold mb-4 text-gray-300">My Groups</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {groups.map(group => (
            <div key={group._id} className="glass-panel p-5 rounded-3xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-primary/20 p-3 rounded-2xl">
                  <Users className="text-primary" size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{group.name}</h3>
                  <p className="text-xs text-gray-400">{group.members.length} members</p>
                </div>
              </div>
              <div className="flex -space-x-2 overflow-hidden mb-4 px-1 py-1">
                {group.members.slice(0, 5).map(member => (
                  <div key={member._id} className="flex h-8 w-8 rounded-full ring-2 ring-[#0a0a0a] bg-gradient-to-br from-emerald-400 to-cyan-500 items-center justify-center text-xs font-bold text-black shrink-0" title={member.name}>
                    {member.name ? member.name.charAt(0).toUpperCase() : '?'}
                  </div>
                ))}
              </div>
              <Link to={`/groups/${group._id}`} className="block w-full text-center bg-white/10 hover:bg-white/20 py-2 rounded-xl transition text-sm font-medium">
                View & Add Expenses
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Groups;
