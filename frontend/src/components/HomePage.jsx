import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';

const HomePage = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/auth');
  };

  return (
    <div className="bg-white min-h-screen font-sans overflow-hidden">
      <Navbar />

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        {/* Background Colorful Accents */}
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[600px] h-[600px] bg-blue-100/40 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[400px] h-[400px] bg-purple-100/40 rounded-full blur-3xl -z-10"></div>

        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-left animate-fade-in">
            <span className="inline-block px-4 py-1.5 mb-6 text-sm font-bold tracking-wider text-blue-600 uppercase bg-blue-50 rounded-full">
              Manage Events Like a Pro
            </span>
            <h1 className="text-6xl lg:text-7xl font-extrabold text-slate-900 leading-tight mb-6">
              Plan <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Unforgettable</span> Moments
            </h1>
            <p className="text-xl text-slate-600 leading-relaxed max-w-lg mb-8">
              The ultimate platform for organizers and attendees. Create, manage, and promote your events with ease, all in one place.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-2xl hover:scale-105 active:scale-95 px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300"
              >
                Start Planning Free
              </button>
              <button className="flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-lg text-slate-700 hover:bg-slate-100 transition-colors duration-300">
                <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                Watch Demo
              </button>
            </div>

            <div className="mt-12 flex items-center gap-4 text-sm text-slate-500 font-medium">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className={`w-10 h-10 rounded-full border-2 border-white bg-slate-200`}></div>
                ))}
              </div>
              <p><span className="text-slate-900 font-bold">10k+</span> planners already using EventManager</p>
            </div>
          </div>

          <div className="relative group perspective-1000">
            <div className="absolute inset-0 bg-blue-600/10 rounded-3xl blur-2xl group-hover:bg-blue-600/20 transition-all duration-500"></div>
            <img
              src="/hero.png"
              alt="Events Display"
              className="relative w-full rounded-3xl shadow-2xl transform transition-transform duration-500 group-hover:rotate-1 group-hover:scale-[1.02]"
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-blue-50/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: 'Events Hosted', value: '50k+', color: 'text-blue-600' },
              { label: 'Tickets Sold', value: '1.2M', color: 'text-indigo-600' },
              { label: 'Happy Users', value: '20k+', color: 'text-purple-600' },
              { label: 'Countries', value: '45+', color: 'text-pink-600' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className={`text-4xl font-extrabold mb-2 ${stat.color}`}>{stat.value}</div>
                <div className="text-slate-600 font-semibold">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 max-w-7xl mx-auto px-6 text-center">
        <div className="mb-16">
          <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Why Choose Us?</h2>
          <p className="text-slate-600 max-w-2xl mx-auto text-lg">Powerful features to make your event a massive success without the stress.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 text-left">
          {[
            {
              title: 'Automated Booking',
              desc: 'Streamline registration with smart workflows and instant confirmation.',
              gradient: 'from-orange-400 to-red-500',
              icon: '⚡'
            },
            {
              title: 'Live interaction',
              desc: 'Engage your audience with live polling, Q&A, and real-time chat.',
              gradient: 'from-blue-400 to-indigo-500',
              icon: '🔥'
            },
            {
              title: 'Deep Analytics',
              desc: 'Get insights into attendance, revenue, and attendee behavior.',
              gradient: 'from-emerald-400 to-teal-500',
              icon: '📈'
            }
          ].map((feature, i) => (
            <div key={i} className="p-8 rounded-3xl bg-white border border-slate-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-3xl mb-6 shadow-lg`}>
                {feature.icon}
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">{feature.title}</h3>
              <p className="text-slate-600 leading-relaxed font-medium">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer / Call to Action */}
      <section className="bg-slate-900 py-20 px-6 mt-12 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-8 leading-tight">Ready to launch your <br /> next big event?</h2>
          <div className="flex justify-center gap-6">
            <button
              onClick={handleGetStarted}
              className="bg-white text-slate-900 px-10 py-4 rounded-2xl font-bold text-lg hover:bg-blue-50 transition-colors duration-300"
            >
              Get Started Now
            </button>
            <button className="border-2 border-white/20 text-white px-10 py-4 rounded-2xl font-bold text-lg hover:bg-white/10 transition-colors duration-300">
              Contact Sales
            </button>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] -z-0"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] -z-0"></div>
      </section>
    </div>
  );
};

export default HomePage;
