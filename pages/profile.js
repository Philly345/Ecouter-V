import Head from 'next/head';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../components/AuthContext';
import Sidebar from '../components/Sidebar';
import { FiEdit2, FiSave, FiX, FiCamera, FiTrash2, FiEye, FiEyeOff, FiUser, FiMail, FiCalendar, FiGlobe, FiCheck } from 'react-icons/fi';
import { toast } from 'react-toastify';

// Countries list
const COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan',
  'Bahrain', 'Bangladesh', 'Belarus', 'Belgium', 'Bolivia', 'Bosnia and Herzegovina', 'Brazil', 'Bulgaria',
  'Cambodia', 'Canada', 'Chile', 'China', 'Colombia', 'Costa Rica', 'Croatia', 'Czech Republic',
  'Denmark', 'Dominican Republic', 'Ecuador', 'Egypt', 'Estonia', 'Ethiopia',
  'Finland', 'France', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Guatemala',
  'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy',
  'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kuwait', 'Latvia', 'Lebanon', 'Libya', 'Lithuania', 'Luxembourg',
  'Malaysia', 'Mexico', 'Morocco', 'Netherlands', 'New Zealand', 'Nigeria', 'Norway',
  'Pakistan', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia',
  'Saudi Arabia', 'Singapore', 'South Africa', 'South Korea', 'Spain', 'Sri Lanka', 'Sweden', 'Switzerland',
  'Thailand', 'Turkey', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Venezuela', 'Vietnam'
];

export default function Profile() {
  const router = useRouter();
  const { user, authChecked, authLoading, logout, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const fileInputRef = useRef(null);
  
  // Profile form state
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    userId: '',
    createdAt: '',
    avatar: '',
    country: '',
    dateOfBirth: ''
  });
  
  // Edit states
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingCountry, setIsEditingCountry] = useState(false);
  const [isEditingDateOfBirth, setIsEditingDateOfBirth] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  
  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  // Delete account confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  
  // Save changes tracking
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalData, setOriginalData] = useState({});

  useEffect(() => {
    if (authChecked && !user) {
      router.push('/login');
      return;
    }
    
    if (user) {
      const userData = {
        name: user.name || '',
        email: user.email || '',
        userId: user._id || user.id || '',
        createdAt: user.createdAt || '',
        avatar: user.avatar || '',
        country: user.country || '',
        dateOfBirth: user.dateOfBirth || ''
      };
      setProfileData(userData);
      setOriginalData(userData);
    }
  }, [user, router, authChecked]);

  // Track changes
  useEffect(() => {
    const hasChanges = JSON.stringify(profileData) !== JSON.stringify(originalData);
    setHasUnsavedChanges(hasChanges);
  }, [profileData, originalData]);

  if (!authChecked || authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="spinner w-8 h-8"></div>
      </div>
    );
  }

  if (authChecked && !user) {
    router.push('/login');
    return null;
  }

  const handleSaveAllChanges = async () => {
    const changes = {};
    
    if (profileData.name !== originalData.name) changes.name = profileData.name;
    if (profileData.country !== originalData.country) changes.country = profileData.country;
    if (profileData.dateOfBirth !== originalData.dateOfBirth) changes.dateOfBirth = profileData.dateOfBirth;
    
    if (Object.keys(changes).length === 0) {
      toast.info('No changes to save');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(changes)
      });

      if (response.ok) {
        const updatedUser = await response.json();
        updateUser(updatedUser.user);
        setOriginalData(profileData);
        setHasUnsavedChanges(false);
        toast.success('Profile updated successfully');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update profile');
      }
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleNameUpdate = async () => {
    if (!profileData.name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: profileData.name })
      });

      if (response.ok) {
        const updatedUser = await response.json();
        updateUser(updatedUser.user);
        setIsEditingName(false);
        toast.success('Name updated successfully');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update name');
      }
    } catch (error) {
      toast.error('Failed to update name');
    } finally {
      setLoading(false);
    }
  };

  const handleCountryUpdate = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ country: profileData.country })
      });

      if (response.ok) {
        const updatedUser = await response.json();
        updateUser(updatedUser.user);
        setIsEditingCountry(false);
        toast.success('Country updated successfully');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update country');
      }
    } catch (error) {
      toast.error('Failed to update country');
    } finally {
      setLoading(false);
    }
  };

  const handleDateOfBirthUpdate = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ dateOfBirth: profileData.dateOfBirth })
      });

      if (response.ok) {
        const updatedUser = await response.json();
        updateUser(updatedUser.user);
        setIsEditingDateOfBirth(false);
        toast.success('Date of birth updated successfully');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update date of birth');
      }
    } catch (error) {
      toast.error('Failed to update date of birth');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('All password fields are required');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      if (response.ok) {
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setIsEditingPassword(false);
        toast.success('Password changed successfully');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to change password');
      }
    } catch (error) {
      toast.error('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (file) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/upload-avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        const updatedUserData = { ...user, avatar: result.avatarUrl };
        updateUser(updatedUserData);
        setProfileData(prev => ({ ...prev, avatar: result.avatarUrl }));
        toast.success('Profile picture updated successfully');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to upload profile picture');
      }
    } catch (error) {
      toast.error('Failed to upload profile picture');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast.error('Please type "DELETE" to confirm');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/delete-account', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('Account deleted successfully');
        logout();
        router.push('/');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to delete account');
      }
    } catch (error) {
      toast.error('Failed to delete account');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <Head>
        <title>Profile - Kilo</title>
      </Head>

      <div className="min-h-screen bg-black text-white">
        <Sidebar 
          user={user} 
          currentPage="profile" 
          onLogout={logout}
          onSidebarToggle={(collapsed) => setSidebarCollapsed(collapsed)}
        />
        
        <div className={`p-6 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'lg:ml-64'} min-h-screen`}>
          {/* Header */}
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold gradient-text mb-2">Profile Settings</h1>
              <p className="text-white/60">Manage your account settings and preferences</p>
            </div>
            {hasUnsavedChanges && (
              <button
                onClick={handleSaveAllChanges}
                disabled={loading}
                className="px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-lg transition-all disabled:opacity-50 font-medium shadow-sm text-sm flex items-center space-x-2"
              >
                <FiCheck className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            )}
          </div>

          {/* Top Row - Profile Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Profile Picture Card */}
            <div className="file-card rounded-xl p-6">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-6">
                  {profileData.avatar ? (
                    <img 
                      src={profileData.avatar} 
                      alt={profileData.name} 
                      className="w-28 h-28 rounded-full object-cover border-2 border-white/10 shadow-lg"
                    />
                  ) : (
                    <div className="w-28 h-28 bg-white/5 rounded-full flex items-center justify-center border-2 border-white/10 shadow-lg">
                      <span className="text-3xl font-bold text-white">{profileData.name?.[0]?.toUpperCase()}</span>
                    </div>
                  )}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 bg-white hover:bg-gray-100 text-black p-3 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl"
                    disabled={loading}
                  >
                    <FiCamera className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">{profileData.name || 'User'}</h3>
                <p className="text-white/60 text-sm mb-4">{profileData.email}</p>
                <div className="text-center">
                  <p className="text-xs text-white/50 mb-1">
                    Upload new profile picture
                  </p>
                  <p className="text-xs text-white/40">
                    Max 5MB • JPG, PNG, GIF
                  </p>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleAvatarUpload(e.target.files[0])}
                className="hidden"
              />
            </div>

            {/* Basic Information Card */}
            <div className="lg:col-span-2">
              <div className="file-card rounded-xl p-6 h-full">
                <div className="flex items-center mb-6">
                  <FiUser className="w-5 h-5 mr-3 text-white/60" />
                  <h2 className="text-xl font-semibold text-white">Personal Information</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Display Name */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-white/70">Display Name</label>
                    <div className="flex items-center space-x-2">
                      {isEditingName ? (
                        <>
                          <input
                            type="text"
                            value={profileData.name}
                            onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                            className="flex-1 px-4 py-3 bg-white/5 border border-white/20 rounded-lg focus:ring-2 focus:ring-white/20 focus:border-white/30 text-white transition-all text-sm"
                            placeholder="Enter your name"
                          />
                          <button
                            onClick={handleNameUpdate}
                            disabled={loading}
                            className="p-2 bg-white hover:bg-gray-100 text-black rounded-lg transition-all disabled:opacity-50 shadow-sm"
                          >
                            <FiSave className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => {
                              setIsEditingName(false);
                              setProfileData(prev => ({ ...prev, name: user.name || '' }));
                            }}
                            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
                          >
                            <FiX className="w-3 h-3" />
                          </button>
                        </>
                      ) : (
                        <>
                          <input
                            type="text"
                            value={profileData.name}
                            readOnly
                            className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg cursor-not-allowed text-white text-sm"
                          />
                          <button
                            onClick={() => setIsEditingName(true)}
                            className="p-1.5 bg-white hover:bg-gray-100 text-black rounded-md transition-all shadow-sm"
                          >
                            <FiEdit2 className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-white/70">Email Address</label>
                    <div className="relative">
                      <input
                        type="email"
                        value={profileData.email}
                        readOnly
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white/60 cursor-not-allowed text-sm"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <span className="text-xs bg-white/10 text-white/60 px-2 py-1 rounded">Read-only</span>
                      </div>
                    </div>
                  </div>

                  {/* User ID */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-white/70">User ID</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={profileData.userId}
                        readOnly
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white/60 cursor-not-allowed text-xs font-mono"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <span className="text-xs bg-white/10 text-white/60 px-2 py-1 rounded">Read-only</span>
                      </div>
                    </div>
                  </div>

                  {/* Member Since */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-white/70">Member Since</label>
                    <input
                      type="text"
                      value={formatDate(profileData.createdAt)}
                      readOnly
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white/60 cursor-not-allowed text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Second Row - Additional Details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Additional Info Card */}
            <div className="file-card rounded-xl p-6">
              <div className="flex items-center mb-6">
                <FiGlobe className="w-5 h-5 mr-3 text-white/60" />
                <h2 className="text-xl font-semibold text-white">Additional Details</h2>
              </div>
              
              <div className="space-y-6">
                {/* Country */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white/70">Country</label>
                  <div className="flex items-center space-x-2">
                    {isEditingCountry ? (
                      <>
                        <select
                          value={profileData.country}
                          onChange={(e) => setProfileData(prev => ({ ...prev, country: e.target.value }))}
                          className="flex-1 px-4 py-3 bg-white/5 border border-white/20 rounded-lg focus:ring-2 focus:ring-white/20 focus:border-white/30 text-white transition-all text-sm"
                        >
                          <option value="" className="bg-black text-white">Select a country</option>
                          {COUNTRIES.map(country => (
                            <option key={country} value={country} className="bg-black text-white">
                              {country}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={handleCountryUpdate}
                          disabled={loading}
                          className="p-2 bg-white hover:bg-gray-100 text-black rounded-lg transition-all disabled:opacity-50 shadow-sm"
                        >
                          <FiSave className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => {
                            setIsEditingCountry(false);
                            setProfileData(prev => ({ ...prev, country: user.country || '' }));
                          }}
                          className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
                        >
                          <FiX className="w-3 h-3" />
                        </button>
                      </>
                    ) : (
                      <>
                        <input
                          type="text"
                          value={profileData.country || 'Not specified'}
                          readOnly
                          className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg cursor-not-allowed text-white text-sm"
                        />
                        <button
                          onClick={() => setIsEditingCountry(true)}
                          className="p-1.5 bg-white hover:bg-gray-100 text-black rounded-md transition-all shadow-sm"
                        >
                          <FiEdit2 className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>
                  {!profileData.country && (
                    <p className="text-xs text-white/40">Click edit to select your country</p>
                  )}
                </div>

                {/* Date of Birth */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white/70">Date of Birth</label>
                  <div className="flex items-center space-x-2">
                    {isEditingDateOfBirth ? (
                      <>
                        <input
                          type="date"
                          value={profileData.dateOfBirth}
                          onChange={(e) => setProfileData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                          className="flex-1 px-4 py-3 bg-white/5 border border-white/20 rounded-lg focus:ring-2 focus:ring-white/20 focus:border-white/30 text-white transition-all text-sm"
                          max={new Date().toISOString().split('T')[0]}
                        />
                        <button
                          onClick={handleDateOfBirthUpdate}
                          disabled={loading}
                          className="p-2 bg-white hover:bg-gray-100 text-black rounded-lg transition-all disabled:opacity-50 shadow-sm"
                        >
                          <FiSave className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => {
                            setIsEditingDateOfBirth(false);
                            setProfileData(prev => ({ ...prev, dateOfBirth: user.dateOfBirth || '' }));
                          }}
                          className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
                        >
                          <FiX className="w-3 h-3" />
                        </button>
                      </>
                    ) : (
                      <>
                        <input
                          type="text"
                          value={profileData.dateOfBirth ? new Date(profileData.dateOfBirth).toLocaleDateString() : 'Not specified'}
                          readOnly
                          className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg cursor-not-allowed text-white text-sm"
                        />
                        <button
                          onClick={() => setIsEditingDateOfBirth(true)}
                          className="p-1.5 bg-white hover:bg-gray-100 text-black rounded-md transition-all shadow-sm"
                        >
                          <FiEdit2 className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>
                  {!profileData.dateOfBirth && (
                    <p className="text-xs text-white/40">Click edit to set your birth date</p>
                  )}
                </div>
              </div>
            </div>

            {/* Account Management Card */}
            <div className="lg:col-span-2">
              <div className="file-card rounded-xl p-6 h-full">
                <div className="flex items-center mb-6">
                  <FiTrash2 className="w-5 h-5 mr-3 text-red-400" />
                  <h2 className="text-xl font-semibold text-white">Account Management</h2>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2 text-white">Delete Account</h3>
                    <p className="text-white/60 mb-6 text-sm leading-relaxed">
                      Once you delete your account, there is no going back. This will permanently delete your account and all associated data including transcripts, files, and settings.
                    </p>
                    {!showDeleteConfirm ? (
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-all text-white font-medium shadow-sm text-sm"
                      >
                        Delete Account
                      </button>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-white/70">
                            Type <span className="font-mono bg-white/10 px-2 py-1 rounded text-red-400">DELETE</span> to confirm
                          </label>
                          <input
                            type="text"
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                            className="w-full px-4 py-3 bg-white/5 border border-red-600/50 rounded-lg focus:ring-2 focus:ring-red-500/30 focus:border-red-500 text-white transition-all"
                            placeholder="Type DELETE to confirm"
                          />
                        </div>
                        <div className="flex flex-col space-y-2 justify-end">
                          <button
                            onClick={handleDeleteAccount}
                            disabled={loading || deleteConfirmText !== 'DELETE'}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-all disabled:opacity-50 text-white font-medium flex items-center justify-center text-sm"
                          >
                            <FiTrash2 className="w-3 h-3 mr-2" />
                            Delete Account
                          </button>
                          <button
                            onClick={() => {
                              setShowDeleteConfirm(false);
                              setDeleteConfirmText('');
                            }}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all text-white text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Third Row - Security Settings */}
          <div className="grid grid-cols-1 gap-6">
            {/* Password Change Card */}
            <div className="file-card rounded-xl p-6">
              <div className="flex items-center mb-6">
                <FiEye className="w-5 h-5 mr-3 text-white/60" />
                <h2 className="text-xl font-semibold text-white">Security Settings</h2>
              </div>
              
              {!isEditingPassword ? (
                <div className="text-center py-8">
                  <p className="text-white/60 mb-6">Keep your account secure by updating your password regularly</p>
                  <button
                    onClick={() => setIsEditingPassword(true)}
                    className="px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-lg transition-all font-medium shadow-sm text-sm"
                  >
                    Change Password
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-white/70">Current Password</label>
                    <div className="relative">
                      <input
                        type={showPasswords.current ? "text" : "password"}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/20 rounded-lg focus:ring-2 focus:ring-white/20 focus:border-white/30 text-white transition-all"
                        placeholder="Current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                      >
                        {showPasswords.current ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-white/70">New Password</label>
                    <div className="relative">
                      <input
                        type={showPasswords.new ? "text" : "password"}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/20 rounded-lg focus:ring-2 focus:ring-white/20 focus:border-white/30 text-white transition-all"
                        placeholder="New password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                      >
                        {showPasswords.new ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-white/70">Confirm Password</label>
                    <div className="relative">
                      <input
                        type={showPasswords.confirm ? "text" : "password"}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/20 rounded-lg focus:ring-2 focus:ring-white/20 focus:border-white/30 text-white transition-all"
                        placeholder="Confirm password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                      >
                        {showPasswords.confirm ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="md:col-span-3 flex justify-center space-x-3 pt-4">
                    <button
                      onClick={handlePasswordChange}
                      disabled={loading}
                      className="px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-lg transition-all disabled:opacity-50 font-medium shadow-sm text-sm"
                    >
                      Update Password
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingPassword(false);
                        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                      }}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all text-white text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
