import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import logo from '../../assets/logo.jpg';

interface StatusPageProps {
  code: string;
  title: string;
  description: string;
}

const StatusPage: React.FC<StatusPageProps> = ({ code, title, description }) => (
  <div className="app-canvas flex min-h-screen items-center justify-center px-4 py-12">
    <div className="surface-panel relative w-full max-w-lg overflow-hidden p-8 text-center sm:p-10">
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-blue-600 via-green-500 to-orange-500" />
      <img
        src={logo}
        alt="Université Privée Attawoune"
        className="mx-auto h-20 w-20 rounded-3xl border-4 border-white bg-white object-cover shadow-soft"
      />
      <p className="mt-6 text-6xl font-black tracking-tight text-blue-900">{code}</p>
      <h1 className="mt-4 text-2xl font-black text-slate-950">{title}</h1>
      <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500">{description}</p>
      <Link to="/dashboard" className="brand-button mt-7">
        <ArrowLeftIcon className="h-5 w-5 rtl:rotate-180" />
        Retour au tableau de bord
      </Link>
    </div>
  </div>
);

export default StatusPage;
