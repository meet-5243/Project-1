import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Check, X, Plus, Users, ArrowLeft, Trash2, Crown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Groups = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const fetchGroups = async () => {
    try {
      const res = await axios.get('/api/groups');
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
      await axios.post('/api/groups', { name: newGroupName });
      setNewGroupName('');
      fetchGroups();
    } catch (error) {
      console.error(error);
    }
  };

  const handleAcceptInvite = async (groupId) => {
    try {
      await axios.post(`/api/groups/${groupId}/accept`);
      fetchGroups();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteGroup = async (groupId, groupName) => {
    const confirmed = window.confirm(
      `⚠️ Delete "${groupName}"?\n\nThis will permanently delete the group and ALL its expenses. This action cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingId(groupId);
    try {
      await axios.delete(`/api/groups/${groupId}`);
      fetchGroups();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to delete group');
      console.error(error);
    } finally {
      setDeletingId(null);
    }
  };

  const isCreator = (group) => {
    if (!user || !group.creator) return false;
    const creatorId = group.creator._id || group.creator;
    return creatorId.toString() === user._id.toString();
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8 font-sans">
      <header className="flex items-center gap-4 mb-8">
        <Link to="/" className="p-2 glass-panel rounded-full hover:bg-white/10 transition">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold">Groups &amp; Invites</h1>
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
                  {invite.creator && (
                    <p className="text-[10px] text-gray-500 mt-0.5">Created by: {invite.creator.name}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAcceptInvite(invite._id)}
                    className="p-2 bg-emerald-500 hover:bg-emerald-600 rounded-full text-white transition"
                  >
                    <Check size={20} />
                  </button>
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
        <h2 className="text-sm font-semibold mb-4 text-gray-300 uppercase tracking-wider">My Groups</h2>
        {groups.length === 0 && (
          <div className="text-center py-12 text-gray-500 text-sm">
            No groups yet. Create one above!
          </div>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          {groups.map(group => (
            <div key={group._id} className="glass-panel p-5 rounded-3xl flex flex-col gap-4">
              {/* Group Header */}
              <div className="flex items-start gap-3">
                <div className="bg-primary/20 p-3 rounded-2xl shrink-0">
                  <Users className="text-primary" size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg truncate">{group.name}</h3>
                    {isCreator(group) && (
                      <Crown size={14} className="text-yellow-400 shrink-0" title="You created this group" />
                    )}
                  </div>
                  <p className="text-xs text-gray-400">{group.members.length} members</p>
                  {group.creator && (
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      Created by: <span className={isCreator(group) ? 'text-yellow-400 font-semibold' : 'text-gray-400'}>
                        {isCreator(group) ? 'You' : group.creator.name}
                      </span>
                    </p>
                  )}
                </div>

                {/* Delete Button — only for creator */}
                {isCreator(group) && (
                  <button
                    onClick={() => handleDeleteGroup(group._id, group.name)}
                    disabled={deletingId === group._id}
                    className="shrink-0 p-2 bg-red-500/10 hover:bg-red-500/25 border border-red-500/20 hover:border-red-500/40 text-red-400 rounded-xl transition disabled:opacity-50"
                    title="Delete Group"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              {/* Member Avatars */}
              <div className="flex -space-x-2 overflow-hidden px-1 py-1">
                {group.members.slice(0, 5).map(member => (
                  <div
                    key={member._id}
                    className="flex h-8 w-8 rounded-full ring-2 ring-[#0a0a0a] bg-gradient-to-br from-emerald-400 to-cyan-500 items-center justify-center text-xs font-bold text-black shrink-0"
                    title={member.name}
                  >
                    {member.name ? member.name.charAt(0).toUpperCase() : '?'}
                  </div>
                ))}
                {group.members.length > 5 && (
                  <div className="flex h-8 w-8 rounded-full ring-2 ring-[#0a0a0a] bg-white/10 items-center justify-center text-xs font-bold text-gray-400 shrink-0">
                    +{group.members.length - 5}
                  </div>
                )}
              </div>

              {/* View Button */}
              <Link
                to={`/groups/${group._id}`}
                className="block w-full text-center bg-white/10 hover:bg-white/20 py-2 rounded-xl transition text-sm font-medium"
              >
                View &amp; Add Expenses
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Groups;
