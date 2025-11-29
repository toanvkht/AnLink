import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 text-white mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About */}
          <div>
            <h3 className="text-lg font-bold mb-4">About AnLink</h3>
            <p className="text-gray-400 text-sm">
              AnLink is a community-driven anti-phishing platform designed to protect Vietnamese users
              from online scams and fraudulent websites.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-gray-400 hover:text-white transition">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/check" className="text-gray-400 hover:text-white transition">
                  Check URL
                </Link>
              </li>
              <li>
                <Link to="/education" className="text-gray-400 hover:text-white transition">
                  Education
                </Link>
              </li>
              <li>
                <Link to="/reports" className="text-gray-400 hover:text-white transition">
                  Report Phishing
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-bold mb-4">Contact</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>📧 Email: support@anlink.vn</li>
              <li>📞 Phone: +84 (024) 1234-5678</li>
              <li>📍 Location: Hanoi, Vietnam</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-6 text-center text-sm text-gray-400">
          <p>&copy; {currentYear} AnLink. All rights reserved.</p>
          <p className="mt-2">COMP1682 Final Year Project - Anti-Phishing System</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;