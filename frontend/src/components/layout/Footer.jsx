import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 border-t border-white/10">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <span className="text-xl">🛡️</span>
              </div>
              <span className="text-xl font-bold text-white">AnLink</span>
            </div>
            <p className="text-blue-200/70 text-sm leading-relaxed">
              Protecting Vietnamese users from online scams and fraudulent websites through 
              community-driven reporting and advanced URL analysis.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/" className="text-blue-200/70 hover:text-cyan-400 transition flex items-center">
                  <span className="mr-2">→</span> Home
                </Link>
              </li>
              <li>
                <Link to="/check" className="text-blue-200/70 hover:text-cyan-400 transition flex items-center">
                  <span className="mr-2">→</span> Check URL
                </Link>
              </li>
              <li>
                <Link to="/education" className="text-blue-200/70 hover:text-cyan-400 transition flex items-center">
                  <span className="mr-2">→</span> Education
                </Link>
              </li>
              <li>
                <Link to="/reports" className="text-blue-200/70 hover:text-cyan-400 transition flex items-center">
                  <span className="mr-2">→</span> Report Phishing
                </Link>
              </li>
            </ul>
          </div>

          {/* Features */}
          <div>
            <h3 className="text-white font-semibold mb-4">Features</h3>
            <ul className="space-y-3 text-sm">
              <li className="text-blue-200/70 flex items-center">
                <span className="mr-2">🔍</span> Real-time URL Analysis
              </li>
              <li className="text-blue-200/70 flex items-center">
                <span className="mr-2">🎯</span> Pattern Detection
              </li>
              <li className="text-blue-200/70 flex items-center">
                <span className="mr-2">👥</span> Community Reports
              </li>
              <li className="text-blue-200/70 flex items-center">
                <span className="mr-2">📚</span> Security Education
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contact</h3>
            <ul className="space-y-3 text-sm text-blue-200/70">
              <li className="flex items-center">
                <span className="mr-2">📧</span> support@anlink.vn
              </li>
              <li className="flex items-center">
                <span className="mr-2">📞</span> +84 (024) 1234-5678
              </li>
              <li className="flex items-center">
                <span className="mr-2">📍</span> Hanoi, Vietnam
              </li>
            </ul>
            
            {/* Social Links */}
            <div className="flex space-x-3 mt-6">
              <a href="#" className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-blue-200/70 hover:bg-cyan-500 hover:text-white transition-all">
                <span>📱</span>
              </a>
              <a href="#" className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-blue-200/70 hover:bg-cyan-500 hover:text-white transition-all">
                <span>💬</span>
              </a>
              <a href="#" className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-blue-200/70 hover:bg-cyan-500 hover:text-white transition-all">
                <span>🌐</span>
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-blue-200/50">
            <p>&copy; {currentYear} AnLink. All rights reserved.</p>
            <p className="mt-2 md:mt-0">
              COMP1682 Final Year Project • Anti-Phishing System
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
