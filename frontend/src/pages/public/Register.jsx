import React from 'react';
import { Link } from 'react-router-dom';

const Register = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-surface">
      <div className="max-w-3xl w-full text-center py-20 animate-in slide-in-from-bottom-8 duration-700">
        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent mb-6">
          Begin Your Academic Journey
        </h1>
        <p className="text-xl text-textSecondary mb-10 max-w-2xl mx-auto leading-relaxed">
          Ready to join the Master of Computer Applications (MCA) or start your BSc in Computer Science? 
          Our digitized admission portal requires only a few steps to submit your official application.
        </p>
        
        <div className="bg-background border border-border/50 rounded-3xl p-10 shadow-2xl max-w-lg mx-auto transform transition-all hover:scale-105 hover:border-primary/50 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all"></div>
          
          <div className="relative z-10">
            <div className="w-16 h-16 mx-auto bg-primary/20 text-primary rounded-full flex items-center justify-center text-3xl mb-6 shadow-lg shadow-primary/20">
              📝
            </div>
            
            <h3 className="text-2xl font-bold text-textPrimary mb-3">Online Admission Portal</h3>
            <p className="text-textSecondary mb-8 text-sm">
              Create your prospective student profile, upload necessary transcripts, and process application fees instantly.
            </p>
            
            <Link 
              to="/apply" 
              className="inline-flex w-full items-center justify-center px-6 py-4 rounded-xl text-primary-foreground bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 font-bold tracking-wide transition-all"
            >
              Start Official Application Now →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
