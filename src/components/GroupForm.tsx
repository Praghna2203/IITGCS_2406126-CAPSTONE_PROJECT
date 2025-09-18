import React, { useState, useEffect } from 'react';
import { Group, GroupMember } from '../types';
import { X, Plus, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { getCurrentUser } from '../utils/storage';

interface GroupFormProps {
  group?: Group | null;
  onSave: (group: Group) => void;
  onCancel: () => void;
}

const GroupForm: React.FC<GroupFormProps> = ({ group, onSave, onCancel }) => {
  const [name, setName] = useState(group?.name || '');
  const [description, setDescription] = useState(group?.description || '');
  const [members, setMembers] = useState<GroupMember[]>(group?.members || []);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');

  const currentUser = getCurrentUser();

  useEffect(() => {
    // Ensure current user is always in the group
    if (!members.some(m => m.userId === currentUser.id)) {
      const currentUserMember: GroupMember = {
        userId: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        joinedAt: new Date().toISOString()
      };
      setMembers([currentUserMember]);
    }
  }, [currentUser, members]);

  const handleAddMember = () => {
    if (!newMemberName.trim() || !newMemberEmail.trim()) return;
    
    // Check if member already exists
    if (members.some(m => m.email.toLowerCase() === newMemberEmail.toLowerCase())) {
      alert('A member with this email already exists');
      return;
    }

    const newMember: GroupMember = {
      userId: uuidv4(), // In real app, this would be the actual user ID
      name: newMemberName.trim(),
      email: newMemberEmail.trim().toLowerCase(),
      joinedAt: new Date().toISOString()
    };

    setMembers([...members, newMember]);
    setNewMemberName('');
    setNewMemberEmail('');
  };

  const handleRemoveMember = (userId: string) => {
    // Don't allow removing the current user
    if (userId === currentUser.id) {
      alert("You can't remove yourself from the group");
      return;
    }
    
    setMembers(members.filter(m => m.userId !== userId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      alert('Group name is required');
      return;
    }

    if (members.length < 2) {
      alert('Group must have at least 2 members');
      return;
    }

    const newGroup: Group = {
      id: group?.id || uuidv4(),
      name: name.trim(),
      description: description.trim(),
      members,
      createdBy: currentUser.id,
      createdAt: group?.createdAt || new Date().toISOString()
    };

    onSave(newGroup);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {group ? 'Edit Group' : 'Create New Group'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Group Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Trip to Paris, Apartment 4B"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Brief description of the group"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Group Members ({members.length})
            </label>
            
            {/* Current Members */}
            <div className="space-y-2 mb-4">
              {members.map(member => (
                <div key={member.userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div>
                    <p className="font-medium text-gray-900">
                      {member.name}
                      {member.userId === currentUser.id && (
                        <span className="text-xs text-blue-600 ml-2">(You)</span>
                      )}
                    </p>
                    <p className="text-sm text-gray-600">{member.email}</p>
                  </div>
                  {member.userId !== currentUser.id && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(member.userId)}
                      className="text-red-600 hover:text-red-700 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add New Member */}
            <div className="border border-gray-300 rounded-md p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Add Member</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="Member name"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="flex space-x-2">
                  <input
                    type="email"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    placeholder="Email address"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={handleAddMember}
                    disabled={!newMemberName.trim() || !newMemberEmail.trim()}
                    className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Note: In a real app, members would be invited via email and create their own accounts
              </p>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              {group ? 'Update Group' : 'Create Group'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GroupForm;