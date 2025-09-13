import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../components/AuthContext';
import Sidebar from '../../components/Sidebar';
import { FiFolder, FiUsers, FiFileText, FiSettings } from 'react-icons/fi';

export default function ProjectDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { user, logout, authChecked, authLoading } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (authChecked && !user) {
      router.push('/login');
      return;
    }
    
    if (user && id) {
      fetchProject();
    }
  }, [user, router, authChecked, id]);

  const fetchProject = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/projects/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProject(data.project);
      } else {
        router.push('/projects');
      }
    } catch (error) {
      console.error('Failed to fetch project:', error);
      router.push('/projects');
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
        <title>{project ? `${project.name} - Projects` : 'Project'} - Ecouter Transcribe</title>
        <meta name="description" content="View and manage project details and transcriptions." />
      </Head>

      <div className="min-h-screen bg-black text-white">
        <Sidebar 
          user={user} 
          currentPage="projects"
          onLogout={logout}
          onSidebarToggle={(collapsed) => setSidebarCollapsed(collapsed)} 
        />
        
        <div className={`p-6 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'lg:ml-64'}`}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="spinner w-8 h-8"></div>
            </div>
          ) : project ? (
            <div>
              <div className="mb-8">
                <h1 className="text-2xl font-bold mb-2">{project.name}</h1>
                <p className="text-white/60 text-sm">{project.description}</p>
              </div>

              <div className="text-center py-12">
                <FiFileText className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No transcriptions</h3>
                <p className="text-white/60 text-sm">
                  Upload files to this project to get started
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-white mb-2">Project not found</h3>
              <p className="text-white/60 text-sm">The project you're looking for doesn't exist.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}