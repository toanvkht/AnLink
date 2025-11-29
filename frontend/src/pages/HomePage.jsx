import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';

const HomePage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-800 mb-6">
            🛡️ Protect Yourself from Phishing
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            AnLink helps Vietnamese users identify and avoid fraudulent websites through
            community-driven reporting and advanced URL analysis.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/check"
              className="bg-blue-600 text-white px-8 py-4 rounded-lg font-medium hover:bg-blue-700 transition text-lg"
            >
              Check URL Now
            </Link>
            {!isAuthenticated && (
              <Link
                to="/register"
                className="bg-white text-blue-600 border-2 border-blue-600 px-8 py-4 rounded-lg font-medium hover:bg-blue-50 transition text-lg"
              >
                Get Started Free
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
          How AnLink Protects You
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Real-Time URL Analysis</h3>
            <p className="text-gray-600">
              Our advanced algorithm analyzes URL components, domain similarity, and suspicious
              patterns to detect phishing attempts instantly.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Community Reporting</h3>
            <p className="text-gray-600">
              Report suspicious websites and help protect others. Our community of users and
              moderators work together to identify new threats.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Educational Resources</h3>
            <p className="text-gray-600">
              Learn how to recognize phishing attempts with our localized Vietnamese-language
              guides and interactive quizzes.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-blue-600 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">10,000+</div>
              <div className="text-blue-200">URLs Scanned</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-blue-200">Phishing Sites Blocked</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">1,000+</div>
              <div className="text-blue-200">Community Members</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">24/7</div>
              <div className="text-blue-200">Protection</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Ready to Stay Safe Online?</h2>
        <p className="text-xl text-gray-600 mb-8">
          Join thousands of users protecting themselves from phishing attacks.
        </p>
        <Link
          to={isAuthenticated ? '/check' : '/register'}
          className="bg-blue-600 text-white px-8 py-4 rounded-lg font-medium hover:bg-blue-700 transition text-lg inline-block"
        >
          {isAuthenticated ? 'Check URL Now' : 'Create Free Account'}
        </Link>
      </section>
    </div>
  );
};

export default HomePage;