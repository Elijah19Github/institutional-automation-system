import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const Admissions = () => {
    const { token } = useAuth();
    const [activeTab, setActiveTab] = useState('applications');
    const [applications, setApplications] = useState([]);
    const [provisionals, setProvisionals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Setup Data for Enrollment
    // (Removed unused setupData and sections states)

    // Action States
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [selectedAppId, setSelectedAppId] = useState(null);
    const [feeAmount, setFeeAmount] = useState('');

    // Enrollment Form States
    const [enrollForm, setEnrollForm] = useState({ batch_id: '', semester_id: '', section_id: '' });

    // Toast Message
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    };

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch Applications
            const appRes = await fetch('http://localhost:5000/api/admissions/applications', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const appData = await appRes.json();
            if (appData.success) setApplications(appData.data);

            // Fetch Provisional
            const provRes = await fetch('http://localhost:5000/api/admissions/provisional', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const provData = await provRes.json();
            if (provData.success) setProvisionals(provData.data);

            // (Setup and Sections removed)

        } catch (err) {
            console.error("Fetch Data Error:", err.message);
            setError("Failed to fetch dashboard data. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    const handleApplicationAction = async (id, status) => {
        if (status === 'accepted' && !feeAmount) {
            showToast('Fee amount is required to accept application.', 'error');
            return;
        }

        setIsActionLoading(true);
        try {
            const response = await fetch(`http://localhost:5000/api/admissions/applications/${id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status, fee_amount: status === 'accepted' ? parseFloat(feeAmount) : null })
            });
            const data = await response.json();

            if (data.success) {
                showToast(`Application ${status} successfully!`);
                setSelectedAppId(null);
                setFeeAmount('');
                fetchData(); // Refresh data completely
            } else {
                showToast(data.message || 'Error updating application.', 'error');
            }
        } catch (err) {
            console.error("Action error:", err.message);
            showToast('Network error during operation.', 'error');
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleEnrollment = async (provisionalId) => {
        if (!enrollForm.batch_id || !enrollForm.semester_id || !enrollForm.section_id) {
            showToast('Please select Batch, Semester, and Section to enroll.', 'error');
            return;
        }

        setIsActionLoading(true);
        try {
            const response = await fetch(`http://localhost:5000/api/admissions/provisional/${provisionalId}/pay`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(enrollForm)
            });
            const data = await response.json();

            if (data.success) {
                showToast(data.message);
                setEnrollForm({ batch_id: '', semester_id: '', section_id: '' });
                setSelectedAppId(null);
                fetchData();
            } else {
                showToast(data.message || 'Error processing enrollment.', 'error');
            }
        } catch (err) {
            console.error("Enrollment Error:", err.message);
            showToast('Network error during enrollment.', 'error');
        } finally {
            setIsActionLoading(false);
        }
    };


    return (
        <div className="space-y-6 relative">
            <h1 className="text-3xl font-bold text-foreground">Admissions Core Dashboard</h1>
            <p className="text-textSecondary">Manage incoming student applications, fee processing, and final enrollment allocation.</p>

            {/* Toast Notification */}
            {toast.show && (
                <div className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl shadow-2xl transition-all duration-300 transform translate-y-0 opacity-100 flex items-center gap-3 ${toast.type === 'error' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'}`}>
                    <span>{toast.type === 'error' ? '⚠️' : '✅'}</span>
                    <span className="font-medium">{toast.message}</span>
                </div>
            )}

            {/* Tabs */}
            <div className="flex border-b border-border/50">
                <button
                    onClick={() => setActiveTab('applications')}
                    className={`py-3 px-6 font-medium text-sm transition-colors border-b-2 ${activeTab === 'applications' ? 'border-primary text-primary bg-primary/10' : 'border-transparent text-textSecondary hover:text-textPrimary hover:bg-surface/50'}`}
                >
                    New Applications
                </button>
                <button
                    onClick={() => setActiveTab('provisional')}
                    className={`py-3 px-6 font-medium text-sm transition-colors border-b-2 ${activeTab === 'provisional' ? 'border-primary text-primary bg-primary/10' : 'border-transparent text-textSecondary hover:text-textPrimary hover:bg-surface/50'}`}
                >
                    Awaiting Enrollment / Processing
                </button>
                <button
                    onClick={() => setActiveTab('logs')}
                    className={`py-3 px-6 font-medium text-sm transition-colors border-b-2 ${activeTab === 'logs' ? 'border-primary text-primary bg-primary/10' : 'border-transparent text-textSecondary hover:text-textPrimary hover:bg-surface/50'}`}
                >
                    Decision Audit Logs
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
            ) : error ? (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-6 rounded-xl text-center">
                    ⚠️ {error}
                </div>
            ) : (
                <div className="bg-surface/50 backdrop-blur-md rounded-2xl border border-border/50 p-1 shadow-xl">

                    {/* Tab 1: New Applications */}
                    {activeTab === 'applications' && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-surface text-textPrimary text-sm border-b border-border">
                                    <tr>
                                        <th className="p-4 font-semibold rounded-tl-xl text-left">Applicant</th>
                                        <th className="p-4 font-semibold text-left">Program</th>
                                        <th className="p-4 font-semibold text-left">Contact</th>
                                        <th className="p-4 font-semibold text-left">Academic Info</th>
                                        <th className="p-4 font-semibold text-right rounded-tr-xl">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {applications.filter(a => a.status === 'pending').map(app => (
                                        <tr key={app.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                                            <td className="p-4">
                                                <div className="font-medium text-textPrimary">{app.first_name} {app.last_name}</div>
                                                <div className="text-xs text-textSecondary mt-0.5 max-w-[150px] truncate">{app.id}</div>
                                            </td>
                                            <td className="p-4">
                                                <span className="px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 rounded-md text-xs font-bold uppercase tracking-wider">
                                                    {app.course_interested || 'GEN'}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-sm text-textPrimary">{app.email}</div>
                                                <div className="text-xs text-textSecondary mt-0.5">{app.phone || 'N/A'}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-xs font-bold text-emerald-400">{app.previous_cgpa} %</div>
                                                <div className="text-[10px] text-textSecondary uppercase tracking-tighter truncate max-w-[120px]">{app.previous_degree}</div>
                                            </td>
                                            <td className="p-4 text-right">
                                                {selectedAppId === app.id ? (
                                                    <div className="flex flex-col items-end gap-2 animate-in fade-in slide-in-from-right-2">
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="number"
                                                                placeholder="Fee Amount (e.g 55000)"
                                                                className="w-40 bg-background border border-border rounded-lg px-3 py-1.5 text-sm text-textPrimary focus:outline-none focus:border-primary"
                                                                value={feeAmount}
                                                                onChange={e => setFeeAmount(e.target.value)}
                                                            />
                                                            <button
                                                                onClick={() => handleApplicationAction(app.id, 'accepted')}
                                                                disabled={isActionLoading}
                                                                className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                                                            >
                                                                Confirm Accept
                                                            </button>
                                                        </div>
                                                        <button
                                                            onClick={() => setSelectedAppId(null)}
                                                            className="text-xs text-textSecondary hover:text-textPrimary transition-colors"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => setSelectedAppId(app.id)}
                                                            className="bg-primary/20 hover:bg-primary hover:text-white text-primary px-4 py-1.5 rounded-lg text-sm font-medium transition-colors border border-primary/50"
                                                        >
                                                            Accept
                                                        </button>
                                                        <button
                                                            onClick={() => handleApplicationAction(app.id, 'rejected')}
                                                            disabled={isActionLoading}
                                                            className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border border-transparent hover:border-rose-500/20 disabled:opacity-50"
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {applications.filter(a => a.status === 'pending').length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="p-8 text-center text-textSecondary">
                                                <span className="text-4xl mb-3 block opacity-50">📬</span>
                                                <p>No new pending applications.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Tab 2: Provisional Admissions */}
                    {activeTab === 'provisional' && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-surface text-textPrimary text-sm border-b border-border">
                                    <tr>
                                        <th className="p-4 font-semibold rounded-tl-xl align-top text-left">Student Profile</th>
                                        <th className="p-4 font-semibold align-top text-left">Program</th>
                                        <th className="p-4 font-semibold align-top text-left">Fee Status</th>
                                        <th className="p-4 font-semibold align-top text-right rounded-tr-xl w-32">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {provisionals.filter(p => !p.is_paid).map(prov => (
                                        <tr key={prov.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                                            <td className="p-4 align-top">
                                                <div className="font-medium text-textPrimary">{prov.first_name} {prov.last_name}</div>
                                                <div className="text-xs text-textSecondary mt-1">{prov.email}</div>
                                            </td>
                                            <td className="p-4 align-top">
                                                <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded text-[10px] font-bold uppercase">
                                                    {prov.course_interested || 'VARIOUS'}
                                                </span>
                                            </td>
                                            <td className="p-4 align-top">
                                                <div className="text-emerald-400 font-bold tracking-wide">₹ {parseFloat(prov.fee_amount).toLocaleString('en-IN')}</div>
                                                <div className="text-[10px] text-emerald-500/80 font-medium mt-1 uppercase">
                                                    RECORDED: {new Date(prov.fee_deadline).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="p-4 align-top text-right">
                                                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                                                    Enrolled
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {provisionals.filter(p => !p.is_paid).length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="p-8 text-center text-textSecondary">
                                                <span className="text-4xl mb-3 block opacity-50">🎓</span>
                                                <p>No pending provisional enrollments.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Tab 3: Decision Audit Logs */}
                    {activeTab === 'logs' && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-surface text-textPrimary text-sm border-b border-border">
                                    <tr>
                                        <th className="p-4 font-semibold rounded-tl-xl align-top text-left">Applicant</th>
                                        <th className="p-4 font-semibold align-top text-center">Program</th>
                                        <th className="p-4 font-semibold align-top text-center w-32">Decision</th>
                                        <th className="p-4 font-semibold align-top">Processed By (IT Admin)</th>
                                        <th className="p-4 font-semibold rounded-tr-xl align-top text-right">Timestamp</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {applications.filter(a => a.status !== 'pending').map(app => (
                                        <tr key={app.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                                            <td className="p-4 align-top">
                                                <div className="font-medium text-textPrimary">{app.first_name} {app.last_name}</div>
                                                <div className="text-xs text-textSecondary mt-0.5">{app.email}</div>
                                            </td>
                                            <td className="p-4 align-top text-center">
                                                <span className="px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded text-[10px] font-bold">
                                                    {app.course_interested || 'VAR'}
                                                </span>
                                            </td>
                                            <td className="p-4 align-top text-center">
                                                <span className={`inline-block px-2.5 py-1 border rounded-md text-xs font-semibold uppercase tracking-wider ${app.status === 'accepted'
                                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                                    }`}>
                                                    {app.status}
                                                </span>
                                                {app.status === 'accepted' && (
                                                    <div className="mt-2">
                                                        <button 
                                                            onClick={() => {
                                                                const regNo = `26${app.course_interested || 'GEN'}${app.id.split('-')[0].toUpperCase().slice(0, 4)}`;
                                                                navigator.clipboard.writeText(`Email: ${app.email}\nRegNo: ${regNo}\nPassword: ${regNo}`);
                                                                showToast('Login credentials copied to clipboard!');
                                                            }}
                                                            className="text-[10px] text-primary hover:underline flex items-center justify-center gap-1 mx-auto"
                                                        >
                                                            <span>📋</span> Copy Login Info
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-4 align-top">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs text-textPrimary font-bold border border-border">
                                                        {(app.approved_by_name?.charAt(0) || '?').toUpperCase()}
                                                    </div>
                                                    <span className="text-sm font-medium text-textPrimary">{app.approved_by_name || 'System'}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 align-top text-right w-40">
                                                <div className="text-sm text-textPrimary font-mono">
                                                    {app.decision_date ? new Date(app.decision_date).toLocaleDateString() : 'N/A'}
                                                </div>
                                                <div className="text-[10px] text-textSecondary font-medium uppercase mt-0.5 tracking-tighter">
                                                    {app.decision_date ? new Date(app.decision_date).toLocaleTimeString() : ''}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {applications.filter(a => a.status !== 'pending').length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="p-8 text-center text-textSecondary">
                                                <span className="text-4xl mb-3 block opacity-50">📂</span>
                                                <p>No historical decisions found in the audit log.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                </div>
            )}
        </div>
    );
};

export default Admissions;
