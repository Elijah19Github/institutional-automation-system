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
    const [setupData, setSetupData] = useState({ batches: [], semesters: [] });
    const [sections, setSections] = useState([]);

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

            // Fetch Setup Data
            const setupRes = await fetch('http://localhost:5000/api/academic/setup', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const setupResData = await setupRes.json();
            if (setupResData.success) setSetupData(setupResData.data);

            // Fetch Sections
            const textRes = await fetch('http://localhost:5000/api/academic/sections', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const secData = await textRes.json();
            if (secData.success) setSections(secData.data);

        } catch (err) {
            console.error("Fetch Data Error:", err);
            setError("Failed to fetch dashboard data. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
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
            showToast('Network error during enrollment.', 'error');
        } finally {
            setIsActionLoading(false);
        }
    };


    return (
        <div className="space-y-6 relative">
            <h1 className="text-3xl font-bold text-slate-100">Admissions Core Dashboard</h1>
            <p className="text-slate-400">Manage incoming student applications, fee processing, and final enrollment allocation.</p>

            {/* Toast Notification */}
            {toast.show && (
                <div className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl shadow-2xl transition-all duration-300 transform translate-y-0 opacity-100 flex items-center gap-3 ${toast.type === 'error' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'}`}>
                    <span>{toast.type === 'error' ? '⚠️' : '✅'}</span>
                    <span className="font-medium">{toast.message}</span>
                </div>
            )}

            {/* Tabs */}
            <div className="flex border-b border-slate-700/50">
                <button
                    onClick={() => setActiveTab('applications')}
                    className={`py-3 px-6 font-medium text-sm transition-colors border-b-2 ${activeTab === 'applications' ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10' : 'border-transparent text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'}`}
                >
                    New Applications
                </button>
                <button
                    onClick={() => setActiveTab('provisional')}
                    className={`py-3 px-6 font-medium text-sm transition-colors border-b-2 ${activeTab === 'provisional' ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10' : 'border-transparent text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'}`}
                >
                    Awaiting Enrollment (Provisional)
                </button>
                <button
                    onClick={() => setActiveTab('logs')}
                    className={`py-3 px-6 font-medium text-sm transition-colors border-b-2 ${activeTab === 'logs' ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10' : 'border-transparent text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'}`}
                >
                    Decision Audit Logs
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
                </div>
            ) : error ? (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-6 rounded-xl text-center">
                    ⚠️ {error}
                </div>
            ) : (
                <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700/50 p-1 shadow-xl">

                    {/* Tab 1: New Applications */}
                    {activeTab === 'applications' && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-[#1e293b] text-slate-300 text-sm border-b border-slate-700">
                                    <tr>
                                        <th className="p-4 font-semibold rounded-tl-xl">Applicant</th>
                                        <th className="p-4 font-semibold">Contact</th>
                                        <th className="p-4 font-semibold">Degree / CGPA</th>
                                        <th className="p-4 font-semibold text-center mt-1">Status</th>
                                        <th className="p-4 font-semibold text-right rounded-tr-xl">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {applications.filter(a => a.status === 'pending').map(app => (
                                        <tr key={app.id} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                                            <td className="p-4">
                                                <div className="font-medium text-slate-200">{app.first_name} {app.last_name}</div>
                                                <div className="text-xs text-slate-500 mt-0.5 max-w-[150px] truncate">{app.id}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-sm text-slate-300">{app.email}</div>
                                                <div className="text-xs text-slate-500 mt-0.5">{app.phone || 'N/A'}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-sm text-slate-300 font-mono">{app.previous_degree}</div>
                                                <div className="text-xs font-bold text-emerald-400 mt-0.5">{app.previous_cgpa}</div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className="px-2.5 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-md text-xs font-semibold uppercase tracking-wider">
                                                    Pending
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                {selectedAppId === app.id ? (
                                                    <div className="flex flex-col items-end gap-2 animate-in fade-in slide-in-from-right-2">
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="number"
                                                                placeholder="Fee Amount (e.g 55000)"
                                                                className="w-40 bg-slate-900 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
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
                                                            className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => setSelectedAppId(app.id)}
                                                            className="bg-indigo-500/20 hover:bg-indigo-500 hover:text-white text-indigo-400 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors border border-indigo-500/50"
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
                                            <td colSpan="5" className="p-8 text-center text-slate-500">
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
                                <thead className="bg-[#1e293b] text-slate-300 text-sm border-b border-slate-700">
                                    <tr>
                                        <th className="p-4 font-semibold rounded-tl-xl align-top">Student</th>
                                        <th className="p-4 font-semibold align-top">Fee Details</th>
                                        <th className="p-4 font-semibold align-top" colSpan="2">Complete Enrollment Mapping</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {provisionals.filter(p => !p.is_paid).map(prov => (
                                        <tr key={prov.id} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                                            <td className="p-4 align-top w-1/4">
                                                <div className="font-medium text-slate-200">{prov.first_name} {prov.last_name}</div>
                                                <div className="text-xs text-slate-400 mt-1">{prov.email}</div>
                                            </td>
                                            <td className="p-4 align-top w-1/4">
                                                <div className="text-emerald-400 font-bold tracking-wide">₹ {parseFloat(prov.fee_amount).toLocaleString('en-IN')}</div>
                                                <div className="text-xs text-amber-500/80 mt-1">
                                                    Due: {new Date(prov.fee_deadline).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="p-4 align-top w-1/2" colSpan="2">
                                                {selectedAppId === prov.id ? (
                                                    <div className="bg-slate-900/50 p-4 rounded-xl border border-indigo-500/30 shadow-inner">
                                                        <h4 className="text-sm font-medium text-indigo-300 mb-3 border-b border-indigo-500/20 pb-2">Academic Allocation</h4>
                                                        <div className="grid grid-cols-2 gap-3 mb-4">
                                                            <div className="col-span-2 sm:col-span-1">
                                                                <label className="text-xs text-slate-400 block mb-1">Batch Year</label>
                                                                <select
                                                                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                                                                    value={enrollForm.batch_id}
                                                                    onChange={e => setEnrollForm({ ...enrollForm, batch_id: e.target.value })}
                                                                >
                                                                    <option value="">Select Batch...</option>
                                                                    {setupData.batches.map(b => <option key={b.id} value={b.id}>{b.name} ({b.entry_year})</option>)}
                                                                </select>
                                                            </div>
                                                            <div className="col-span-2 sm:col-span-1">
                                                                <label className="text-xs text-slate-400 block mb-1">Semester</label>
                                                                <select
                                                                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                                                                    value={enrollForm.semester_id}
                                                                    onChange={e => setEnrollForm({ ...enrollForm, semester_id: e.target.value })}
                                                                >
                                                                    <option value="">Select Semester...</option>
                                                                    {setupData.semesters.map(s => <option key={s.id} value={s.id}>{s.name} ({s.semester_number})</option>)}
                                                                </select>
                                                            </div>
                                                            <div className="col-span-2">
                                                                <label className="text-xs text-slate-400 block mb-1">Section Assignment</label>
                                                                <select
                                                                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                                                                    value={enrollForm.section_id}
                                                                    onChange={e => setEnrollForm({ ...enrollForm, section_id: e.target.value })}
                                                                    disabled={!enrollForm.batch_id || !enrollForm.semester_id}
                                                                >
                                                                    <option value="">Select Section...</option>
                                                                    {sections.filter(sec =>
                                                                        sec.batch === setupData.batches.find(b => b.id === enrollForm.batch_id)?.name &&
                                                                        sec.semester === setupData.semesters.find(s => s.id === enrollForm.semester_id)?.name
                                                                    ).map(sec => <option key={sec.id} value={sec.id}>{sec.name} (Cap: {sec.capacity})</option>)}
                                                                </select>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center justify-end gap-3 mt-4 pt-3 border-t border-slate-700">
                                                            <button
                                                                onClick={() => setSelectedAppId(null)}
                                                                className="text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
                                                            >
                                                                Cancel
                                                            </button>
                                                            <button
                                                                onClick={() => handleEnrollment(prov.id)}
                                                                disabled={isActionLoading}
                                                                className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex items-center gap-2"
                                                            >
                                                                {isActionLoading ? 'Processing...' : '💳 Confirm Fee & Enroll'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex justify-end h-full">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedAppId(prov.id);
                                                                setEnrollForm({ batch_id: '', semester_id: '', section_id: '' });
                                                            }}
                                                            className="bg-indigo-500/20 hover:bg-indigo-500 hover:text-white text-indigo-400 px-4 py-2 rounded-xl text-sm font-medium transition-all border border-indigo-500/50 shadow-sm"
                                                        >
                                                            Process Enrollment &rarr;
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {provisionals.filter(p => !p.is_paid).length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="p-8 text-center text-slate-500">
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
                                <thead className="bg-[#1e293b] text-slate-300 text-sm border-b border-slate-700">
                                    <tr>
                                        <th className="p-4 font-semibold rounded-tl-xl align-top text-left">Applicant</th>
                                        <th className="p-4 font-semibold align-top text-center w-32">Decision</th>
                                        <th className="p-4 font-semibold align-top">Processed By (IT Admin)</th>
                                        <th className="p-4 font-semibold rounded-tr-xl align-top text-right">Timestamp</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {applications.filter(a => a.status !== 'pending').map(app => (
                                        <tr key={app.id} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                                            <td className="p-4 align-top">
                                                <div className="font-medium text-slate-200">{app.first_name} {app.last_name}</div>
                                                <div className="text-xs text-slate-500 mt-0.5">{app.email}</div>
                                            </td>
                                            <td className="p-4 align-top text-center">
                                                <span className={`inline-block px-2.5 py-1 border rounded-md text-xs font-semibold uppercase tracking-wider ${app.status === 'accepted'
                                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                                    }`}>
                                                    {app.status}
                                                </span>
                                            </td>
                                            <td className="p-4 align-top">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs text-slate-300 font-bold border border-slate-600">
                                                        {(app.approved_by_name?.charAt(0) || '?').toUpperCase()}
                                                    </div>
                                                    <span className="text-sm font-medium text-slate-300">{app.approved_by_name || 'System Auto'}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 align-top text-right w-40">
                                                <div className="text-sm text-slate-300">
                                                    {app.decision_date ? new Date(app.decision_date).toLocaleDateString() : 'N/A'}
                                                </div>
                                                <div className="text-xs text-slate-500 mt-0.5">
                                                    {app.decision_date ? new Date(app.decision_date).toLocaleTimeString() : ''}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {applications.filter(a => a.status !== 'pending').length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="p-8 text-center text-slate-500">
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
