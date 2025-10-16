import React, { useState, useContext } from "react";
import { MyContext } from "./MyContext";


const ResumeAnalysisPage = () => {
  // Replace with actual context
   const { auth } = useContext(MyContext); // Get userId from context;
  
  const [jobDescription, setJobDescription] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const userId = auth.userId;

  const analyzeResume = async () => {
    if (!jobDescription) return alert("Please enter a job description.");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/resume_analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, job_details: jobDescription }),
      });
      const data = await res.json();
      setAnalysis(data);
    } catch (err) {
      console.error(err);
      alert("Error analyzing resume");
    } finally {
      setLoading(false);
    }
  };

  const RadialProgress = ({ score, size = 140 }) => {
    const radius = size / 2 - 10;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    
    const getColor = (score) => {
      if (score >= 80) return "#10b981";
      if (score >= 60) return "#f59e0b";
      return "#ef4444";
    };

    return (
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }} className="drop-shadow-lg">
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth="8" />
        <circle 
          cx={size/2} 
          cy={size/2} 
          r={radius} 
          fill="none" 
          stroke={getColor(score)}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s ease", filter: "drop-shadow(0 0 8px rgba(0,0,0,0.1))" }}
        />
      </svg>
    );
  };

  const AnimatedBar = ({ label, score, section }) => {
    const getBackgroundColor = (score) => {
      if (score >= 80) return "bg-green-500";
      if (score >= 60) return "bg-yellow-500";
      return "bg-red-500";
    };

    return (
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="font-medium text-gray-700 capitalize">{label}</span>
          <span className="text-sm font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3 py-1 rounded-full">{score}%</span>
        </div>
        <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden shadow-sm">
          <div
            className={`h-full ${getBackgroundColor(score)} rounded-full transition-all duration-1000 ease-out`}
            style={{ width: `${score}%`, boxShadow: `0 0 10px ${getBackgroundColor(score) === 'bg-green-500' ? 'rgba(16, 185, 129, 0.5)' : getBackgroundColor(score) === 'bg-yellow-500' ? 'rgba(245, 158, 11, 0.5)' : 'rgba(239, 68, 68, 0.5)'}` }}
          />
        </div>
      </div>
    );
  };

  const ScoreCard = ({ section, data }) => {
    const getTextColor = (score) => {
      if (score >= 80) return "text-green-600";
      if (score >= 60) return "text-yellow-600";
      return "text-red-600";
    };

    return (
      <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold text-gray-600 uppercase tracking-wider">{section}</span>
          <span className={`text-2xl font-bold ${getTextColor(data.score)}`}>{data.score}%</span>
        </div>
        <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${getTextColor(data.score).replace('text-', 'bg-')}`}
            style={{ width: `${data.score}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-lg">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 py-16 text-center">
          <h1 className="text-5xl font-bold mb-3 drop-shadow-lg">Resume Analysis</h1>
          <p className="text-lg text-indigo-100">Get detailed insights on how well your resume matches the job description</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Input Section */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl p-8 shadow-md border border-gray-100">
            <label className="block text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide">Job Description</label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here to analyze how well your resume matches..."
              className="w-full p-4 border-2 border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition resize-none font-medium"
              rows={7}
            />
            <button
              onClick={analyzeResume}
              disabled={loading}
              className="mt-6 w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white py-4 px-6 rounded-lg font-bold transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-3 uppercase tracking-wider text-lg"
            >
              {loading ? (
                <>
                  <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Analyzing Resume...</span>
                </>
              ) : (
                <>
                  <span>🚀</span>
                  <span>Analyze Resume</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Section */}
        {analysis && (
          <div className="space-y-8 animate-fadeIn">
            {/* Overall Score Card */}
            <div className="bg-white rounded-2xl p-12 shadow-md border border-gray-100">
              <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Overall Match Score</h2>
              <div className="flex justify-center items-center gap-8">
                <div className="relative w-56 h-56">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <RadialProgress score={analysis.overall_match_score} size={180} />
                  </div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      {analysis.overall_match_score}%
                    </div>
                    <div className="text-sm text-gray-500 font-semibold mt-2">Match Score</div>
                  </div>
                </div>
                <div className="flex-1 space-y-4">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                    <p className="text-sm text-green-700 font-semibold">✓ Strong Areas</p>
                    <p className="text-xs text-green-600 mt-1">Your resume shows good alignment with the job requirements</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                    <p className="text-sm text-blue-700 font-semibold">📊 Detailed Analysis</p>
                    <p className="text-xs text-blue-600 mt-1">Check all sections below for personalized improvements</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Section Scores Grid */}
            <div className="bg-white rounded-2xl p-8 shadow-md border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-800 mb-8">Section Breakdown</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {Object.entries(analysis.sections).map(([section, data]) => (
                  <ScoreCard key={section} section={section} data={data} />
                ))}
              </div>
            </div>

            {/* Detailed Scores */}
            <div className="bg-white rounded-2xl p-8 shadow-md border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-800 mb-8">Detailed Scores</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {Object.entries(analysis.sections).map(([section, data]) => (
                  <AnimatedBar key={section} label={section} score={data.score} section={section} />
                ))}
              </div>
            </div>

            {/* Tabs Section */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
              <div className="flex border-b border-gray-200 bg-gray-50">
                {[
                  { id: "overview", label: "Overview", icon: "📋" },
                  { id: "missing", label: "Missing Items", icon: "❌" },
                  { id: "suggestions", label: "Suggestions", icon: "💡" }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-5 px-6 font-bold transition-all border-b-4 uppercase tracking-wide text-sm ${
                      activeTab === tab.id
                        ? "bg-white text-indigo-600 border-indigo-600 shadow-sm"
                        : "text-gray-600 border-transparent hover:text-indigo-600 hover:bg-gray-100"
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-8">
                {activeTab === "overview" && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border-2 border-indigo-200">
                      <h3 className="text-lg font-bold text-indigo-900 mb-3">📝 Summary</h3>
                      <p className="text-indigo-800 leading-relaxed font-medium">{analysis.summary}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                      {Object.entries(analysis.sections).map(([section, data]) => (
                        <div key={section} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200 text-center">
                          <div className="text-3xl font-bold text-indigo-600 mb-2">{data.score}%</div>
                          <div className="text-xs font-bold text-gray-600 uppercase tracking-wide">{section}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === "missing" && (
                  <div className="space-y-4 animate-fadeIn">
                    {Object.entries(analysis.sections).map(([section, data]) => 
                      data.missing.length > 0 && (
                        <div key={section} className="bg-gradient-to-br from-red-50 to-orange-50 rounded-lg p-6 border-2 border-red-200">
                          <h3 className="font-bold text-red-900 capitalize mb-3 text-lg">❌ {section}</h3>
                          <ul className="space-y-2">
                            {data.missing.map((item, idx) => (
                              <li key={idx} className="text-red-800 flex items-start gap-3">
                                <span className="text-red-500 font-bold mt-0.5">•</span>
                                <span className="font-medium">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )
                    )}
                    {!Object.values(analysis.sections).some(s => s.missing.length > 0) && (
                      <div className="text-center py-12">
                        <div className="text-5xl mb-3">✨</div>
                        <p className="text-gray-600 font-bold text-lg">No missing items detected!</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "suggestions" && (
                  <div className="space-y-4 animate-fadeIn">
                    {Object.entries(analysis.sections).map(([section, data]) => 
                      data.suggestions.length > 0 && (
                        <div key={section} className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border-2 border-green-200">
                          <h3 className="font-bold text-green-900 capitalize mb-3 text-lg">💡 {section}</h3>
                          <ul className="space-y-2">
                            {data.suggestions.map((suggestion, idx) => (
                              <li key={idx} className="text-green-800 flex items-start gap-3">
                                <span className="text-green-500 font-bold mt-0.5">✓</span>
                                <span className="font-medium">{suggestion}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )
                    )}
                    {!Object.values(analysis.sections).some(s => s.suggestions.length > 0) && (
                      <div className="text-center py-12">
                        <div className="text-5xl mb-3">⭐</div>
                        <p className="text-gray-600 font-bold text-lg">No suggestions at this time!</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ResumeAnalysisPage;