import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const FacultyManagement = () => {
    const { token } = useAuth();
    
    // Faculty List
    const [faculty, setFaculty] = useState([]);
    const [facLoading, setFacLoading] = useState(true);
    
    // Tokens
    const [tokens, setTokens] = useState([]);
    const [tokenLoading, setTokenLoading] = useState(true);
    const [tokenExpiry, setTokenExpiry] = useState(24);
    const [generating, setGenerating] = useState(false);
    
    // Messages
    const [message, setMessage] = useState({ text: '', type: '' });

    // Mapping Modal
    const [mappingModal, setMappingModal] = useState({ isOpen: false, facultyId: null, facultyName: '' });
    const [subjects, setSubjects] = useState([]);
    const [sections, setSections] = useState([]);
    const [currentMappings, setCurrentMappings] = useState([]); // Array of IDs currently mapped
    const [mappingLoading, setMappingLoading] = useState(false);
    
    // Creation Modal
    const [creationModal, setCreationModal] = useState({ isOpen: false, loading: false });
    const [creationData, setCreationData] = useState({
        name: '', email: '', password: '', employee_id: '',
        department: '', designation: '', phone_number: ''
    });
    const [profilePic, setProfilePic] = useState(null);

    useEffect(() => {
        if (token) {
            fetchFaculty();
            fetchTokens();
            fetchMappingData();
        }
    }, [token]);

    const fetchMappingData = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/academic-setup/setup-data', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setSubjects(res.data.data.subjects);
                setSections(res.data.data.sections);
            }
        } catch (e) {
            console.error("Failed to fetch mapping data:", e);
        }
    };

    const fetchFaculty = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/admin/faculty', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setFaculty(res.data.data);
            }
        } catch (e) {
            console.error("Failed to fetch faculty list:", e);
        } finally {
            setFacLoading(false);
        }
    };

    const fetchTokens = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/faculty-tokens', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setTokens(res.data.data);
            }
        } catch (e) {
            console.error("Failed to fetch tokens:", e);
        } finally {
            setTokenLoading(false);
        }
    };

    const handleGenerateLink = async () => {
        setGenerating(true);
        setMessage({text:'', type:''});
        try {
            const res = await axios.post('http://localhost:5000/api/faculty-tokens/generate', 
                { expiry_hours: tokenExpiry },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.data.success) {
                setMessage({ text: 'Link generated successfully! Copied to clipboard.', type: 'success' });
                navigator.clipboard.writeText(res.data.link);
                fetchTokens();
            }
        } catch (e) {
            setMessage({ text: 'Failed to generate link.', type: 'error' });
        } finally {
            setGenerating(false);
        }
    };

    const handleCreateFaculty = async (e) => {
        e.preventDefault();
        setCreationModal(prev => ({ ...prev, loading: true }));
        try {
            const formData = new FormData();
            Object.keys(creationData).forEach(key => formData.append(key, creationData[key]));
            if (profilePic) formData.append('profile_pic', profilePic);

            // POST /api/admin/faculty
            const res = await axios.post('http://localhost:5000/api/admin/faculty', formData, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (res.data.success) {
                setMessage({ text: 'Faculty profile created successfully.', type: 'success' });
                setCreationModal({ isOpen: false, loading: false });
                setCreationData({ name: '', email: '', password: '', employee_id: '', department: '', designation: '', phone_number: '' });
                setProfilePic(null);
                fetchFaculty();
            }
        } catch (e) {
            setMessage({ text: e.response?.data?.message || 'Failed to create faculty profile.', type: 'error' });
        } finally {
            setCreationModal(prev => ({ ...prev, loading: false }));
        }
    };

    const handleRevoke = async (id) => {
        try {
            const res = await axios.patch(`http://localhost:5000/api/faculty-tokens/${id}/revoke`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setMessage({ text: 'Token revoked successfully.', type: 'success' });
                fetchTokens();
            }
        } catch (e) {
            setMessage({ text: 'Failed to revoke token.', type: 'error' });
        }
    };

    const openMapping = async (f) => {
        setMappingModal({ isOpen: true, facultyId: f.id, facultyName: f.name });
        setMappingLoading(true);
        try {
            // Fetch current mappings for this faculty
            const res = await axios.get(`http://localhost:5000/api/academic-setup/faculty/${f.id}/mappings`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                // Mapping should be array of objects: { mapping_id, subject_id, section_id }
                setCurrentMappings(res.data.data);
            }
        } catch (e) {
            console.error("Failed to fetch faculty mappings:", e);
        } finally {
            setMappingLoading(false);
        }
    };

    const toggleMapping = (subjectId, sectionId) => {
        const index = currentMappings.findIndex(m => m.subject_id === subjectId && m.section_id === sectionId);
        if (index > -1) {
            setCurrentMappings(prev => prev.filter((_, i) => i !== index));
        } else {
            setCurrentMappings(prev => [...prev, { subject_id: subjectId, section_id: sectionId }]);
        }
    };

    const saveMappings = async () => {
        setMappingLoading(true);
        try {
            await axios.post(`http://localhost:5000/api/academic-setup/faculty/${mappingModal.facultyId}/mappings`, 
                { mappings: currentMappings },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setMessage({ text: `Mappings updated for ${mappingModal.facultyName}`, type: 'success' });
            setMappingModal({ isOpen: false, facultyId: null, facultyName: '' });
        } catch (e) {
            console.error("Save mappings failed:", e);
            setMessage({ text: 'Failed to save mappings', type: 'error' });
        } finally {
            setMappingLoading(false);
        }
    };

    const handleCopy = (t) => {
        const link = `http://localhost:5173/register-faculty?token=${t}`;
        navigator.clipboard.writeText(link);
        setMessage({ text: 'Link re-copied to clipboard.', type: 'success' });
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header>
                <h1 className="text-3xl font-black text-textPrimary tracking-tight uppercase">Faculty Network</h1>
                <p className="text-textSecondary mt-1 font-medium">Manage active faculty and securely onboard new staff securely.</p>
            </header>

            {/* Notification */}
            {message.text && (
                <div className={`p-4 rounded-xl flex items-center justify-between ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
                    <span className="text-sm font-bold">{message.text}</span>
                    <button onClick={() => setMessage({text:'', type:''})} className="opacity-50 hover:opacity-100">✕</button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Secure Links Card */}
                <div className="lg:col-span-1 border border-border bg-surface/50 p-6 rounded-3xl h-fit">
                    <h2 className="text-sm font-black uppercase tracking-widest text-primary mb-4">Generate Access Token</h2>
                    <p className="text-xs text-textSecondary mb-6 font-medium">Faculty profiles are strictly invite-only. Generate a secure, expiring link to manually onboard new staff.</p>
                    
                    <div className="space-y-4">
                        <select 
                            value={tokenExpiry}
                            onChange={(e) => setTokenExpiry(Number(e.target.value))}
                            className="bg-background border border-border w-full p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-bold text-textPrimary"
                        >
                            <option value={1}>Expires in 1 Hour</option>
                            <option value={24}>Expires in 24 Hours</option>
                            <option value={168}>Expires in 7 Days</option>
                        </select>
                        <button 
                            onClick={handleGenerateLink}
                            disabled={generating}
                            className="w-full bg-primary text-white p-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                        >
                            {generating ? 'Generating...' : 'Create Invite Link'}
                        </button>
                    </div>

                    <div className="mt-8">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-textSecondary mb-3">Active Tokens</h3>
                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {tokenLoading ? (
                                <p className="text-xs text-textSecondary italic animate-pulse">Loading links...</p>
                            ) : tokens.length === 0 ? (
                                <p className="text-xs text-textSecondary italic">No active tokens.</p>
                            ) : (
                                tokens.map(t => {
                                    const isExpired = new Date(t.expiry_date) < new Date();
                                    const isDead = t.is_used || isExpired;
                                    return (
                                        <div key={t.id} className={`p-4 border rounded-2xl ${isDead ? 'border-rose-500/20 bg-rose-500/5' : 'border-emerald-500/30 bg-emerald-500/5'}`}>
                                            <div className="flex justify-between items-start mb-2">
                                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${t.is_used ? 'bg-rose-500 text-white' : isExpired ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'}`}>
                                                    {t.is_used ? 'Claimed' : isExpired ? 'Expired' : 'Active'}
                                                </span>
                                                {!isDead && (
                                                    <div className="flex gap-2">
                                                        <button onClick={() => handleCopy(t.token)} className="text-[10px] text-primary font-black uppercase hover:underline">Copy</button>
                                                        <button onClick={() => handleRevoke(t.id)} className="text-[10px] text-rose-500 font-black uppercase hover:underline">Revoke</button>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="font-mono text-xs truncate max-w-[200px] text-textPrimary opacity-70 mb-1">{t.token}</div>
                                            <div className="text-[10px] text-textSecondary">
                                                Created explicitly by admin.<br/>
                                                Expires: {new Date(t.expiry_date).toLocaleString()}
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* Faculty Roster */}
                <div className="lg:col-span-2 border border-border bg-surface/50 p-6 rounded-3xl relative">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-sm font-black uppercase tracking-widest text-textPrimary">Active Faculty Roster</h2>
                        <button 
                            onClick={() => setCreationModal({ isOpen: true, loading: false })}
                            className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                        >
                            + Create Profile
                        </button>
                    </div>

                    {creationModal.isOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
                            <div className="bg-surface border border-border w-full max-w-2xl rounded-3xl shadow-2xl p-8 overflow-y-auto max-h-[90vh]">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-black uppercase tracking-tighter text-textPrimary">Create Faculty Profile</h3>
                                    <button onClick={() => setCreationModal({ isOpen: false, loading: false })} className="text-textSecondary hover:text-rose-500 transition-colors">✕</button>
                                </div>

                                <form onSubmit={handleCreateFaculty} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-textSecondary ml-1">Full Name</label>
                                            <input required type="text" value={creationData.name} onChange={(e) => setCreationData(prev => ({ ...prev, name: e.target.value }))} className="w-full bg-background border border-border p-3 rounded-xl text-sm focus:border-primary outline-none" placeholder="e.g. Dr. Jane Smith" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-textSecondary ml-1">Email Address</label>
                                            <input required type="email" value={creationData.email} onChange={(e) => setCreationData(prev => ({ ...prev, email: e.target.value }))} className="w-full bg-background border border-border p-3 rounded-xl text-sm focus:border-primary outline-none" placeholder="jane.smith@university.edu" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-textSecondary ml-1">Temporary Password</label>
                                            <input required type="password" value={creationData.password} onChange={(e) => setCreationData(prev => ({ ...prev, password: e.target.value }))} className="w-full bg-background border border-border p-3 rounded-xl text-sm focus:border-primary outline-none" placeholder="••••••••" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-textSecondary ml-1">Employee ID</label>
                                            <input required type="text" value={creationData.employee_id} onChange={(e) => setCreationData(prev => ({ ...prev, employee_id: e.target.value }))} className="w-full bg-background border border-border p-3 rounded-xl text-sm focus:border-primary outline-none" placeholder="FAC-2024-001" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-textSecondary ml-1">Department</label>
                                            <input type="text" value={creationData.department} onChange={(e) => setCreationData(prev => ({ ...prev, department: e.target.value }))} className="w-full bg-background border border-border p-3 rounded-xl text-sm focus:border-primary outline-none" placeholder="e.g. Computer Science" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-textSecondary ml-1">Designation</label>
                                            <input type="text" value={creationData.designation} onChange={(e) => setCreationData(prev => ({ ...prev, designation: e.target.value }))} className="w-full bg-background border border-border p-3 rounded-xl text-sm focus:border-primary outline-none" placeholder="e.g. Associate Professor" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-textSecondary ml-1">Phone Number</label>
                                            <input type="text" value={creationData.phone_number} onChange={(e) => setCreationData(prev => ({ ...prev, phone_number: e.target.value }))} className="w-full bg-background border border-border p-3 rounded-xl text-sm focus:border-primary outline-none" placeholder="+91 98765 43210" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-textSecondary ml-1">Profile Picture</label>
                                            <input type="file" accept="image/*" onChange={(e) => setProfilePic(e.target.files[0])} className="w-full bg-background border border-border p-2.5 rounded-xl text-[10px] file:bg-primary/10 file:border-none file:text-primary file:px-3 file:py-1 file:rounded-lg" />
                                        </div>
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <button 
                                            type="button"
                                            onClick={() => setCreationModal({ isOpen: false, loading: false })}
                                            className="flex-1 p-3 border border-border text-textSecondary rounded-xl text-xs font-black uppercase tracking-widest hover:bg-background transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            type="submit"
                                            disabled={creationModal.loading}
                                            className="flex-3 p-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                                        >
                                            {creationModal.loading ? 'Creating...' : 'Create Faculty Profile'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {facLoading ? (
                        <div className="flex justify-center p-10"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {faculty.map(f => (
                                <div key={f.id} className="bg-background border border-border p-4 rounded-2xl hover:border-primary/40 transition-colors group">
                                    <div className="flex items-center gap-4 mb-3">
                                        <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center text-lg font-black group-hover:bg-primary group-hover:text-white transition-colors overflow-hidden">
                                            {f.profile_pic_url ? (
                                                <img src={`http://localhost:5000${f.profile_pic_url}`} alt={f.name} className="w-full h-full object-cover" />
                                            ) : (
                                                "👨‍🏫"
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-textPrimary">{f.name}</h3>
                                            <span className="text-[10px] text-textSecondary font-black uppercase tracking-widest">{f.employee_id}</span>
                                        </div>
                                    </div>
                                    <div className="text-xs space-y-1 text-textSecondary font-medium mb-4">
                                        <p>Dept: <span className="text-textPrimary">{f.department || 'Unassigned'}</span></p>
                                        <p>Designation: <span className="text-textPrimary">{f.designation || 'Lecturer'}</span></p>
                                        <p>Contact: <span className="text-textPrimary">{f.phone_number || 'No file'}</span></p>
                                    </div>
                                    <button 
                                        onClick={() => openMapping(f)}
                                        className="w-full py-2 bg-secondary/30 hover:bg-primary hover:text-white text-primary text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
                                    >
                                        Map Subjects
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Mapping Modal */}
            {mappingModal.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-border">
                        <div className="p-8 border-b border-border flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Assign Subjects</h2>
                                <p className="text-slate-500 text-sm font-medium">Mapping subjects and sections for <span className="text-primary font-bold">{mappingModal.facultyName}</span></p>
                            </div>
                            <button onClick={() => setMappingModal({ isOpen: false })} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">✕</button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                            {mappingLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-slate-400 font-bold text-xs uppercase">Syncing Assignments...</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {subjects.map(sub => (
                                        <div key={sub.id} className="border border-border rounded-3xl p-5 bg-slate-50/30">
                                            <div className="mb-4">
                                                <div className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">{sub.code}</div>
                                                <h4 className="font-bold text-slate-800 leading-tight">{sub.name}</h4>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {sections.map(sec => {
                                                    const isSelected = currentMappings.some(m => m.subject_id === sub.id && m.section_id === sec.id);
                                                    return (
                                                        <button 
                                                            key={sec.id}
                                                            onClick={() => toggleMapping(sub.id, sec.id)}
                                                            className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${isSelected ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-white text-slate-500 border-slate-200 hover:border-primary hover:text-primary'}`}
                                                        >
                                                            Section {sec.name}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-8 bg-slate-50 border-t border-border flex justify-between items-center">
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                {currentMappings.length} Active Mappings selected
                            </div>
                            <div className="flex gap-4">
                                <button 
                                    onClick={() => setMappingModal({ isOpen: false })}
                                    className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={saveMappings}
                                    disabled={mappingLoading}
                                    className="px-8 py-2.5 bg-primary text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                                >
                                    {mappingLoading ? 'Saving...' : 'Confirm Assignments'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FacultyManagement;
