import { Heart, ShieldCheck, Clock, PhoneCall, Mail, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-20 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          
          {/* Brand & mission */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
                <Heart className="h-5 w-5 fill-white" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">
                Care<span className="text-emerald-500">Connect</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Empowering patients and doctors with secure online consultations, real-time appointments, digital prescriptions, and transparent healthcare.
            </p>
            <div className="flex items-center gap-3 text-xs text-emerald-400 font-medium">
              <ShieldCheck className="h-4 w-4" />
              <span>HIPAA-Compliant & Secure Data Architecture</span>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-white text-sm font-semibold mb-4 tracking-wider uppercase">
              Quick Links
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/doctors" className="hover:text-emerald-400 transition-colors">
                  Find Specialists
                </Link>
              </li>
              <li>
                <Link to="/medicines" className="hover:text-emerald-400 transition-colors">
                  Drug & Medicine Guide
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-emerald-400 transition-colors">
                  Doctor Portal Login
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-emerald-400 transition-colors">
                  Join as a Practitioner
                </Link>
              </li>
            </ul>
          </div>

          {/* Specialties */}
          <div>
            <h4 className="text-white text-sm font-semibold mb-4 tracking-wider uppercase">
              Top Specialties
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>Cardiology & Heart Care</li>
              <li>General Medicine & Pediatrics</li>
              <li>Dermatology & Skin Care</li>
              <li>Orthopedics & Joint Health</li>
              <li>Neurology & Mental Health</li>
            </ul>
          </div>

          {/* Contact / Emergency */}
          <div>
            <h4 className="text-white text-sm font-semibold mb-4 tracking-wider uppercase">
              Emergency & Support
            </h4>
            <div className="space-y-3 text-sm text-slate-400">
              <div className="flex items-center gap-2.5">
                <PhoneCall className="h-4 w-4 text-emerald-500" />
                <span>+1 (800) 456-7890 (24/7 Helpline)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-emerald-500" />
                <span>support@careconnect.health</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="h-4 w-4 text-emerald-500" />
                <span>Immediate Doctor Matching in &lt; 15 mins</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} CareConnect Health Technologies Inc. All rights reserved.</p>
          <div className="flex gap-6">
            <span className="hover:text-slate-400 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-400 cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-400 cursor-pointer">Medical Disclaimer</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
