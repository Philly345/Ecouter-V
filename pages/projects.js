import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../components/AuthContext';
import Sidebar from '../components/Sidebar';
import { FiPlus, FiFolder, FiUsers, FiFileText } from 'react-icons/fi';

export default function Projects() {
  const router = useRouter();
  const { user, logout, authChecked, authLoading } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (authChecked && !user) {
      router.push('/login');
      return;
    }
    
    if (user) {
      fetchProjects();
    }
  }, [user, router, authChecked]);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/projects', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <>
      <Head>
        <title>Projects - Ecouter Transcribe</title>
        <meta name="description" content="Manage your transcription projects and collaborate with team members." />
      </Head>

      <div className="min-h-screen bg-black text-white">
        <Sidebar 
          user={user} 
          currentPage="projects"
          onLogout={logout}
          onSidebarToggle={(collapsed) => setSidebarCollapsed(collapsed)} 
        />
        
        <div className={`p-6 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'lg:ml-64'}`}>
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-2">Projects</h1>
            <p className="text-white/60 text-sm">
              Organize your transcriptions into collaborative projects
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="spinner w-8 h-8"></div>
            </div>
          ) : (
            <div className="text-center py-12">
              <FiFolder className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No projects yet</h3>
              <p className="text-white/60 mb-6 text-sm">
                Create your first project to organize your transcriptions
              </p>
              <button className="bg-white text-black px-6 py-3 rounded-lg text-sm font-medium">
                <FiPlus className="w-4 h-4 inline mr-2" />
                Create Project
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}