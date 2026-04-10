import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/api';
import { useAuth } from '../context/AuthContext';

const StudentRiskAnalysis = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token } = useAuth();
    
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRiskData = async () => {
            try {
                const res = await API.get(`/admin/student-risk/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.data.success) {
                    setData(res.data.data);
                } else {
                    setError('Failed to fetch data.');
                }
            } catch (err) {
                console.error(err);
                setError('Failed to load risk analysis.');
            } finally {
                setLoading(false);
            }
        };

        fetchRiskData();
    }, [id, token]);

    if (loading) return <div className="p-12 text-center text-textSecondary animate-pulse font-bold text-xl">Loading AI Risk Engine Analysis...</div>;
    if (error) return <div className="p-8 text-rose-500 font-bold bg-rose-500/10 rounded-2xl border border-rose-500/20 max-w-2xl mx-auto mt-10 text-center">{error}</div>;
    if (!data) return null;

    const { student, attendance, marks, ai_analysis, summary } = data;
    
    // Safety check for AI parsing
    const riskLevel = ai_analysis?.risk_level || 'Safe';
    const probability = ai_analysis?.probability || 0;
    
    let riskColor = 'emerald';
    if (riskLevel.toLowerCase() === 'high' || probability > 0.7) riskColor = 'rose';
    else if (riskLevel.toLowerCase() === 'medium' || probability > 0.4) riskColor = 'amber';

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-12">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button 
                    onClick={() => navigate(-1)}
                    className="p-3 bg-surface hover:bg-secondary border border-border rounded-xl transition-all text-textSecondary hover:text-primary shadow-sm"
                >
                    ← Back
                </button>
                <div>
                    <h1 className="text-3xl font-black text-textPrimary tracking-tight">AI Risk Insights</h1>
                    <p className="text-textSecondary font-medium text-sm mt-1 uppercase tracking-widest">
                        {student.name} • {student.enrollment_number}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* AI Score Card */}
                <div className={`col-span-1 bg-surface border-2 rounded-3xl p-8 shadow-2xl relative overflow-hidden ${
                    riskColor === 'rose' ? 'border-rose-500/50 bg-rose-500/5' :
                    riskColor === 'amber' ? 'border-amber-500/50 bg-amber-500/5' :
                    'border-emerald-500/50 bg-emerald-500/5'
                }`}>
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-50"></div>
                    
                    <div className="text-xs font-black uppercase tracking-widest text-textSecondary mb-8 text-center">Calculated Drop-out / Failure Probability</div>
                    
                    <div className="flex justify-center mb-8">
                        <div className={`relative flex items-center justify-center w-48 h-48 rounded-full border-8 ${
                            riskColor === 'rose' ? 'border-rose-500/20 text-rose-500' :
                            riskColor === 'amber' ? 'border-amber-500/20 text-amber-500' :
                            'border-emerald-500/20 text-emerald-500'
                        }`}>
                            <div className="absolute inset-0 rounded-full border-t-8 border-current animate-spin" style={{ animationDuration: '3s' }}></div>
                            <div className="text-center">
                                <span className="text-6xl font-black block leading-none">{(probability * 100).toFixed(0)}</span>
                                <span className="text-sm font-bold opacity-80">%</span>
                            </div>
                        </div>
                    </div>

                    <div className={`text-center py-3 rounded-xl font-bold uppercase tracking-widest text-sm border ${
                        riskColor === 'rose' ? 'bg-rose-500 text-white border-rose-600' :
                        riskColor === 'amber' ? 'bg-amber-500 text-white border-amber-600' :
                        'bg-emerald-500 text-white border-emerald-600'
                    }`}>
                        Risk Level: {riskLevel}
                    </div>
                </div>

                {/* AI Findings / Summary */}
                <div className="col-span-1 lg:col-span-2 space-y-6">
                    <div className="bg-surface rounded-3xl border border-border p-8 shadow-sm h-full flex flex-col">
                        <h3 className="text-xl font-black text-textPrimary mb-6 flex items-center gap-3">
                            <span className="p-2 bg-primary/10 text-primary rounded-lg text-lg">🧠</span> Engine Assessment
                        </h3>
                        
                        <div className="flex-1 bg-background/50 rounded-2xl p-6 border border-border text-textPrimary text-lg leading-relaxed mb-6 font-medium">
                            "{summary}"
                        </div>

                        {ai_analysis.reasons && ai_analysis.reasons.length > 0 && (
                            <div>
                                <h4 className="text-sm font-bold text-textSecondary uppercase tracking-widest mb-4">Identified Flag Factors:</h4>
                                <ul className="space-y-3">
                                    {ai_analysis.reasons.map((reason, idx) => (
                                        <li key={idx} className="flex gap-3 items-start bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl">
                                            <span className="text-rose-500 text-xl leading-none">⚠️</span>
                                            <span className="text-rose-400 font-medium">{reason}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        
                        {(!ai_analysis.reasons || ai_analysis.reasons.length === 0) && (
                            <div className="flex gap-3 items-center bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl text-emerald-400 font-bold">
                                <span>✅</span> Student metrics are operating within expected academic bounds.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Granular Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="bg-surface rounded-3xl border border-border p-8 shadow-sm">
                    <h3 className="text-lg font-black text-textPrimary mb-6 border-b border-border pb-4">Attendance Impact</h3>
                    <div className="space-y-4">
                        {attendance.length === 0 && <p className="text-textSecondary">No data available.</p>}
                        {attendance.map((sub, i) => (
                            <div key={i} className="flex justify-between items-center bg-background p-4 rounded-xl border border-border">
                                <span className="font-medium text-textPrimary truncate mr-4">{sub.course_name}</span>
                                <span className={`font-black tracking-wider ${Number(sub.rate) < 75 ? 'text-rose-500 bg-rose-500/10 px-2 py-1 rounded' : 'text-emerald-500'}`}>{sub.rate}%</span>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="bg-surface rounded-3xl border border-border p-8 shadow-sm">
                    <h3 className="text-lg font-black text-textPrimary mb-6 border-b border-border pb-4">Performance Impact</h3>
                    <div className="space-y-4">
                        {marks.length === 0 && <p className="text-textSecondary">No data available.</p>}
                        {marks.map((sub, i) => (
                            <div key={i} className="flex justify-between items-center bg-background p-4 rounded-xl border border-border">
                                <span className="font-medium text-textPrimary truncate mr-4">{sub.course_name}</span>
                                <span className={`font-black tracking-wider ${Number(sub.avg_score) < 50 ? 'text-rose-500 bg-rose-500/10 px-2 py-1 rounded' : 'text-blue-500'}`}>{sub.avg_score}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            
            {/* Action Buttons */}
            <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm flex items-center justify-between mt-6">
                <div className="text-textSecondary font-medium">Recommended Action:</div>
                <div className="flex gap-4">
                    {riskColor !== 'emerald' && (
                        <button className="px-6 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-rose-500/30 active:scale-95">
                            Issue Defaulter Notice
                        </button>
                    )}
                    <button className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/30 active:scale-95">
                        Schedule Meeting
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StudentRiskAnalysis;
