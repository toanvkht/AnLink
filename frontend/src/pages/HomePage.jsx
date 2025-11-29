import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const HomePage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/30 rounded-full blur-3xl"></div>
          <div className="absolute top-60 -left-40 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/3 w-60 h-60 bg-purple-500/20 rounded-full blur-3xl"></div>
        </div>

        <div className="relative container mx-auto px-4 py-20 md:py-32">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-lg rounded-full border border-white/20 mb-8">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
              <span className="text-blue-200 text-sm">Protecting users 24/7</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Stay Safe from{' '}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Phishing Attacks
              </span>
            </h1>
            
            <p className="text-xl text-blue-200/80 mb-10 max-w-2xl mx-auto leading-relaxed">
              AnLink helps Vietnamese users identify and avoid fraudulent websites through
              community-driven reporting and advanced URL analysis powered by AI.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/check"
                className="group bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-2xl shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all transform hover:scale-105"
              >
                <span className="flex items-center justify-center">
                  <span className="mr-2">🔍</span>
                  Check URL Now
                  <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </Link>
              {!isAuthenticated && (
                <Link
                  to="/register"
                  className="bg-white/10 backdrop-blur-lg border border-white/20 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/20 transition-all"
                >
                  Get Started Free
                </Link>
              )}
            </div>

            {/* Trust Indicators */}
            <div className="mt-16 flex flex-wrap justify-center gap-8 text-blue-200/60 text-sm">
              <div className="flex items-center">
                <span className="mr-2">✓</span> Free to use
              </div>
              <div className="flex items-center">
                <span className="mr-2">✓</span> No registration required
              </div>
              <div className="flex items-center">
                <span className="mr-2">✓</span> Instant results
              </div>
              <div className="flex items-center">
                <span className="mr-2">✓</span> Vietnamese focused
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              How AnLink Protects You
            </h2>
            <p className="text-blue-200/70 max-w-2xl mx-auto">
              Our multi-layered approach ensures comprehensive protection against phishing threats
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 hover:border-cyan-500/50 transition-all group">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Real-Time Analysis</h3>
              <p className="text-blue-200/70 leading-relaxed">
                Our advanced algorithm analyzes URL components, domain similarity, and suspicious
                patterns to detect phishing attempts instantly.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 hover:border-cyan-500/50 transition-all group">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="text-2xl">👥</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Community Reporting</h3>
              <p className="text-blue-200/70 leading-relaxed">
                Report suspicious websites and help protect others. Our community of users and
                moderators work together to identify new threats.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 hover:border-cyan-500/50 transition-all group">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="text-2xl">📚</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Educational Resources</h3>
              <p className="text-blue-200/70 leading-relaxed">
                Learn how to recognize phishing attempts with our localized Vietnamese-language
                guides and interactive security awareness content.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-20">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 backdrop-blur-lg rounded-3xl p-10 md:p-16 border border-white/10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div className="p-4">
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">10K+</div>
                <div className="text-blue-200/70">URLs Scanned</div>
              </div>
              <div className="p-4">
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">500+</div>
                <div className="text-blue-200/70">Threats Blocked</div>
              </div>
              <div className="p-4">
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">1K+</div>
                <div className="text-blue-200/70">Active Users</div>
              </div>
              <div className="p-4">
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">24/7</div>
                <div className="text-blue-200/70">Protection</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-blue-200/70 max-w-2xl mx-auto">
              Three simple steps to protect yourself from phishing
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl border-2 border-cyan-500">
                1
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Paste URL</h3>
              <p className="text-blue-200/70">
                Copy and paste any suspicious URL into our scanner
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl border-2 border-cyan-500">
                2
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Analysis</h3>
              <p className="text-blue-200/70">
                Our algorithm analyzes the URL using multiple detection methods
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl border-2 border-cyan-500">
                3
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Get Results</h3>
              <p className="text-blue-200/70">
                Receive instant feedback with detailed risk assessment
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="bg-gradient-to-br from-blue-600/30 to-cyan-600/30 backdrop-blur-lg rounded-3xl p-12 md:p-16 border border-white/10 max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Stay Safe Online?
            </h2>
            <p className="text-xl text-blue-200/80 mb-8">
              Join thousands of users protecting themselves from phishing attacks.
            </p>
            <Link
              to={isAuthenticated ? '/check' : '/register'}
              className="inline-flex items-center bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-2xl shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all transform hover:scale-105"
            >
              {isAuthenticated ? (
                <>
                  <span className="mr-2">🔍</span>
                  Check URL Now
                </>
              ) : (
                <>
                  <span className="mr-2">🚀</span>
                  Create Free Account
                </>
              )}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
